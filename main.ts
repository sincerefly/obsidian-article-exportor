import { App, Editor, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting, TFolder } from 'obsidian';
import { TFile } from 'obsidian';
import * as fs from 'fs';
import * as path from 'path';
import { moment } from 'obsidian';

// 多语言支持
interface LanguageStrings {
	// 设置项
	exportDirectory: string;
	exportDirectoryDesc: string;
	host: string;
	hostDesc: string;
	defaultPrefixPath: string;
	defaultPrefixPathDesc: string;
	prefixPathsList: string;
	prefixPathsListDesc: string;
	minImageWidthPercentage: string;
	minImageWidthPercentageDesc: string;
	enableMetaData: string;
	enableMetaDataDesc: string;
	browse: string;
	
	// 提示信息
	noActiveNote: string;
	exportSuccess: string;
	exportFailed: string;
	setExportDirectoryFirst: string;
	cannotOpenFilePicker: string;
	pleaseEnterPath: string;
	
	// 模态框
	selectPrefixPath: string;
	selectPrefixPathDesc: string;
	defaultOption: string;
	noPrefixOption: string;
	cancel: string;
	
	// 命令
	exportCurrentNote: string;
}

// 语言配置
const LANGUAGES: Record<string, LanguageStrings> = {
	'zh': {
		// 设置项
		exportDirectory: '导出目录',
		exportDirectoryDesc: '选择导出笔记的目录',
		host: '主机地址',
		hostDesc: '图片链接的主机地址（例如：https://images.yasking.org）',
		defaultPrefixPath: '默认前缀路径',
		defaultPrefixPathDesc: '默认前缀路径（例如：moments）',
		prefixPathsList: '前缀路径列表',
		prefixPathsListDesc: '可用的前缀路径列表（每行一个）',
		minImageWidthPercentage: '最小图片宽度百分比',
		minImageWidthPercentageDesc: '设置图片的最小宽度百分比（0表示不限制）',
		enableMetaData: '启用 Meta 元数据',
		enableMetaDataDesc: '导出时在文章开头自动添加 title、date、id 等元数据',
		browse: '浏览',
		
		// 提示信息
		noActiveNote: '没有活动的笔记可导出。',
		exportSuccess: '笔记和图片已导出到',
		exportFailed: '导出笔记失败。',
		setExportDirectoryFirst: '请先设置插件的导出目录',
		cannotOpenFilePicker: '无法打开文件选择器，请手动输入路径',
		pleaseEnterPath: '请手动输入导出目录路径，或使用系统文件管理器选择后复制路径',
		
		// 模态框
		selectPrefixPath: '选择前缀路径',
		selectPrefixPathDesc: '请选择要使用的前缀路径：',
		defaultOption: '默认：',
		noPrefixOption: '不使用前缀路径',
		cancel: '取消',
		
		// 命令
		exportCurrentNote: '导出当前笔记'
	},
	'en': {
		// 设置项
		exportDirectory: 'Export Directory',
		exportDirectoryDesc: 'Directory to export notes to',
		host: 'Host',
		hostDesc: 'Host for image URLs (e.g., https://images.yasking.org)',
		defaultPrefixPath: 'Default Prefix Path',
		defaultPrefixPathDesc: 'Default prefix path for image URLs (e.g., moments)',
		prefixPathsList: 'Prefix Paths List',
		prefixPathsListDesc: 'List of available prefix paths (one per line)',
		minImageWidthPercentage: 'Min Image Width Percentage',
		minImageWidthPercentageDesc: 'Set minimum image width percentage (0 means no limit)',
		enableMetaData: 'Enable Meta Data',
		enableMetaDataDesc: 'Automatically add title, date, id metadata at the beginning of exported articles',
		browse: 'Browse',
		
		// 提示信息
		noActiveNote: 'No active note to export.',
		exportSuccess: 'Note and images exported to',
		exportFailed: 'Failed to export note.',
		setExportDirectoryFirst: 'Please set the plugin export directory first',
		cannotOpenFilePicker: 'Cannot open file picker, please enter path manually',
		pleaseEnterPath: 'Please manually enter the export directory path, or use system file manager to select and copy the path',
		
		// 模态框
		selectPrefixPath: 'Select Prefix Path',
		selectPrefixPathDesc: 'Please select the prefix path to use:',
		defaultOption: 'Default: ',
		noPrefixOption: 'No Prefix Path',
		cancel: 'Cancel',
		
		// 命令
		exportCurrentNote: 'Export Current Note'
	}
};

// 定义插件的设置接口
interface ArticleExporterSettings {
	mySetting: string; // 自定义设置
	exportDirectory?: string; // 导出目录
	host?: string; // 图片链接的主机地址
	defaultPrefixPath?: string; // 默认前缀路径
	prefixPaths?: string[]; // 前缀路径列表
	minImageWidthPercentage?: number; // 图片最小宽度百分比
	enableMetaData?: boolean; // 是否启用生成 meta 元数据
}

