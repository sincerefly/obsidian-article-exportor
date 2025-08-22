// 定义插件的设置接口
export interface ArticleExporterSettings {
	mySetting: string; // 自定义设置
	exportDirectory?: string; // 导出目录
	host?: string; // 图片链接的主机地址
	defaultPrefixPath?: string; // 默认前缀路径
	prefixPaths?: string[]; // 前缀路径列表
	minImageWidthPercentage?: number; // 图片最小宽度百分比
	enableMetaData?: boolean; // 是否启用生成 meta 元数据
}
