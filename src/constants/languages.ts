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
		exportCurrentNote: '导出当前笔记',
		
		// 文章类型管理
		addNewArticleType: '添加新文章类型',
		articleTypeName: '类型名称 *',
		articleTypeNameDesc: '输入文章类型名称，如：Moments、Photos、Reading等',
		articleTypeNamePlaceholder: '输入类型名称（必填）',
		prefixPath: '前缀路径',
		prefixPathDesc: '输入图片链接的前缀路径，如：moments、photos、reading等（可为空）',
		prefixPathPlaceholder: '输入前缀路径（可选）',
		addArticleTypeButton: '+ 添加文章类型',
		pleaseEnterTypeName: '请输入类型名称',
		duplicateTypeName: '已存在相同名称的文章类型',
		articleTypeAdded: '已添加文章类型：',
		articleTypeDeleted: '已删除文章类型：',
		deleteArticleType: '删除',
		confirmDeleteType: '确定要删除文章类型"',
		confirmDeleteTypeDesc: '"吗？\n\n删除后无法恢复，请谨慎操作。',
		isDefaultType: '"是当前的默认文章类型。\n\n删除后将清除默认设置，是否继续？',
		confirmDeleteDefaultType: '',
		confirmDeleteDefaultTypeDesc: '',
		confirmContinue: '是否继续？',
		enabled: '已启用',
		disabled: '已禁用',
		enableType: '启用类型'
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
		exportCurrentNote: 'Export Current Note',
		
		// 文章类型管理
		addNewArticleType: 'Add New Article Type',
		articleTypeName: 'Type Name *',
		articleTypeNameDesc: 'Enter article type name, such as: Moments, Photos, Reading, etc.',
		articleTypeNamePlaceholder: 'Enter type name (required)',
		prefixPath: 'Prefix Path',
		prefixPathDesc: 'Enter prefix path for image URLs, such as: moments, photos, reading, etc. (can be empty)',
		prefixPathPlaceholder: 'Enter prefix path (optional)',
		addArticleTypeButton: '+ Add Article Type',
		pleaseEnterTypeName: 'Please enter type name',
		duplicateTypeName: 'Article type with the same name already exists',
		articleTypeAdded: 'Article type added: ',
		articleTypeDeleted: 'Article type deleted: ',
		deleteArticleType: 'Delete',
		confirmDeleteType: 'Are you sure you want to delete article type "',
		confirmDeleteTypeDesc: '"?\n\nThis action cannot be undone, please proceed with caution.',
		isDefaultType: '" is the current default article type.\n\nDeleting will clear the default setting, continue?',
		confirmDeleteDefaultType: '',
		confirmDeleteDefaultTypeDesc: '',
		confirmContinue: 'Continue?',
		enabled: 'Enabled',
		disabled: 'Disabled',
		enableType: 'Enable Type'
	}
};
