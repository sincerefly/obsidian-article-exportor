import { App, Modal } from 'obsidian';
import { TFile } from 'obsidian';
import { IArticleExporter } from '../types';
import { getLanguageStrings } from '../services/language-service';

// 选择前缀路径的模态框类
export class PrefixPathSelectionModal extends Modal {
	plugin: IArticleExporter;
	file: TFile;
	onPathSelected: (selectedPath: string) => void;

	constructor(app: App, plugin: IArticleExporter, file: TFile, onPathSelected: (selectedPath: string) => void) {
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
			this.plugin.settings.prefixPaths.forEach((path: string) => {
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
