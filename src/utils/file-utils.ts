import * as fs from 'fs';
import * as path from 'path';
import { moment } from 'obsidian';

/**
 * 创建导出目录
 * @param exportDir 基础导出目录
 * @returns 时间戳目录路径
 */
export function createExportDirectory(exportDir: string): string {
	const timestamp = moment().format('X');
	const imageDir = path.join(exportDir, timestamp);
	fs.mkdirSync(imageDir, { recursive: true });
	return timestamp;
}

/**
 * 保存图片文件
 * @param imageData 图片数据
 * @param imagePath 图片保存路径
 */
export function saveImageFile(imageData: ArrayBuffer, imagePath: string): void {
	// 确保目录存在
	const dir = path.dirname(imagePath);
	if (!fs.existsSync(dir)) {
		fs.mkdirSync(dir, { recursive: true });
	}
	fs.writeFileSync(imagePath, Buffer.from(imageData));
}

/**
 * 保存文章文件
 * @param content 文章内容
 * @param filePath 文件保存路径
 * @param onSuccess 成功回调
 * @param onError 错误回调
 */
export function saveArticleFile(
	content: string,
	filePath: string,
	onSuccess: () => void,
	onError: (error: any) => void
): void {
	fs.writeFile(filePath, content, (err) => {
		if (err) {
			onError(err);
		} else {
			onSuccess();
		}
	});
}
