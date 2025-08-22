import { App, Modal, TFile } from 'obsidian';
import { IArticleExporter, ArticleTypeConfig } from '../types';
import { getLanguageStrings } from '../services/language-service';

export class ArticleTypeSelectionModal extends Modal {
	public app: App;
	private plugin: IArticleExporter;
	private file: TFile;
	private onSelect: (selectedType: ArticleTypeConfig) => void;
	private selectedType: ArticleTypeConfig | null = null;

	constructor(
		app: App, 
		plugin: IArticleExporter, 
		file: TFile, 
		onSelect: (selectedType: ArticleTypeConfig) => void
	) {
		super(app);
		this.app = app;
		this.plugin = plugin;
		this.file = file;
		this.onSelect = onSelect;
	}

	onOpen() {
		const { contentEl } = this;
		const lang = getLanguageStrings(this.app);

		contentEl.createEl('h2', { text: lang.selectArticleType });
		contentEl.createEl('p', { text: `${lang.selectArticleTypeDesc} "${this.file.basename}"` });

		// 创建文章类型列表
		const typeList = contentEl.createEl('div', { cls: 'article-type-list' });
		
		this.plugin.settings.articleTypes
			.filter(type => type.enabled)
			.forEach(type => {
				const typeItem = typeList.createEl('div', { 
					cls: 'article-type-item',
					attr: { 'data-type': type.name }
				});

				// 类型名称
				typeItem.createEl('h3', { text: type.name });

				// 前缀路径信息
				const typeInfo = typeItem.createEl('div', { cls: 'article-type-info' });
				typeInfo.createEl('span', { 
					text: `前缀路径: ${type.prefixPath}`,
					cls: 'prefix-path'
				});

				// 点击选择
				typeItem.addEventListener('click', () => {
					// 移除其他选中状态
					typeList.querySelectorAll('.article-type-item').forEach(item => {
						item.removeClass('selected');
					});
					
					// 添加选中状态
					typeItem.addClass('selected');
					this.selectedType = type;
				});

				// 双击确认选择
				typeItem.addEventListener('dblclick', () => {
					if (this.selectedType) {
						this.onSelect(this.selectedType);
						this.close();
					}
				});
			});

		// 按钮区域
		const buttonContainer = contentEl.createEl('div', { cls: 'modal-button-container' });
		
		const cancelButton = buttonContainer.createEl('button', { 
			text: lang.cancel,
			cls: 'mod-warning'
		});
		cancelButton.addEventListener('click', () => {
			this.close();
		});

		const confirmButton = buttonContainer.createEl('button', { 
			text: lang.confirm,
			cls: 'mod-cta'
		});
		confirmButton.addEventListener('click', () => {
			if (this.selectedType) {
				this.onSelect(this.selectedType);
				this.close();
			}
		});

		// 默认选择第一个类型
		const firstType = this.plugin.settings.articleTypes.find(type => type.enabled);
		if (firstType) {
			this.selectedType = firstType;
			const firstItem = typeList.querySelector(`[data-type="${firstType.name}"]`);
			if (firstItem) {
				firstItem.addClass('selected');
			}
		}
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}
