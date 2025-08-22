import { App, Editor, MarkdownView, Notice, Plugin, PluginSettingTab, Setting, TFile } from 'obsidian';
import * as path from 'path';
import * as fs from 'fs';
import { moment } from 'obsidian';

import { ArticleExporterSettings, IArticleExporter } from './types';
import { DEFAULT_SETTINGS } from './constants/default-settings';
import { getLanguageStrings } from './services/language-service';
import { PrefixPathSelectionModal } from './components/prefix-path-modal';
import { SampleModal } from './components/sample-modal';
import { generateImageUrl, getFileExtension, generateImageFileName } from './utils/path-utils';
import { saveImageFile, saveArticleFile } from './utils/file-utils';

export default class ArticleExporter extends Plugin implements IArticleExporter {
	settings: ArticleExporterSettings;

	async onload() {
		await this.loadSettings();

		// 导出命令（多语言）
		this.addCommand({
			id: 'export-current-note',
			name: getLanguageStrings(this.app).exportCurrentNote,
			callback: async () => {
				console.log('导出命令被触发');
				const activeFile = this.app.workspace.getActiveFile();
				console.log('活动文件:', activeFile?.basename);
				if (activeFile) {
					if (this.settings.defaultPrefixPath || (this.settings.prefixPaths && this.settings.prefixPaths.length > 0)) {
						if (this.settings.defaultPrefixPath) {
							await this.exportNoteToFile(activeFile, this.settings.defaultPrefixPath);
						} else {
							new PrefixPathSelectionModal(this.app, this as unknown as IArticleExporter, activeFile, async (selectedPath: string) => {
								await this.exportNoteToFile(activeFile, selectedPath);
							}).open();
						}
					} else {
						await this.exportNoteToFile(activeFile, '');
					}
				} else {
					new Notice(getLanguageStrings(this.app).noActiveNote);
				}
			}
		});

		// 设置页
		this.addSettingTab(new ArticleExporterSettingTab(this.app, this));
	}

	onunload() {}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	// 导出笔记到文件
	async exportNoteToFile(file: TFile, selectedPrefixPath: string = ''): Promise<void> {
		console.log('开始导出文件:', file.basename);
		console.log('导出目录:', this.settings.exportDirectory);
		console.log('选择的前缀路径:', selectedPrefixPath);
		
		const data = await this.app.vault.read(file);
		const exportDir = this.settings.exportDirectory;

		if (!exportDir) {
			new Notice(getLanguageStrings(this.app).setExportDirectoryFirst);
			return;
		}

		// 创建时间戳目录
		const timestamp = moment().format('X');
		const imageDir = path.join(exportDir, timestamp);
		// 确保目录存在
		fs.mkdirSync(imageDir, { recursive: true });

		// 解析文章，查找图片
		const imageRegex = /!\[.*?\]\((.*?)\)|!\[\[(.*?)(?:\|(\d+))?\]\]/g;
		let match: RegExpExecArray | null;
		let imageIndex = 1;
		let updatedData = data;

		while ((match = imageRegex.exec(data)) !== null) {
			const imagePath = match[1] || match[2];
			if (!imagePath) continue;

			console.log('找到图片路径:', imagePath);
			const specifiedWidth = match[3] ? parseInt(match[3], 10) : null;
			const imageFile = this.app.metadataCache.getFirstLinkpathDest(imagePath, file.path);

			if (imageFile instanceof TFile) {
				console.log('处理图片文件:', imageFile.name);
				const imageData = await this.app.vault.readBinary(imageFile);
				const originalExtension = getFileExtension(imageFile.name);
				const imageName = generateImageFileName(imageIndex, originalExtension);
				const imageExportPath = path.join(imageDir, imageName);

				// 保存图片
				console.log('保存图片到:', imageExportPath);
				try {
					saveImageFile(imageData, imageExportPath);
					console.log('图片保存成功');
				} catch (error) {
					console.error('图片保存失败:', error);
				}

				// 获取实际宽度（需在浏览器环境）
				const imageEl = new Image();
				imageEl.src = URL.createObjectURL(new Blob([imageData]));
				await new Promise((resolve) => {
					imageEl.onload = () => {
						const actualWidth = imageEl.width;

						let imageUrl = generateImageUrl(this.settings.host, selectedPrefixPath, timestamp, imageName);

						if (specifiedWidth) {
							let widthPercentage = ((specifiedWidth / actualWidth) * 100).toFixed(2);
							if (this.settings.minImageWidthPercentage && 
								parseFloat(widthPercentage) < this.settings.minImageWidthPercentage) {
								widthPercentage = this.settings.minImageWidthPercentage.toFixed(2);
							}
							updatedData = updatedData.replace(
								match![0],
								`<img src="${imageUrl}" width="${widthPercentage}%" />`
							);
						} else {
							updatedData = updatedData.replace(
								match![0],
								`![${imageName}](${imageUrl})`
							);
						}
						resolve(null);
					};
				});

				imageIndex++;
			}
		}

		// 元数据
		let finalData = updatedData;
		if (this.settings.enableMetaData) {
			const metaData = `title: ${file.basename}\n` +
				`date: ${moment().format('YYYY-MM-DD HH:mm:ss')}\n` +
				`id: ${timestamp}\n\n`;
			finalData = metaData + updatedData;
		}

		// 导出文章
		const exportPath = path.join(exportDir, `${file.basename}.md`);
		console.log('导出路径:', exportPath);
		console.log('最终数据长度:', finalData.length);
		
		saveArticleFile(
			finalData,
			exportPath,
			() => {
				console.log('导出成功');
				new Notice(`${getLanguageStrings(this.app).exportSuccess} ${exportDir}`);
			},
			(err) => {
				console.error('导出失败:', err);
				new Notice(getLanguageStrings(this.app).exportFailed);
			}
		);
	}
}