// 默认设置
const DEFAULT_SETTINGS: ArticleExporterSettings = {
	mySetting: 'default',
	host: '', // 默认主机为空
	defaultPrefixPath: '', // 默认前缀路径为空
	prefixPaths: [], // 前缀路径列表
	minImageWidthPercentage: 0, // 默认不限制最小宽度
	enableMetaData: false // 默认不启用 meta 元数据
}

// 获取当前语言
function getCurrentLanguage(app: App): string {
	// 尝试从 Obsidian 设置中获取语言
	try {
		// 检查浏览器语言设置
		const browserLang = navigator.language || navigator.languages[0] || 'en';
		if (browserLang.startsWith('zh')) {
			return 'zh';
		}
	} catch (error) {
		console.log('无法检测浏览器语言');
	}
	return 'en';
}

// 获取语言字符串
function getLanguageStrings(app: App): LanguageStrings {
	const lang = getCurrentLanguage(app);
	return LANGUAGES[lang] || LANGUAGES['en'];
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
			name: getLanguageStrings(this.app).exportCurrentNote,
			callback: async () => {
				const activeFile = this.app.workspace.getActiveFile();
				if (activeFile) {
					// 检查是否需要选择前缀路径
					if (this.settings.defaultPrefixPath || (this.settings.prefixPaths && this.settings.prefixPaths.length > 0)) {
						// 如果有默认前缀路径，直接使用
						if (this.settings.defaultPrefixPath) {
							await this.exportNoteToFile(activeFile, this.settings.defaultPrefixPath);
						} else {
							// 否则显示选择对话框
							new PrefixPathSelectionModal(this.app, this, activeFile, async (selectedPath: string) => {
								await this.exportNoteToFile(activeFile, selectedPath);
							}).open();
						}
					} else {
						// 没有配置前缀路径，直接导出
						await this.exportNoteToFile(activeFile, '');
					}
				} else {
					new Notice(getLanguageStrings(this.app).noActiveNote);
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
	async exportNoteToFile(file: TFile, selectedPrefixPath: string = '') {
		const data = await this.app.vault.read(file); // 读取笔记内容
		const exportDir = this.settings.exportDirectory; // 获取导出目录

		if (!exportDir) {
			new Notice(getLanguageStrings(this.app).setExportDirectoryFirst);
			return;
		}

		// 创建以时间戳命名的目录
		const timestamp = moment().format('X');
		const imageDir = path.join(exportDir, timestamp);
		fs.mkdirSync(imageDir, { recursive: true });

		// 解析文章内容，查找图片链接
		const imageRegex = /!\[.*?\]\((.*?)\)|!\[\[(.*?)(?:\|(\d+))?\]\]/g;
		let match: RegExpExecArray | null;
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

						// 根据是否配置了 host 和 selectedPrefixPath 生成不同的图片链接
						let imageUrl = `${timestamp}/${imageName}`;
						if (this.settings.host) {
							if (selectedPrefixPath) {
								// 如果同时配置了 host 和 selectedPrefixPath，拼接完整路径
								imageUrl = `${this.settings.host}/${selectedPrefixPath}/${timestamp}/${imageName}`;
							} else {
								// 只配置了 host，使用原来的逻辑
								imageUrl = `${this.settings.host}/${timestamp}/${imageName}`;
							}
						}

						// 更新文章内容中的图片链接
						if (specifiedWidth) {
							let widthPercentage = ((specifiedWidth / actualWidth) * 100).toFixed(2);
							// 如果设置了最小宽度百分比且计算出的宽度小于最小值，则使用最小值
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

		// 如果启用了元数据，在文章开头添加 meta 信息
		let finalData = updatedData;
		if (this.settings.enableMetaData) {
			const metaData = `title: ${file.basename}
date: ${moment().format('YYYY-MM-DD HH:mm:ss')}
id: ${timestamp}

`;
			finalData = metaData + updatedData;
		}

		// 导出更新后的文章
		const exportPath = path.join(exportDir, `${file.basename}.md`);
		fs.writeFile(exportPath, finalData, (err) => {
			if (err) {
				new Notice(getLanguageStrings(this.app).exportFailed);
				console.error(err);
			} else {
				new Notice(`${getLanguageStrings(this.app).exportSuccess} ${exportDir}`);
			}
		});
	}
}

// 选择前缀路径的模态框类
class PrefixPathSelectionModal extends Modal {
	plugin: ArticleExporter;
	file: TFile;
	onPathSelected: (selectedPath: string) => void;

	constructor(app: App, plugin: ArticleExporter, file: TFile, onPathSelected: (selectedPath: string) => void) {
		super(app);
		this.plugin = plugin;
		this.file = file;
		this.onPathSelected = onPathSelected;
	}

	onOpen() {
		const {contentEl} = this;
		const lang = getLanguageStrings(this.plugin.app);
		
		contentEl.createEl("h2", {text: lang.selectPrefixPath});
		
		const description = contentEl.createEl("p", {text: lang.selectPrefixPathDesc});
		description.style.marginBottom = "20px";

		// 如果有默认前缀路径，显示为第一个选项
		if (this.plugin.settings.defaultPrefixPath) {
			const defaultOption = contentEl.createEl("button", {
				text: `${lang.defaultOption}${this.plugin.settings.defaultPrefixPath}`,
				cls: "mod-cta"
			});
			defaultOption.style.width = "100%";
			defaultOption.style.marginBottom = "10px";
			defaultOption.addEventListener("click", () => {
				this.onPathSelected(this.plugin.settings.defaultPrefixPath!);
				this.close();
			});
		}

		// 显示前缀路径列表
		if (this.plugin.settings.prefixPaths && this.plugin.settings.prefixPaths.length > 0) {
			this.plugin.settings.prefixPaths.forEach(path => {
				const option = contentEl.createEl("button", {text: path});
				option.style.width = "100%";
				option.style.marginBottom = "10px";
				option.addEventListener("click", () => {
					this.onPathSelected(path);
					this.close();
				});
			});
		}

		// 添加"不使用前缀路径"选项
		const noPrefixOption = contentEl.createEl("button", {text: lang.noPrefixOption});
		noPrefixOption.style.width = "100%";
		noPrefixOption.style.marginBottom = "10px";
		noPrefixOption.addEventListener("click", () => {
			this.onPathSelected("");
			this.close();
		});

		// 添加取消按钮
		const cancelButton = contentEl.createEl("button", {text: lang.cancel});
		cancelButton.style.width = "100%";
		cancelButton.addEventListener("click", () => {
			this.close();
		});
	}

	onClose() {
		const {contentEl} = this;
		contentEl.empty();
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
		const lang = getLanguageStrings(this.plugin.app);

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

		const exportDirectorySetting = new Setting(containerEl)
			.setName(lang.exportDirectory)
			.setDesc(lang.exportDirectoryDesc);
		
		let textComponent: HTMLInputElement;
		exportDirectorySetting
			.addText(text => {
				textComponent = text.inputEl;
				text.setPlaceholder('Click "Browse" to select directory')
					.setValue(this.plugin.settings.exportDirectory || '')
					.setDisabled(true); // 禁用文本输入框
			})
			.addButton(button => button
				.setButtonText(lang.browse)
				.onClick(async () => {
					// 尝试使用 Electron 的原生文件选择器
					try {
						const { dialog } = require('@electron/remote');
						const result = await dialog.showOpenDialog({
							properties: ['openDirectory'],
							title: '选择导出目录'
						});
						
						if (!result.canceled && result.filePaths.length > 0) {
							this.plugin.settings.exportDirectory = result.filePaths[0];
							await this.plugin.saveSettings();
							// 直接更新文本框的值
							textComponent.value = this.plugin.settings.exportDirectory || '';
						}
					} catch (error) {
						// 如果 @electron/remote 不可用，尝试使用 electron.remote
						try {
							const { dialog } = require('electron').remote;
							const result = await dialog.showOpenDialog({
								properties: ['openDirectory'],
								title: '选择导出目录'
							});
							
							if (!result.canceled && result.filePaths.length > 0) {
								this.plugin.settings.exportDirectory = result.filePaths[0];
								await this.plugin.saveSettings();
								// 直接更新文本框的值
								textComponent.value = this.plugin.settings.exportDirectory || '';
							}
						} catch (secondError) {
							// 如果都不行，回退到提示用户手动输入
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

		// 新增 host 设置项
		new Setting(containerEl)
			.setName(lang.host)
			.setDesc(lang.hostDesc)
			.addText(text => text
				.setPlaceholder('Enter host URL')
				.setValue(this.plugin.settings.host || '')
				.onChange(async (value) => {
					this.plugin.settings.host = value;
					await this.plugin.saveSettings(); // 保存设置
				}));

		// 新增 defaultPrefixPath 设置项
		new Setting(containerEl)
			.setName(lang.defaultPrefixPath)
			.setDesc(lang.defaultPrefixPathDesc)
			.addText(text => text
				.setPlaceholder('Enter default prefix path')
				.setValue(this.plugin.settings.defaultPrefixPath || '')
				.onChange(async (value) => {
					this.plugin.settings.defaultPrefixPath = value;
					await this.plugin.saveSettings(); // 保存设置
				}));

		// 新增 prefixPaths 列表设置项
		new Setting(containerEl)
			.setName(lang.prefixPathsList)
			.setDesc(lang.prefixPathsListDesc)
			.addTextArea(text => text
				.setPlaceholder('moments\nblog\nphotos\n...')
				.setValue(this.plugin.settings.prefixPaths ? this.plugin.settings.prefixPaths.join('\n') : '')
				.onChange(async (value) => {
					// 将文本按行分割，过滤空行
					this.plugin.settings.prefixPaths = value.split('\n').filter(line => line.trim() !== '');
					await this.plugin.saveSettings(); // 保存设置
				}));

		// 添加最小图片宽度百分比设置
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

		// 添加启用元数据设置
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