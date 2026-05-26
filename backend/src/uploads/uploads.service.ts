import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class UploadsService {
  private s3Client: S3Client;
  private bucketName: string;

  constructor(private configService: ConfigService) {
    this.bucketName = this.configService.get<string>('MINIO_BUCKET') || 'compras';
    
    this.s3Client = new S3Client({
      region: 'us-east-1', // Default region for MinIO if not configured
      endpoint: `http://${this.configService.get<string>('MINIO_ENDPOINT')}:${this.configService.get<string>('MINIO_PORT')}`,
      forcePathStyle: true, // Required for MinIO
      credentials: {
        accessKeyId: this.configService.get<string>('MINIO_ACCESS_KEY') || '',
        secretAccessKey: this.configService.get<string>('MINIO_SECRET_KEY') || '',
      },
    });
  }

  async uploadFile(file: Express.Multer.File): Promise<{ url: string; key: string; name: string }> {
    try {
      // Generate unique key
      const extension = file.originalname.split('.').pop();
      const uniqueId = uuidv4();
      const key = `${uniqueId}.${extension}`;

      // Upload
      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
      });

      await this.s3Client.send(command);

      // Return public URL (assuming bucket is configured for public read)
      const endpoint = `http://${this.configService.get<string>('MINIO_ENDPOINT')}:${this.configService.get<string>('MINIO_PORT')}`;
      const url = `${endpoint}/${this.bucketName}/${key}`;

      return {
        url,
        key,
        name: file.originalname,
      };
    } catch (error) {
      console.error('Error uploading file to MinIO:', error);
      throw new InternalServerErrorException('Falha ao fazer o upload do arquivo.');
    }
  }
}