class ArticleExporterSettingTab extends PluginSettingTab {
	plugin: ArticleExporter;

	constructor(app: App, plugin: ArticleExporter) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const {containerEl} = this;
		const lang = getLanguageStrings(this.plugin.app);

		containerEl.empty();

		// 示例设置（保留）
		new Setting(containerEl)
			.setName('Setting #1')
			.setDesc('It\'s a secret')
			.addText(text => text
				.setPlaceholder('Enter your secret')
				.setValue(this.plugin.settings.mySetting)
				.onChange(async (value) => {
					this.plugin.settings.mySetting = value;
					await this.plugin.saveSettings();
				}));

		// Export Directory
		const exportDirectorySetting = new Setting(containerEl)
			.setName(lang.exportDirectory)
			.setDesc(lang.exportDirectoryDesc);
		let textComponent: HTMLInputElement;
		exportDirectorySetting
			.addText(text => {
				textComponent = text.inputEl;
				text.setPlaceholder('Click "Browse" to select directory')
					.setValue(this.plugin.settings.exportDirectory || '')
					.setDisabled(true);
			})
			.addButton(button => button
				.setButtonText(lang.browse)
				.onClick(async () => {
					try {
						const { dialog } = require('@electron/remote');
						const result = await dialog.showOpenDialog({
							properties: ['openDirectory'],
							title: '选择导出目录'
						});
						if (!result.canceled && result.filePaths.length > 0) {
							this.plugin.settings.exportDirectory = result.filePaths[0];
							await this.plugin.saveSettings();
							textComponent.value = this.plugin.settings.exportDirectory || '';
						}
					} catch (error) {
						try {
							const { dialog } = require('electron').remote;
							const result = await dialog.showOpenDialog({
								properties: ['openDirectory'],
								title: '选择导出目录'
							});
							if (!result.canceled && result.filePaths.length > 0) {
								this.plugin.settings.exportDirectory = result.filePaths[0];
								await this.plugin.saveSettings();
								textComponent.value = this.plugin.settings.exportDirectory || '';
							}
						} catch (secondError) {
							new Notice(lang.cannotOpenFilePicker);
							textComponent.disabled = false;
							textComponent.onchange = async (e) => {
								const target = e.target as HTMLInputElement;
								this.plugin.settings.exportDirectory = target.value;
								await this.plugin.saveSettings();
							};
						}
					}
				}));

		// Host
		new Setting(containerEl)
			.setName(lang.host)
			.setDesc(lang.hostDesc)
			.addText(text => text
				.setPlaceholder('Enter host URL')
				.setValue(this.plugin.settings.host || '')
				.onChange(async (value) => {
					this.plugin.settings.host = value;
					await this.plugin.saveSettings();
				}));

		// Default Prefix Path
		new Setting(containerEl)
			.setName(lang.defaultPrefixPath)
			.setDesc(lang.defaultPrefixPathDesc)
			.addText(text => text
				.setPlaceholder('Enter default prefix path')
				.setValue(this.plugin.settings.defaultPrefixPath || '')
				.onChange(async (value) => {
					this.plugin.settings.defaultPrefixPath = value;
					await this.plugin.saveSettings();
				}));

		// Prefix Paths List
		new Setting(containerEl)
			.setName(lang.prefixPathsList)
			.setDesc(lang.prefixPathsListDesc)
			.addTextArea(text => text
				.setPlaceholder('moments\nblog\nphotos\n...')
				.setValue(this.plugin.settings.prefixPaths ? this.plugin.settings.prefixPaths.join('\n') : '')
				.onChange(async (value) => {
					this.plugin.settings.prefixPaths = value.split('\n').filter(line => line.trim() !== '');
					await this.plugin.saveSettings();
				}));

		// Min image width percentage
		new Setting(containerEl)
			.setName(lang.minImageWidthPercentage)
			.setDesc(lang.minImageWidthPercentageDesc)
			.addSlider(slider => slider
				.setLimits(0, 100, 5)
				.setValue(this.plugin.settings.minImageWidthPercentage || 0)
				.setDynamicTooltip()
				.onChange(async (value) => {
					this.plugin.settings.minImageWidthPercentage = value;
					await this.plugin.saveSettings();
				}));

		// Enable meta data
		new Setting(containerEl)
			.setName(lang.enableMetaData)
			.setDesc(lang.enableMetaDataDesc)
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.enableMetaData || false)
				.onChange(async (value) => {
					this.plugin.settings.enableMetaData = value;
					await this.plugin.saveSettings();
				}));
	}
}
