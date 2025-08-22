import { App } from 'obsidian';
import { LANGUAGES } from '../constants/languages';
import { LanguageStrings } from '../types';

// 获取当前语言
export function getCurrentLanguage(app: App): string {
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
export function getLanguageStrings(app: App): LanguageStrings {
	const lang = getCurrentLanguage(app);
	return LANGUAGES[lang] || LANGUAGES['en'];
}
