import * as path from 'path';

/**
 * 获取文件扩展名并转换为小写
 * @param fileName 文件名
 * @returns 小写的文件扩展名
 */
export function getFileExtension(fileName: string): string {
	return path.extname(fileName).toLowerCase();
}

/**
 * 生成图片文件名
 * @param index 图片索引
 * @param extension 文件扩展名
 * @returns 格式化的图片文件名
 */
export function generateImageFileName(index: number, extension: string): string {
	return `${String(index).padStart(2, '0')}${extension}`;
}

/**
 * 生成图片URL
 * @param host 主机地址
 * @param prefixPath 前缀路径
 * @param timestamp 时间戳
 * @param imageName 图片文件名
 * @returns 完整的图片URL
 */
export function generateImageUrl(
	host: string | undefined,
	prefixPath: string,
	timestamp: string,
	imageName: string
): string {
	if (host) {
		if (prefixPath) {
			return `${host}/${prefixPath}/${timestamp}/${imageName}`;
		} else {
			return `${host}/${timestamp}/${imageName}`;
		}
	}
	return `${timestamp}/${imageName}`;
}
