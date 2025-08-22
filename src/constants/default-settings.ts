import { ArticleExporterSettings } from '../types';

// 默认设置
export const DEFAULT_SETTINGS: ArticleExporterSettings = {
	mySetting: 'default',
	host: '', // 默认主机为空
	defaultArticleType: '', // 默认笔记类型为空
	articleTypes: [
		// 示例笔记类型，用户可以删除或修改
		{
			name: 'Moments',
			prefixPath: 'moments',
			enabled: true
		},
		{
			name: 'Photos',
			prefixPath: 'photos',
			enabled: true
		},
		{
			name: 'Reading',
			prefixPath: 'reading',
			enabled: true
		},
		{
			name: 'Skills',
			prefixPath: 'skills',
			enabled: true
		},
		{
			name: 'Technology',
			prefixPath: 'technology',
			enabled: true
		}
	],
	minImageWidthPercentage: 0, // 默认不限制最小宽度
	enableMetaData: false, // 默认不启用 meta 元数据
	noteTypesConfigExpanded: true // 默认展开笔记类型配置
};
