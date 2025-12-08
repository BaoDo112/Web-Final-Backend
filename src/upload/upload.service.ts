import { Injectable, OnModuleInit } from '@nestjs/common';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

@Injectable()
export class UploadService implements OnModuleInit {
    private s3Client: S3Client;
    private bucketName: string;

    constructor() {
        this.bucketName = process.env.R2_BUCKET_NAME || 'edtech-platform';

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
        });
    }

    async onModuleInit() {
        // Note: R2 bucket-scoped API tokens don't support ListBuckets operation
        // The actual upload (PutObject) will work fine
        const accountId = process.env.R2_ACCOUNT_ID || '';
        if (accountId) {
            console.log(`R2 configured with bucket: ${this.bucketName}`);
        } else {
            console.warn('R2_ACCOUNT_ID not set - file uploads will not work');
        }
    }

    async getPresignedUrl(fileName: string, fileType: string) {
        const key = `uploads/${Date.now()}-${fileName}`;
        const command = new PutObjectCommand({
            Bucket: this.bucketName,
            Key: key,
            ContentType: fileType,
        });

        const url = await getSignedUrl(this.s3Client, command, { expiresIn: 3600 });

        // Public URL for accessing the file after upload (assuming public access is enabled or using a custom domain)
        // If using R2.dev subdomain or custom domain, replace the endpoint.
        // For now, we return the S3 endpoint URL, but usually you'd want a clean public URL.
        const publicUrl = `${process.env.R2_ENDPOINT}/${this.bucketName}/${key}`;

        return {
            uploadUrl: url,
            publicUrl: publicUrl, // Note: This might need adjustment based on R2 public access config
            key: key
        };
    }
}
