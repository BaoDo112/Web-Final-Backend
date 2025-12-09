import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { UploadService } from './upload.service';
import { UploadController } from './upload.controller';

@Module({
    imports: [
        MulterModule.register({
            storage: memoryStorage(), // Store in memory for streaming to R2
            limits: {
                fileSize: 500 * 1024 * 1024, // 500MB max
            },
        }),
    ],
    controllers: [UploadController],
    providers: [UploadService],
    exports: [UploadService],
})
export class UploadModule { }
