import { App, Editor, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting } from 'obsidian';
import { TFile } from 'obsidian';
import * as fs from 'fs';
import * as path from 'path';
import { moment } from 'obsidian';

// 定义插件的设置接口
interface ArticleExporterSettings {
	mySetting: string; // 自定义设置
	exportDirectory?: string; // 导出目录
	host?: string; // 图片链接的主机地址
	minImageWidthPercentage?: number; // 图片最小宽度百分比
}

// 默认设置
const DEFAULT_SETTINGS: ArticleExporterSettings = {
	mySetting: 'default',
	host: '', // 默认主机为空
	minImageWidthPercentage: 0 // 默认不限制最小宽度
}

// 插件主类
export default class ArticleExporter extends Plugin {
	settings: ArticleExporterSettings;

	// 插件加载时调用
	async onload() {
		await this.loadSettings(); // 加载设置

		// 在左侧添加一个图标
		const ribbonIconEl = this.addRibbonIcon('dice', '导出笔记', (evt: MouseEvent) => {
			new Notice('This is a notice!'); // 点击图标时显示通知
		});
		ribbonIconEl.addClass('my-plugin-ribbon-class'); // 为图标添加样式

		// 在状态栏添加一个项目
		const statusBarItemEl = this.addStatusBarItem();
		statusBarItemEl.setText('Status Bar Text'); // 设置状态栏文本

		// 添加一个简单命令
		this.addCommand({
			id: 'open-sample-modal-simple',
			name: 'Open sample modal (simple)',
			callback: () => {
				new SampleModal(this.app).open(); // 打开一个示例模态框
			}
		});

		// 添加一个编辑器命令
		this.addCommand({
			id: 'sample-editor-command',
			name: 'Sample editor command',
			editorCallback: (editor: Editor, view: MarkdownView) => {
				console.log(editor.getSelection()); // 打印当前选中的文本
				editor.replaceSelection('Sample Editor Command'); // 替换选中的文本
			}
		});

		// 添加一个复杂命令
		this.addCommand({
			id: 'open-sample-modal-complex',
			name: 'Open sample modal (complex)',
			checkCallback: (checking: boolean) => {
				const markdownView = this.app.workspace.getActiveViewOfType(MarkdownView);
				if (markdownView) {
					if (!checking) {
						new SampleModal(this.app).open(); // 打开模态框
					}
					return true; // 允许命令在命令面板中显示
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
					await this.exportNoteToFile(activeFile); // 导出当前笔记
				} else {
					new Notice('No active note to export.'); // 没有活动笔记时显示通知
				}
			}
		});

		// 添加设置选项卡
		this.addSettingTab(new SampleSettingTab(this.app, this));

		// 注册全局 DOM 事件
		this.registerDomEvent(document, 'click', (evt: MouseEvent) => {
			console.log('click', evt); // 打印点击事件
		});

		// 注册定时器
		this.registerInterval(window.setInterval(() => console.log('setInterval'), 5 * 60 * 1000)); // 每5分钟打印一次
	}

	// 插件卸载时调用
	onunload() {
		// 可以在这里添加卸载时的清理代码
	}

	// 加载插件设置
	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	// 保存插件设置
	async saveSettings() {
		await this.saveData(this.settings);
	}

	// 导出笔记到文件
	async exportNoteToFile(file: TFile) {
		const data = await this.app.vault.read(file); // 读取笔记内容
		const exportDir = this.settings.exportDirectory; // 获取导出目录

		if (!exportDir) {
			new Notice('请先设置插件的导出目录'); // 如果没有设置导出目录，显示通知
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
				// 获取原文件的扩展名，转换为小写以保持格式统一
				const originalExtension = path.extname(imageFile.name).toLowerCase();
				const imageName = `${String(imageIndex).padStart(2, '0')}${originalExtension}`;
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
							let widthPercentage = ((specifiedWidth / actualWidth) * 100).toFixed(2);
							// 如果设置了最小宽度百分比且计算出的宽度小于最小值，则使用最小值
							if (this.settings.minImageWidthPercentage && 
								parseFloat(widthPercentage) < this.settings.minImageWidthPercentage) {
								widthPercentage = this.settings.minImageWidthPercentage.toFixed(2);
							}
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
				new Notice('Failed to export note.'); // 导出失败时显示通知
				console.error(err);
			} else {
				new Notice(`Note and images exported to ${exportDir}`); // 导出成功时显示通知
			}
		});
	}
}

// 示例模态框类
class SampleModal extends Modal {
	constructor(app: App) {
		super(app);
	}

	onOpen() {
		const {contentEl} = this;
		contentEl.setText('Woah!'); // 打开模态框时设置文本
	}

	onClose() {
		const {contentEl} = this;
		contentEl.empty(); // 关闭模态框时清空内容
	}
}

// 设置选项卡类
class SampleSettingTab extends PluginSettingTab {
	plugin: ArticleExporter;

	constructor(app: App, plugin: ArticleExporter) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const {containerEl} = this;

		containerEl.empty(); // 清空容器

		// 添加设置项
		new Setting(containerEl)
			.setName('Setting #1')
			.setDesc('It\'s a secret')
			.addText(text => text
				.setPlaceholder('Enter your secret')
				.setValue(this.plugin.settings.mySetting)
				.onChange(async (value) => {
					this.plugin.settings.mySetting = value;
					await this.plugin.saveSettings(); // 保存设置
				}));

		new Setting(containerEl)
			.setName('Export Directory')
			.setDesc('Directory to export notes to')
			.addText(text => text
				.setPlaceholder('Enter export directory')
				.setValue(this.plugin.settings.exportDirectory || '')
				.onChange(async (value) => {
					this.plugin.settings.exportDirectory = value;
					await this.plugin.saveSettings(); // 保存设置
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
					await this.plugin.saveSettings(); // 保存设置
				}));

		// 添加最小图片宽度百分比设置
		new Setting(containerEl)
			.setName('最小图片宽度百分比')
			.setDesc('设置图片的最小宽度百分比（0表示不限制）')
			.addSlider(slider => slider
				.setLimits(0, 100, 5)
				.setValue(this.plugin.settings.minImageWidthPercentage || 0)
				.setDynamicTooltip()
				.onChange(async (value) => {
					this.plugin.settings.minImageWidthPercentage = value;
					await this.plugin.saveSettings();
				}));
	}
}