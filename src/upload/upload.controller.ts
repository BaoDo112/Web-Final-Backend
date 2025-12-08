import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { UploadService } from './upload.service';
// import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('upload')
export class UploadController {
    constructor(private readonly uploadService: UploadService) { }

    @Post('presign')
    // @UseGuards(JwtAuthGuard)
    async getPresignedUrl(@Body() body: { fileName: string; fileType: string }) {
        return this.uploadService.getPresignedUrl(body.fileName, body.fileType);
    }
}
