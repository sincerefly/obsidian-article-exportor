import { LanguageStrings } from '../types';

// 语言配置
export const LANGUAGES: Record<string, LanguageStrings> = {
	'zh': {
		// 设置项
		exportDirectory: '导出目录',
		exportDirectoryDesc: '选择导出笔记的目录',
		host: '主机地址',
		hostDesc: '图片链接的主机地址（例如：https://images.yasking.org）',
		defaultArticleType: '默认文章类型',
		defaultArticleTypeDesc: '选择默认的文章类型，如果不设置则每次导出时都会弹出选择对话框',
		articleTypesConfig: '文章类型配置',
		articleTypesConfigDesc: '配置不同的文章类型，每个类型可以设置前缀路径',
		minImageWidthPercentage: '最小图片宽度百分比',
		minImageWidthPercentageDesc: '设置图片的最小宽度百分比（0表示不限制）',
		enableMetaData: '启用 Meta 元数据',
		enableMetaDataDesc: '导出时在文章开头自动添加 title、date、id 等元数据',
		browse: '浏览',
		
		// 提示信息
		noActiveNote: '没有活动的笔记可导出。',
		exportSuccess: '笔记和图片已导出到',
		exportFailed: '导出笔记失败。',
		setExportDirectoryFirst: '请先设置插件的导出目录',
		cannotOpenFilePicker: '无法打开文件选择器，请手动输入路径',
		pleaseEnterPath: '请手动输入导出目录路径，或使用系统文件管理器选择后复制路径',
		noEnabledArticleTypes: '没有启用的文章类型，请在设置中配置',
		
		// 模态框
		selectArticleType: '选择文章类型',
		selectArticleTypeDesc: '为文件选择文章类型：',
		cancel: '取消',
		confirm: '确认',
		
		// 命令
		exportCurrentNote: '导出当前笔记'
	},
	'en': {
		// 设置项
		exportDirectory: 'Export Directory',
		exportDirectoryDesc: 'Directory to export notes to',
		host: 'Host',
		hostDesc: 'Host for image URLs (e.g., https://images.yasking.org)',
		defaultArticleType: 'Default Article Type',
		defaultArticleTypeDesc: 'Select default article type, if not set, selection dialog will appear each time',
		articleTypesConfig: 'Article Types Configuration',
		articleTypesConfigDesc: 'Configure different article types, each type can set prefix path',
		minImageWidthPercentage: 'Min Image Width Percentage',
		minImageWidthPercentageDesc: 'Set minimum image width percentage (0 means no limit)',
		enableMetaData: 'Enable Meta Data',
		enableMetaDataDesc: 'Automatically add title, date, id metadata at the beginning of exported articles',
		browse: 'Browse',
		
		// 提示信息
		noActiveNote: 'No active note to export.',
		exportSuccess: 'Note and images exported to',
		exportFailed: 'Failed to export note.',
		setExportDirectoryFirst: 'Please set the plugin export directory first',
		cannotOpenFilePicker: 'Cannot open file picker, please enter path manually',
		pleaseEnterPath: 'Please manually enter the export directory path, or use system file manager to select and copy the path',
		noEnabledArticleTypes: 'No enabled article types, please configure in settings',
		
		// 模态框
		selectArticleType: 'Select Article Type',
		selectArticleTypeDesc: 'Select article type for file:',
		cancel: 'Cancel',
		confirm: 'Confirm',
		
		// 命令
		exportCurrentNote: 'Export Current Note'
	}
};
