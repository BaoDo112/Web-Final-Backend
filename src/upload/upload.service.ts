import { Injectable, OnModuleInit, BadRequestException } from '@nestjs/common';
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';

@Injectable()
export class UploadService implements OnModuleInit {
    private s3Client: S3Client;
    private bucketName: string;
    private publicBaseUrl: string;

    // File size limits
    private readonly MAX_SIZES = {
        avatar: 5 * 1024 * 1024, // 5MB
        thumbnail: 2 * 1024 * 1024, // 2MB
        video: 500 * 1024 * 1024, // 500MB
        file: 50 * 1024 * 1024, // 50MB
        cv: 10 * 1024 * 1024, // 10MB
    };

    // Allowed MIME types
    private readonly ALLOWED_TYPES = {
        avatar: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
        thumbnail: ['image/jpeg', 'image/png', 'image/webp'],
        video: ['video/mp4', 'video/webm', 'video/quicktime'],
        file: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain', 'image/jpeg', 'image/png'],
        cv: ['application/pdf'],
    };

    constructor() {
        this.bucketName = process.env.R2_BUCKET_NAME || 'nervis';
        const accountId = process.env.R2_ACCOUNT_ID || '';
        const accessKeyId = process.env.R2_ACCESS_KEY_ID || '';
        const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY || '';

        this.s3Client = new S3Client({
            region: 'auto',
            endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
            credentials: {
                accessKeyId,
                secretAccessKey,
            },
            forcePathStyle: true,
        });

        // Public URL - use custom domain if available
        this.publicBaseUrl = process.env.R2_PUBLIC_URL || `https://pub-${accountId}.r2.dev`;
    }

    async onModuleInit() {
        const accountId = process.env.R2_ACCOUNT_ID || '';
        if (accountId) {
            console.log(`✅ R2 configured with bucket: ${this.bucketName}`);
        } else {
            console.warn('⚠️ R2 not configured - R2_ACCOUNT_ID missing');
        }
    }

    // ═══════════════════════════════════════════════════════════════
    // AVATAR
    // ═══════════════════════════════════════════════════════════════
    async uploadAvatar(userId: string, file: Express.Multer.File) {
        this.validateFile(file, 'avatar');

        const ext = this.getExtension(file.mimetype);
        const key = `avatars/${userId}/avatar.${ext}`;

        await this.uploadToR2(key, file.buffer, file.mimetype);

        return {
            url: `${this.publicBaseUrl}/${key}`,
            key,
        };
    }

    // ═══════════════════════════════════════════════════════════════
    // CONTENT THUMBNAIL
    // ═══════════════════════════════════════════════════════════════
    async uploadContentThumbnail(contentId: string, file: Express.Multer.File) {
        this.validateFile(file, 'thumbnail');

        const ext = this.getExtension(file.mimetype);
        const key = `content/${contentId}/thumbnail.${ext}`;

        await this.uploadToR2(key, file.buffer, file.mimetype);

        return {
            url: `${this.publicBaseUrl}/${key}`,
            key,
        };
    }

    // ═══════════════════════════════════════════════════════════════
    // CONTENT VIDEO
    // ═══════════════════════════════════════════════════════════════
    async uploadContentVideo(contentId: string, file: Express.Multer.File) {
        this.validateFile(file, 'video');

        const ext = this.getExtension(file.mimetype);
        const key = `content/${contentId}/video/original.${ext}`;

        await this.uploadToR2(key, file.buffer, file.mimetype);

        return {
            url: `${this.publicBaseUrl}/${key}`,
            key,
        };
    }

    // ═══════════════════════════════════════════════════════════════
    // CONTENT FILE
    // ═══════════════════════════════════════════════════════════════
    async uploadContentFile(contentId: string, file: Express.Multer.File) {
        this.validateFile(file, 'file');

        // Preserve original filename
        const safeFilename = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
        const key = `content/${contentId}/files/${safeFilename}`;

        await this.uploadToR2(key, file.buffer, file.mimetype);

        return {
            url: `${this.publicBaseUrl}/${key}`,
            key,
            filename: file.originalname,
        };
    }

    // ═══════════════════════════════════════════════════════════════
    // CV
    // ═══════════════════════════════════════════════════════════════
    async uploadCV(userId: string, file: Express.Multer.File) {
        this.validateFile(file, 'cv');

        const key = `cv/${userId}/cv.pdf`;

        await this.uploadToR2(key, file.buffer, file.mimetype);

        return {
            url: `${this.publicBaseUrl}/${key}`,
            key,
        };
    }

    // ═══════════════════════════════════════════════════════════════
    // DELETE FILE
    // ═══════════════════════════════════════════════════════════════
    async deleteFile(key: string) {
        const command = new DeleteObjectCommand({
            Bucket: this.bucketName,
            Key: key,
        });

        await this.s3Client.send(command);
        return { success: true, message: 'File deleted' };
    }

    // ═══════════════════════════════════════════════════════════════
    // HELPERS
    // ═══════════════════════════════════════════════════════════════
    private async uploadToR2(key: string, buffer: Buffer, contentType: string) {
        const command = new PutObjectCommand({
            Bucket: this.bucketName,
            Key: key,
            Body: buffer,
            ContentType: contentType,
        });

        try {
            await this.s3Client.send(command);
            console.log(`✅ Uploaded: ${key}`);
        } catch (error) {
            console.error(`❌ Upload failed for ${key}:`, error);
            throw new BadRequestException(`Failed to upload file: ${error.message}`);
        }
    }

    private validateFile(file: Express.Multer.File, type: keyof typeof this.MAX_SIZES) {
        if (!file) {
            throw new BadRequestException('No file provided');
        }

        const maxSize = this.MAX_SIZES[type];
        const allowedTypes = this.ALLOWED_TYPES[type];

        if (file.size > maxSize) {
            throw new BadRequestException(`File size exceeds ${maxSize / 1024 / 1024}MB limit`);
        }

        if (!allowedTypes.includes(file.mimetype)) {
            throw new BadRequestException(`Invalid file type. Allowed: ${allowedTypes.join(', ')}`);
        }
    }

    private getExtension(mimeType: string): string {
        const map: Record<string, string> = {
            'image/jpeg': 'jpg',
            'image/png': 'png',
            'image/webp': 'webp',
            'image/gif': 'gif',
            'video/mp4': 'mp4',
            'video/webm': 'webm',
            'video/quicktime': 'mov',
            'application/pdf': 'pdf',
        };
        return map[mimeType] || 'bin';
    }
}
