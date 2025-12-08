import { Injectable, OnModuleInit, BadRequestException } from '@nestjs/common';
import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';

interface UploadOptions {
    folder: string;
    fileName: string;
    fileType: string;
    maxSize?: number; // bytes
    allowedTypes?: string[];
}

@Injectable()
export class UploadService implements OnModuleInit {
    private s3Client: S3Client;
    private bucketName: string;
    private publicBaseUrl: string;

    // File size limits (bytes)
    private readonly SIZE_LIMITS = {
        avatar: 5 * 1024 * 1024,        // 5 MB
        thumbnail: 2 * 1024 * 1024,     // 2 MB
        video: 500 * 1024 * 1024,       // 500 MB
        file: 50 * 1024 * 1024,         // 50 MB
        cv: 10 * 1024 * 1024,           // 10 MB
    };

    // Allowed MIME types
    private readonly ALLOWED_TYPES = {
        avatar: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
        thumbnail: ['image/jpeg', 'image/png', 'image/webp'],
        video: ['video/mp4', 'video/webm', 'video/quicktime'],
        file: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/zip', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation'],
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
            forcePathStyle: true, // Required for R2 CORS to work properly
        });

        // Public URL (can be custom domain like cdn.nervis.dev)
        this.publicBaseUrl = process.env.R2_PUBLIC_URL || `https://${accountId}.r2.cloudflarestorage.com/${this.bucketName}`;
    }

    async onModuleInit() {
        const accountId = process.env.R2_ACCOUNT_ID || '';
        if (accountId) {
            console.log(`✅ R2 configured with bucket: ${this.bucketName}`);
        } else {
            console.warn('⚠️ R2_ACCOUNT_ID not set - file uploads will not work');
        }
    }

    // ═══════════════════════════════════════════════════════════════
    // AVATAR UPLOAD
    // ═══════════════════════════════════════════════════════════════
    async getAvatarPresignedUrl(userId: string, fileType: string) {
        this.validateFileType(fileType, this.ALLOWED_TYPES.avatar);
        const ext = this.getExtension(fileType);
        const key = `avatars/${userId}/avatar.${ext}`;
        return this.generatePresignedUrl(key, fileType, this.SIZE_LIMITS.avatar);
    }

    // ═══════════════════════════════════════════════════════════════
    // CONTENT UPLOADS (Thumbnail, Video, Files)
    // ═══════════════════════════════════════════════════════════════
    async getContentThumbnailPresignedUrl(contentId: string, fileType: string) {
        this.validateFileType(fileType, this.ALLOWED_TYPES.thumbnail);
        const ext = this.getExtension(fileType);
        const key = `content/${contentId}/thumbnail.${ext}`;
        return this.generatePresignedUrl(key, fileType, this.SIZE_LIMITS.thumbnail);
    }

    async getContentVideoPresignedUrl(contentId: string, fileType: string) {
        this.validateFileType(fileType, this.ALLOWED_TYPES.video);
        const key = `content/${contentId}/video/original.mp4`;
        return this.generatePresignedUrl(key, fileType, this.SIZE_LIMITS.video);
    }

    async getContentFilePresignedUrl(contentId: string, fileName: string, fileType: string) {
        this.validateFileType(fileType, this.ALLOWED_TYPES.file);
        const safeFileName = this.sanitizeFileName(fileName);
        const key = `content/${contentId}/files/${safeFileName}`;
        return this.generatePresignedUrl(key, fileType, this.SIZE_LIMITS.file);
    }

    // ═══════════════════════════════════════════════════════════════
    // CV UPLOAD
    // ═══════════════════════════════════════════════════════════════
    async getCvPresignedUrl(userId: string, fileType: string) {
        this.validateFileType(fileType, this.ALLOWED_TYPES.cv);
        const key = `cv/${userId}/cv.pdf`;
        return this.generatePresignedUrl(key, fileType, this.SIZE_LIMITS.cv);
    }

    // ═══════════════════════════════════════════════════════════════
    // GENERIC PRESIGN (legacy compatibility)
    // ═══════════════════════════════════════════════════════════════
    async getPresignedUrl(fileName: string, fileType: string) {
        const key = `uploads/${Date.now()}-${this.sanitizeFileName(fileName)}`;
        return this.generatePresignedUrl(key, fileType, this.SIZE_LIMITS.file);
    }

    // ═══════════════════════════════════════════════════════════════
    // DELETE FILE
    // ═══════════════════════════════════════════════════════════════
    async deleteFile(key: string) {
        try {
            const command = new DeleteObjectCommand({
                Bucket: this.bucketName,
                Key: key,
            });
            await this.s3Client.send(command);
            return { success: true };
        } catch (error) {
            console.error('Failed to delete file:', error);
            throw new BadRequestException('Failed to delete file');
        }
    }

    // ═══════════════════════════════════════════════════════════════
    // PRIVATE HELPERS
    // ═══════════════════════════════════════════════════════════════
    private async generatePresignedUrl(key: string, contentType: string, maxSize: number) {
        const command = new PutObjectCommand({
            Bucket: this.bucketName,
            Key: key,
            ContentType: contentType,
        });

        const uploadUrl = await getSignedUrl(this.s3Client, command, { expiresIn: 3600 });
        const publicUrl = `${this.publicBaseUrl}/${key}`;

        return {
            uploadUrl,
            publicUrl,
            key,
            maxSize,
            contentType,
        };
    }

    private validateFileType(fileType: string, allowedTypes: string[]) {
        if (!allowedTypes.includes(fileType)) {
            throw new BadRequestException(`Invalid file type: ${fileType}. Allowed: ${allowedTypes.join(', ')}`);
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

    private sanitizeFileName(fileName: string): string {
        return fileName
            .toLowerCase()
            .replace(/[^a-z0-9.-]/g, '_')
            .replace(/_+/g, '_')
            .substring(0, 100);
    }
}
