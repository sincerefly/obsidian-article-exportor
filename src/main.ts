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
						console.log('选择的笔记类型:', articleType.name);
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

		// Default Note Type
		const defaultArticleTypeSetting = new Setting(containerEl)
			.setName(lang.defaultArticleType)
			.setDesc(lang.defaultArticleTypeDesc);
		
		const defaultTypeSelect = defaultArticleTypeSetting.addDropdown(dropdown => {
			// 添加"无默认"选项
			dropdown.addOption('', '无默认');
			
			// 添加所有启用的笔记类型
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

		// Note Types Configuration
		const noteTypesConfigSetting = new Setting(containerEl)
			.setName(lang.articleTypesConfig)
			.setDesc(lang.articleTypesConfigDesc);
		
		// 添加折叠按钮到笔记类型配置
		let noteTypesExpanded = this.plugin.settings.noteTypesConfigExpanded ?? true; // 使用保存的状态，默认展开
		let noteTypesExpandButtonEl: HTMLButtonElement;
		const noteTypesExpandButton = noteTypesConfigSetting.addButton(button => {
			noteTypesExpandButtonEl = button.buttonEl;
			button.setButtonText(noteTypesExpanded ? '▲' : '▼')
				.setTooltip('折叠/展开笔记类型配置')
				.onClick(async () => {
					noteTypesExpanded = !noteTypesExpanded;
					this.plugin.settings.noteTypesConfigExpanded = noteTypesExpanded;
					await this.plugin.saveSettings();
					updateNoteTypesExpandState();
				});
			return button;
		});

		// 创建可折叠的笔记类型内容容器
		const noteTypesContentContainer = containerEl.createEl('div', { cls: 'note-types-content' });

		// 添加新笔记类型区域
		const addTypeContainer = noteTypesContentContainer.createEl('div', { cls: 'add-article-type' });
		addTypeContainer.createEl('h4', { text: lang.addNewArticleType });
		
		let newTypeName = '';
		let newTypePrefix = '';
		
		// 类型名称输入框
		const nameTextComponent = new Setting(addTypeContainer)
			.setName(lang.articleTypeName)
			.setDesc(lang.articleTypeNameDesc)
			.addText(text => text
				.setPlaceholder(lang.articleTypeNamePlaceholder)
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
			.setName(lang.prefixPath)
			.setDesc(lang.prefixPathDesc)
			.addText(text => text
				.setPlaceholder(lang.prefixPathPlaceholder)
				.onChange((value) => {
					newTypePrefix = value;
				}));

		// 添加按钮
		new Setting(addTypeContainer)
			.setName('')
			.addButton(button => button
				.setButtonText(lang.addArticleTypeButton)
				.setCta()
				.onClick(async () => {
					if (!newTypeName.trim()) {
						new Notice(lang.pleaseEnterTypeName);
						return;
					}
					
					// 检查是否已存在相同名称的类型
					const existingType = this.plugin.settings.articleTypes.find(
						type => type.name.toLowerCase() === newTypeName.trim().toLowerCase()
					);
					if (existingType) {
						new Notice(lang.duplicateTypeName);
						return;
					}
					
					// 添加新的笔记类型
					const newType = {
						name: newTypeName.trim(),
						prefixPath: newTypePrefix.trim(), // 允许为空字符串
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
					
					new Notice(`${lang.articleTypeAdded}${newType.name}`);
				}));

		// 显示现有笔记类型
		this.plugin.settings.articleTypes.forEach((type, index) => {
			const typeContainer = noteTypesContentContainer.createEl('div', { cls: 'article-type-config' });
			
			// 折叠/展开头部
			const headerContainer = typeContainer.createEl('div', { cls: 'article-type-header' });
			const isExpanded = false; // 默认折叠状态
			
			// 类型名称和状态显示（无交互元素）
			const headerInfo = headerContainer.createEl('div', { cls: 'article-type-header-info' });
			const nameEl = headerInfo.createEl('h4', { text: type.name, cls: 'article-type-name' });
			const statusEl = headerInfo.createEl('span', { 
				text: type.enabled ? lang.enabled : lang.disabled,
				cls: `article-type-status ${type.enabled ? 'enabled' : 'disabled'}`
			});

			// 展开/折叠按钮
			const expandButton = headerContainer.createEl('button', { 
				cls: 'article-type-expand-btn',
				text: '▼'
			});
			
			// 详细配置区域（默认隐藏）
			const detailsContainer = typeContainer.createEl('div', { 
				cls: 'article-type-details',
				attr: { style: 'display: none;' }
			});
			
			// 启用开关
			new Setting(detailsContainer)
				.setName(lang.enableType)
				.addToggle(toggle => toggle
					.setValue(type.enabled)
					.onChange(async (value) => {
						this.plugin.settings.articleTypes[index].enabled = value;
						await this.plugin.saveSettings();
						// 更新头部状态显示
						statusEl.textContent = value ? lang.enabled : lang.disabled;
						statusEl.className = `article-type-status ${value ? 'enabled' : 'disabled'}`;
					}));
			
			// 类型名称
			new Setting(detailsContainer)
				.setName(lang.articleTypeName.replace(' *', ''))
				.addText(text => text
					.setValue(type.name)
					.onChange(async (value) => {
						this.plugin.settings.articleTypes[index].name = value;
						await this.plugin.saveSettings();
						// 更新头部显示的名称
						nameEl.textContent = value;
					}));

			// 前缀路径
			new Setting(detailsContainer)
				.setName(lang.prefixPath)
				.addText(text => text
					.setValue(type.prefixPath)
					.onChange(async (value) => {
						this.plugin.settings.articleTypes[index].prefixPath = value;
						await this.plugin.saveSettings();
					}));

			// 删除按钮
			new Setting(detailsContainer)
				.setName(lang.deleteArticleType)
				.addButton(button => button
					.setButtonText(lang.deleteArticleType)
					.setWarning()
					.onClick(async () => {
						// 二次确认删除
						const confirmed = confirm(`${lang.confirmDeleteType}${type.name}${lang.confirmDeleteTypeDesc}`);
						if (!confirmed) {
							return;
						}
						
						// 检查是否为当前默认类型
						if (this.plugin.settings.defaultArticleType === type.name) {
							const resetDefault = confirm(`${type.name}${lang.isDefaultType}`);
							if (!resetDefault) {
								return;
							}
							// 清除默认类型设置
							this.plugin.settings.defaultArticleType = '';
						}
						
						// 删除笔记类型
						this.plugin.settings.articleTypes.splice(index, 1);
						await this.plugin.saveSettings();
						
						// 显示删除成功提示
						new Notice(`${lang.articleTypeDeleted}${type.name}`);
						
						// 重新渲染设置页面
						this.display();
					}));

			// 折叠/展开功能
			let expanded = isExpanded;
			const updateExpandState = () => {
				if (expanded) {
					detailsContainer.style.display = 'block';
					expandButton.textContent = '▲';
					typeContainer.addClass('expanded');
				} else {
					detailsContainer.style.display = 'none';
					expandButton.textContent = '▼';
					typeContainer.removeClass('expanded');
				}
			};

			const toggleExpand = (e: Event) => {
				e.stopPropagation();
				expanded = !expanded;
				updateExpandState();
			};

			// 点击头部区域或按钮都可以展开/折叠
			headerContainer.addEventListener('click', toggleExpand);
			expandButton.addEventListener('click', (e) => {
				e.stopPropagation(); // 防止重复触发
				toggleExpand(e);
			});

			// 初始状态
			updateExpandState();
		});

		// 笔记类型配置折叠状态更新函数
		const updateNoteTypesExpandState = () => {
			if (noteTypesExpanded) {
				noteTypesContentContainer.style.display = 'block';
				noteTypesExpandButtonEl.textContent = '▲';
			} else {
				noteTypesContentContainer.style.display = 'none';
				noteTypesExpandButtonEl.textContent = '▼';
			}
		};

		// 初始化笔记类型配置折叠状态
		updateNoteTypesExpandState();

		// Image Export Configuration
		const imageExportConfigSetting = new Setting(containerEl)
			.setName(lang.imageExportConfig)
			.setDesc(lang.imageExportConfigDesc);
		
		// 添加折叠按钮到图像配置
		let imageExportExpanded = this.plugin.settings.imageExportConfigExpanded ?? true; // 使用保存的状态，默认展开
		let imageExportExpandButtonEl: HTMLButtonElement;
		const imageExportExpandButton = imageExportConfigSetting.addButton(button => {
			imageExportExpandButtonEl = button.buttonEl;
			button.setButtonText(imageExportExpanded ? '▲' : '▼')
				.setTooltip('折叠/展开导出图像配置')
				.onClick(async () => {
					imageExportExpanded = !imageExportExpanded;
					this.plugin.settings.imageExportConfigExpanded = imageExportExpanded;
					await this.plugin.saveSettings();
					updateImageExportExpandState();
				});
			return button;
		});

		// 创建可折叠的图像配置内容容器
		const imageExportContentContainer = containerEl.createEl('div', { cls: 'image-export-content' });

		// Host
		new Setting(imageExportContentContainer)
			.setName(lang.host)
			.setDesc(lang.hostDesc)
			.addText(text => text
				.setPlaceholder('Enter host URL')
				.setValue(this.plugin.settings.host || '')
				.onChange(async (value) => {
					this.plugin.settings.host = value;
					await this.plugin.saveSettings();
				}));

		// Min image width percentage
		new Setting(imageExportContentContainer)
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

		// 图像配置折叠状态更新函数
		const updateImageExportExpandState = () => {
			if (imageExportExpanded) {
				imageExportContentContainer.style.display = 'block';
				imageExportExpandButtonEl.textContent = '▲';
			} else {
				imageExportContentContainer.style.display = 'none';
				imageExportExpandButtonEl.textContent = '▼';
			}
		};

		// 初始化图像配置折叠状态
		updateImageExportExpandState();

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
