import { LanguageStrings } from '../types';

// 语言配置
export const LANGUAGES: Record<string, LanguageStrings> = {
	'zh': {
		// 设置项
		exportDirectory: '导出目录',
		exportDirectoryDesc: '选择导出笔记的目录',
		host: '主机地址',
		hostDesc: '图片链接的主机地址（例如：https://images.yasking.org）',
		defaultPrefixPath: '默认前缀路径',
		defaultPrefixPathDesc: '默认前缀路径（例如：moments）',
		prefixPathsList: '前缀路径列表',
		prefixPathsListDesc: '可用的前缀路径列表（每行一个）',
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
		
		// 模态框
		selectPrefixPath: '选择前缀路径',
		selectPrefixPathDesc: '请选择要使用的前缀路径：',
		defaultOption: '默认：',
		noPrefixOption: '不使用前缀路径',
		cancel: '取消',
		
		// 命令
		exportCurrentNote: '导出当前笔记'
	},
	'en': {
		// 设置项
		exportDirectory: 'Export Directory',
		exportDirectoryDesc: 'Directory to export notes to',
		host: 'Host',
		hostDesc: 'Host for image URLs (e.g., https://images.yasking.org)',
		defaultPrefixPath: 'Default Prefix Path',
		defaultPrefixPathDesc: 'Default prefix path for image URLs (e.g., moments)',
		prefixPathsList: 'Prefix Paths List',
		prefixPathsListDesc: 'List of available prefix paths (one per line)',
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
		
		// 模态框
		selectPrefixPath: 'Select Prefix Path',
		selectPrefixPathDesc: 'Please select the prefix path to use:',
		defaultOption: 'Default: ',
		noPrefixOption: 'No Prefix Path',
		cancel: 'Cancel',
		
		// 命令
		exportCurrentNote: 'Export Current Note'
	}
};
