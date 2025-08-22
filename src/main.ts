import { App, Editor, MarkdownView, Notice, Plugin, PluginSettingTab, Setting, TFile } from 'obsidian';
import * as path from 'path';
import * as fs from 'fs';
import { moment } from 'obsidian';

import { ArticleExporterSettings, IArticleExporter, ArticleTypeConfig } from './types';
import { DEFAULT_SETTINGS } from './constants/default-settings';
import { getLanguageStrings } from './services/language-service';
import { ArticleTypeSelectionModal } from './components/article-type-modal';
import { SampleModal } from './components/sample-modal';
import { generateImageUrl, getFileExtension, generateImageFileName } from './utils/path-utils';
import { saveImageFile, saveArticleFile } from './utils/file-utils';
import { generateMetaData, getArticleTypeByName } from './utils/meta-utils';

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
					const enabledTypes = this.settings.articleTypes.filter(type => type.enabled);
					if (enabledTypes.length > 0) {
						if (this.settings.defaultArticleType) {
							const defaultType = getArticleTypeByName(this.settings.articleTypes, this.settings.defaultArticleType);
							if (defaultType && defaultType.enabled) {
								await this.exportNoteToFile(activeFile, defaultType);
							} else {
								// 默认类型不存在或未启用，显示选择对话框
								new ArticleTypeSelectionModal(this.app, this as unknown as IArticleExporter, activeFile, async (selectedType: ArticleTypeConfig) => {
									await this.exportNoteToFile(activeFile, selectedType);
								}).open();
							}
						} else {
							// 没有默认类型，显示选择对话框
							new ArticleTypeSelectionModal(this.app, this as unknown as IArticleExporter, activeFile, async (selectedType: ArticleTypeConfig) => {
								await this.exportNoteToFile(activeFile, selectedType);
							}).open();
						}
					} else {
						new Notice(getLanguageStrings(this.app).noEnabledArticleTypes);
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
	async exportNoteToFile(file: TFile, articleType: ArticleTypeConfig): Promise<void> {
		console.log('开始导出文件:', file.basename);
		console.log('导出目录:', this.settings.exportDirectory);
		console.log('选择的文章类型:', articleType.name);
		console.log('前缀路径:', articleType.prefixPath);
		
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

						let imageUrl = generateImageUrl(this.settings.host, articleType.prefixPath, timestamp, imageName);

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
			const metaData = generateMetaData(articleType, file.basename, timestamp);
			finalData = metaData + '\n' + updatedData;
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

		// Default Article Type
		const defaultArticleTypeSetting = new Setting(containerEl)
			.setName(lang.defaultArticleType)
			.setDesc(lang.defaultArticleTypeDesc);
		
		const defaultTypeSelect = defaultArticleTypeSetting.addDropdown(dropdown => {
			// 添加"无默认"选项
			dropdown.addOption('', '无默认');
			
			// 添加所有启用的文章类型
			this.plugin.settings.articleTypes
				.filter(type => type.enabled)
				.forEach(type => {
					dropdown.addOption(type.name, type.name);
				});
			
			dropdown.setValue(this.plugin.settings.defaultArticleType || '');
			dropdown.onChange(async (value) => {
				this.plugin.settings.defaultArticleType = value;
				await this.plugin.saveSettings();
			});
		});

		// Article Types Configuration
		containerEl.createEl('h3', { text: lang.articleTypesConfig });
		containerEl.createEl('p', { text: lang.articleTypesConfigDesc });

		// 添加新文章类型区域
		const addTypeContainer = containerEl.createEl('div', { cls: 'add-article-type' });
		addTypeContainer.createEl('h4', { text: '添加新文章类型' });
		
		let newTypeName = '';
		let newTypePrefix = '';
		
		// 类型名称输入框
		const nameTextComponent = new Setting(addTypeContainer)
			.setName('类型名称')
			.setDesc('输入文章类型名称，如：Moments、Photos、Reading等')
			.addText(text => text
				.setPlaceholder('输入类型名称')
				.onChange((value) => {
					newTypeName = value;
					// 自动生成前缀路径建议
					if (value.trim() && !newTypePrefix) {
						const suggestedPrefix = value.trim().toLowerCase().replace(/\s+/g, '-');
						newTypePrefix = suggestedPrefix;
						const inputElement = prefixTextComponent.controlEl.querySelector('input');
						if (inputElement) {
							(inputElement as HTMLInputElement).value = suggestedPrefix;
						}
					}
				}));

		// 前缀路径输入框
		const prefixTextComponent = new Setting(addTypeContainer)
			.setName('前缀路径')
			.setDesc('输入图片链接的前缀路径，如：moments、photos、reading等')
			.addText(text => text
				.setPlaceholder('输入前缀路径')
				.onChange((value) => {
					newTypePrefix = value;
				}));

		// 添加按钮
		new Setting(addTypeContainer)
			.setName('')
			.addButton(button => button
				.setButtonText('+ 添加文章类型')
				.setCta()
				.onClick(async () => {
					if (!newTypeName.trim()) {
						new Notice('请输入类型名称');
						return;
					}
					if (!newTypePrefix.trim()) {
						new Notice('请输入前缀路径');
						return;
					}
					
					// 检查是否已存在相同名称的类型
					const existingType = this.plugin.settings.articleTypes.find(
						type => type.name.toLowerCase() === newTypeName.trim().toLowerCase()
					);
					if (existingType) {
						new Notice('已存在相同名称的文章类型');
						return;
					}
					
					// 添加新的文章类型
					const newType = {
						name: newTypeName.trim(),
						prefixPath: newTypePrefix.trim(),
						enabled: true
					};
					this.plugin.settings.articleTypes.push(newType);
					await this.plugin.saveSettings();
					
					// 清空输入框
					const nameInput = nameTextComponent.controlEl.querySelector('input') as HTMLInputElement;
					const prefixInput = prefixTextComponent.controlEl.querySelector('input') as HTMLInputElement;
					if (nameInput) nameInput.value = '';
					if (prefixInput) prefixInput.value = '';
					newTypeName = '';
					newTypePrefix = '';
					
					// 重新渲染设置页面
					this.display();
					
					new Notice(`已添加文章类型：${newType.name}`);
				}));

		// 显示现有文章类型
		this.plugin.settings.articleTypes.forEach((type, index) => {
			const typeContainer = containerEl.createEl('div', { cls: 'article-type-config' });
			
			// 类型基本信息
			const basicInfo = typeContainer.createEl('div', { cls: 'type-basic-info' });
			
			// 启用开关
			new Setting(basicInfo)
				.setName(type.name)
				.addToggle(toggle => toggle
					.setValue(type.enabled)
					.onChange(async (value) => {
						this.plugin.settings.articleTypes[index].enabled = value;
						await this.plugin.saveSettings();
					}));

			// 类型名称
			new Setting(basicInfo)
				.setName('类型名称')
				.addText(text => text
					.setValue(type.name)
					.onChange(async (value) => {
						this.plugin.settings.articleTypes[index].name = value;
						await this.plugin.saveSettings();
					}));

			// 前缀路径
			new Setting(basicInfo)
				.setName('前缀路径')
				.addText(text => text
					.setValue(type.prefixPath)
					.onChange(async (value) => {
						this.plugin.settings.articleTypes[index].prefixPath = value;
						await this.plugin.saveSettings();
					}));

			// 删除按钮
			new Setting(basicInfo)
				.setName('删除')
				.addButton(button => button
					.setButtonText('删除')
					.setWarning()
					.onClick(async () => {
						// 删除文章类型
						this.plugin.settings.articleTypes.splice(index, 1);
						await this.plugin.saveSettings();
						// 重新渲染设置页面
						this.display();
					}));

			// 分隔线
			typeContainer.createEl('hr');
		});

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
