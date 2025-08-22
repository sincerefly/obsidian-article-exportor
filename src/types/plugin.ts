import { Plugin, TFile } from 'obsidian';
import { ArticleExporterSettings, ArticleTypeConfig } from './settings';

// 插件主类接口
export interface IArticleExporter extends Plugin {
	settings: ArticleExporterSettings;
	exportNoteToFile(file: TFile, articleType: ArticleTypeConfig): Promise<void>;
}
