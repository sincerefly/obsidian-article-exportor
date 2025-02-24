import { App, Editor, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting } from 'obsidian';
import { TFile } from 'obsidian';
import * as fs from 'fs';
import * as path from 'path';
import { moment } from 'obsidian';

// Remember to rename these classes and interfaces!

interface ArticleExporterSettings {
	mySetting: string;
	exportDirectory?: string;
	host?: string; // 新增 host 字段
}

const DEFAULT_SETTINGS: ArticleExporterSettings = {
	mySetting: 'default',
	host: '' // 默认值为空
}

export default class ArticleExporter extends Plugin {
	settings: ArticleExporterSettings;

	async onload() {
		await this.loadSettings();

		// This creates an icon in the left ribbon.
		const ribbonIconEl = this.addRibbonIcon('dice', '导出笔记', (evt: MouseEvent) => {
			// Called when the user clicks the icon.
			new Notice('This is a notice!');
		});
		// Perform additional things with the ribbon
		ribbonIconEl.addClass('my-plugin-ribbon-class');

		// This adds a status bar item to the bottom of the app. Does not work on mobile apps.
		const statusBarItemEl = this.addStatusBarItem();
		statusBarItemEl.setText('Status Bar Text');

		// This adds a simple command that can be triggered anywhere
		this.addCommand({
			id: 'open-sample-modal-simple',
			name: 'Open sample modal (simple)',
			callback: () => {
				new SampleModal(this.app).open();
			}
		});
		// This adds an editor command that can perform some operation on the current editor instance
		this.addCommand({
			id: 'sample-editor-command',
			name: 'Sample editor command',
			editorCallback: (editor: Editor, view: MarkdownView) => {
				console.log(editor.getSelection());
				editor.replaceSelection('Sample Editor Command');
			}
		});
		// This adds a complex command that can check whether the current state of the app allows execution of the command
		this.addCommand({
			id: 'open-sample-modal-complex',
			name: 'Open sample modal (complex)',
			checkCallback: (checking: boolean) => {
				// Conditions to check
				const markdownView = this.app.workspace.getActiveViewOfType(MarkdownView);
				if (markdownView) {
					// If checking is true, we're simply "checking" if the command can be run.
					// If checking is false, then we want to actually perform the operation.
					if (!checking) {
						new SampleModal(this.app).open();
					}

					// This command will only show up in Command Palette when the check function returns true
					return true;
				}
			}
		});

		// 添加导出文章的命令
		this.addCommand({
			id: 'export-current-note',
			name: 'Export Current Note',
			callback: async () => {
				const activeFile = this.app.workspace.getActiveFile();
				if (activeFile) {
					await this.exportNoteToFile(activeFile);
				} else {
					new Notice('No active note to export.');
				}
			}
		});

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new SampleSettingTab(this.app, this));

		// If the plugin hooks up any global DOM events (on parts of the app that doesn't belong to this plugin)
		// Using this function will automatically remove the event listener when this plugin is disabled.
		this.registerDomEvent(document, 'click', (evt: MouseEvent) => {
			console.log('click', evt);
		});

		// When registering intervals, this function will automatically clear the interval when the plugin is disabled.
		this.registerInterval(window.setInterval(() => console.log('setInterval'), 5 * 60 * 1000));
	}

	onunload() {

	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	async exportNoteToFile(file: TFile) {
		const data = await this.app.vault.read(file);
		const exportDir = this.settings.exportDirectory;

		if (!exportDir) {
			new Notice('请先设置插件的导出目录');
			return;
		}

		// 创建以时间戳命名的目录
		const timestamp = moment().format('X');
		const imageDir = path.join(exportDir, timestamp);
		fs.mkdirSync(imageDir, { recursive: true });

		// 解析文章内容，查找图片链接
		const imageRegex = /!\[.*?\]\((.*?)\)|!\[\[(.*?)(?:\|(\d+))?\]\]/g;
		let match;
		let imageIndex = 1;
		let updatedData = data;

		while ((match = imageRegex.exec(data)) !== null) {
			let imagePath = match[1] || match[2];
			if (!imagePath) continue;

			// 获取指定的宽度（如果有）
			const specifiedWidth = match[3] ? parseInt(match[3], 10) : null;

			// 获取图片文件
			const imageFile = this.app.metadataCache.getFirstLinkpathDest(imagePath, file.path);

			if (imageFile instanceof TFile) {
				const imageData = await this.app.vault.readBinary(imageFile);
				const imageName = `${String(imageIndex).padStart(2, '0')}.jpg`;
				const imageExportPath = path.join(imageDir, imageName);

				// 保存图片到导出目录
				fs.writeFileSync(imageExportPath, Buffer.from(imageData));

				// 计算图片的实际宽度和比例
				const image = new Image();
				image.src = URL.createObjectURL(new Blob([imageData]));
				await new Promise((resolve) => {
					image.onload = () => {
						const actualWidth = image.width;

						// 根据是否配置了 host 生成不同的图片链接
						const imageUrl = this.settings.host 
							? `${this.settings.host}/${timestamp}/${imageName}`
							: `${timestamp}/${imageName}`;

						// 更新文章内容中的图片链接
						if (specifiedWidth) {
							const widthPercentage = ((specifiedWidth / actualWidth) * 100).toFixed(2);
							updatedData = updatedData.replace(
								match[0],
								`<img src="${imageUrl}" width="${widthPercentage}%" />`
							);
						} else {
							updatedData = updatedData.replace(
								match[0],
								`![${imageName}](${imageUrl})`
							);
						}
						resolve(null);
					};
				});

				imageIndex++;
			}
		}

		// 导出更新后的文章
		const exportPath = path.join(exportDir, `${file.basename}.md`);
		fs.writeFile(exportPath, updatedData, (err) => {
			if (err) {
				new Notice('Failed to export note.');
				console.error(err);
			} else {
				new Notice(`Note and images exported to ${exportDir}`);
			}
		});
	}
}

class SampleModal extends Modal {
	constructor(app: App) {
		super(app);
	}

	onOpen() {
		const {contentEl} = this;
		contentEl.setText('Woah!');
	}

	onClose() {
		const {contentEl} = this;
		contentEl.empty();
	}
}

class SampleSettingTab extends PluginSettingTab {
	plugin: ArticleExporter;

	constructor(app: App, plugin: ArticleExporter) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const {containerEl} = this;

		containerEl.empty();

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

		new Setting(containerEl)
			.setName('Export Directory')
			.setDesc('Directory to export notes to')
			.addText(text => text
				.setPlaceholder('Enter export directory')
				.setValue(this.plugin.settings.exportDirectory || '')
				.onChange(async (value) => {
					this.plugin.settings.exportDirectory = value;
					await this.plugin.saveSettings();
				}));

		// 新增 host 设置项
		new Setting(containerEl)
			.setName('Host')
			.setDesc('Host for image URLs (e.g., http://xxx.com)')
			.addText(text => text
				.setPlaceholder('Enter host URL')
				.setValue(this.plugin.settings.host || '')
				.onChange(async (value) => {
					this.plugin.settings.host = value;
					await this.plugin.saveSettings();
				}));
	}
}