import { Plugin } from 'obsidian';
import { ArticleExporterSettings } from './settings';

// 插件主类接口
export interface IArticleExporter extends Plugin {
	settings: ArticleExporterSettings;
	exportNoteToFile(file: any, selectedPrefixPath?: string): Promise<void>;
}
