import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { extname } from 'node:path';

@Injectable()
export class StorageService {
  private readonly bucketName = process.env.S3_BUCKET_NAME;
  private readonly endpoint = process.env.S3_ENDPOINT;
  private readonly publicBaseUrl = process.env.S3_PUBLIC_BASE_URL;
  private readonly client?: S3Client;

  constructor() {
    if (
      this.endpoint &&
      this.bucketName &&
      process.env.S3_ACCESS_KEY_ID &&
      process.env.S3_SECRET_ACCESS_KEY
    ) {
      this.client = new S3Client({
        endpoint: this.endpoint,
        region: process.env.S3_REGION ?? 'ru-central1',
        forcePathStyle: true,
        credentials: {
          accessKeyId: process.env.S3_ACCESS_KEY_ID,
          secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
        },
      });
    }
  }

  async uploadMoviePoster(file: Express.Multer.File): Promise<string> {
    return this.uploadToS3(file);
  }

  private buildSafeBasename(originalName: string): string {
    const extension = extname(originalName).toLowerCase();
    return (
      originalName
        .replace(extension, '')
        .toLowerCase()
        .replace(/[^a-z0-9_-]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 48) || 'poster'
    );
  }

  private getExtension(file: Express.Multer.File): string {
    const ext = extname(file.originalname).toLowerCase();
    if (ext) {
      return ext;
    }

    if (file.mimetype === 'image/png') {
      return '.png';
    }
    if (file.mimetype === 'image/webp') {
      return '.webp';
    }

    return '.jpg';
  }

  private async uploadToS3(file: Express.Multer.File): Promise<string> {
    if (!this.client || !this.bucketName || !this.endpoint) {
      throw new Error('S3 не настроен');
    }

    const extension = this.getExtension(file);
    const basename = this.buildSafeBasename(file.originalname);

    const objectKey = `posters/${Date.now()}-${randomUUID()}-${basename}${extension}`;

    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucketName,
        Key: objectKey,
        Body: file.buffer,
        ContentType: file.mimetype,
      }),
    );

    if (this.publicBaseUrl) {
      const normalizedBase = this.publicBaseUrl.replace(/\/+$/, '');
      return `${normalizedBase}/${objectKey}`;
    }

    const normalizedEndpoint = this.endpoint.replace(/\/+$/, '');
    return `${normalizedEndpoint}/${this.bucketName}/${objectKey}`;
  }
}
