import { App, Modal } from 'obsidian';

// 示例模态框类
export class SampleModal extends Modal {
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
