import { ArticleExporterSettings } from '../types';

// 默认设置
export const DEFAULT_SETTINGS: ArticleExporterSettings = {
	mySetting: 'default',
	host: '', // 默认主机为空
	defaultPrefixPath: '', // 默认前缀路径为空
	prefixPaths: [], // 前缀路径列表
	minImageWidthPercentage: 0, // 默认不限制最小宽度
	enableMetaData: false // 默认不启用 meta 元数据
};
