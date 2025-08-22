// 定义笔记类型配置接口
export interface ArticleTypeConfig {
	name: string; // 笔记类型名称，用户自定义
	prefixPath: string; // 前缀路径
	enabled: boolean; // 是否启用
}

// 定义插件的设置接口
export interface ArticleExporterSettings {
	mySetting: string; // 自定义设置
	exportDirectory?: string; // 导出目录
	host?: string; // 图片链接的主机地址
	defaultArticleType?: string; // 默认笔记类型名称
	articleTypes: ArticleTypeConfig[]; // 笔记类型配置列表
	minImageWidthPercentage?: number; // 图片最小宽度百分比
	enableMetaData?: boolean; // 是否启用生成 meta 元数据
	noteTypesConfigExpanded?: boolean; // 笔记类型配置是否展开
	imageExportConfigExpanded?: boolean; // 导出图像配置是否展开
}
