import { TFile } from 'obsidian';
import { getFileExtension, generateImageFileName, generateImageUrl } from '../utils/path-utils';
import { saveImageFile } from '../utils/file-utils';
import * as path from 'path';

/**
 * 处理图片文件
 */
export class ImageService {
	/**
	 * 处理单个图片
	 * @param imageFile 图片文件
	 * @param imageIndex 图片索引
	 * @param imageDir 图片保存目录
	 * @param host 主机地址
	 * @param selectedPrefixPath 选择的前缀路径
	 * @param timestamp 时间戳
	 * @returns 处理结果
	 */
	static async processImage(
		imageFile: TFile,
		imageIndex: number,
		imageDir: string,
		host: string | undefined,
		selectedPrefixPath: string,
		timestamp: string
	): Promise<{ imageName: string; imageUrl: string; imageData: ArrayBuffer }> {
		// 读取图片数据
		const imageData = await imageFile.vault.readBinary(imageFile);
		
		// 获取文件扩展名
		const originalExtension = getFileExtension(imageFile.name);
		
		// 生成图片文件名
		const imageName = generateImageFileName(imageIndex, originalExtension);
		
		// 生成图片保存路径
		const imageExportPath = path.join(imageDir, imageName);
		
		// 保存图片
		saveImageFile(imageData, imageExportPath);
		
		// 生成图片URL
		const imageUrl = generateImageUrl(host, selectedPrefixPath, timestamp, imageName);
		
		return { imageName, imageUrl, imageData };
	}

	/**
	 * 计算图片宽度百分比
	 * @param specifiedWidth 指定宽度
	 * @param actualWidth 实际宽度
	 * @param minWidthPercentage 最小宽度百分比
	 * @returns 宽度百分比字符串
	 */
	static calculateWidthPercentage(
		specifiedWidth: number,
		actualWidth: number,
		minWidthPercentage: number = 0
	): string {
		let widthPercentage = ((specifiedWidth / actualWidth) * 100).toFixed(2);
		
		// 如果设置了最小宽度百分比且计算出的宽度小于最小值，则使用最小值
		if (minWidthPercentage && parseFloat(widthPercentage) < minWidthPercentage) {
			widthPercentage = minWidthPercentage.toFixed(2);
		}
		
		return widthPercentage;
	}
}
