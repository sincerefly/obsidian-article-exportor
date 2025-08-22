import { moment } from 'obsidian';
import { ArticleTypeConfig } from '../types';

// 生成元数据字符串
export function generateMetaData(
	articleType: ArticleTypeConfig,
	filename: string,
	timestamp: string
): string {
	const metaData = `title: ${filename}\n` +
		`date: ${moment().format('YYYY-MM-DD HH:mm:ss')}\n` +
		`id: ${timestamp}\n` +
		`category: ${articleType.name}\n\n`;

	return metaData;
}

// 根据名称获取文章类型配置
export function getArticleTypeByName(
	articleTypes: ArticleTypeConfig[],
	name: string
): ArticleTypeConfig | undefined {
	return articleTypes.find(type => type.name === name);
}

// 获取启用的文章类型列表
export function getEnabledArticleTypes(articleTypes: ArticleTypeConfig[]): ArticleTypeConfig[] {
	return articleTypes.filter(type => type.enabled);
}
