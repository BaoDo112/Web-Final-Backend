import { Controller, Post, Delete, Body, UseGuards, Request, Param, UseInterceptors, UploadedFile, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadService } from './upload.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';

@ApiTags('upload')
@Controller('upload')
export class UploadController {
    constructor(private readonly uploadService: UploadService) { }

    // ═══════════════════════════════════════════════════════════════
    // AVATAR - Direct file upload
    // ═══════════════════════════════════════════════════════════════
    @Post('avatar')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @UseInterceptors(FileInterceptor('file'))
    @ApiConsumes('multipart/form-data')
    @ApiOperation({ summary: 'Upload avatar image' })
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                file: { type: 'string', format: 'binary' },
            },
        },
    })
    @ApiResponse({ status: 200, description: 'Returns public URL of uploaded avatar' })
    async uploadAvatar(
        @Request() req,
        @UploadedFile() file: Express.Multer.File
    ) {
        if (!file) {
            throw new BadRequestException('No file provided');
        }
        return this.uploadService.uploadAvatar(req.user.id, file);
    }

    // ═══════════════════════════════════════════════════════════════
    // CONTENT THUMBNAIL
    // ═══════════════════════════════════════════════════════════════
    @Post('content/:contentId/thumbnail')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @UseInterceptors(FileInterceptor('file'))
    @ApiConsumes('multipart/form-data')
    @ApiOperation({ summary: 'Upload content thumbnail' })
    @ApiResponse({ status: 200, description: 'Returns public URL of uploaded thumbnail' })
    async uploadContentThumbnail(
        @Param('contentId') contentId: string,
        @UploadedFile() file: Express.Multer.File
    ) {
        if (!file) {
            throw new BadRequestException('No file provided');
        }
        return this.uploadService.uploadContentThumbnail(contentId, file);
    }

    // ═══════════════════════════════════════════════════════════════
    // CONTENT VIDEO
    // ═══════════════════════════════════════════════════════════════
    @Post('content/:contentId/video')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @UseInterceptors(FileInterceptor('file'))
    @ApiConsumes('multipart/form-data')
    @ApiOperation({ summary: 'Upload content video' })
    @ApiResponse({ status: 200, description: 'Returns public URL of uploaded video' })
    async uploadContentVideo(
        @Param('contentId') contentId: string,
        @UploadedFile() file: Express.Multer.File
    ) {
        if (!file) {
            throw new BadRequestException('No file provided');
        }
        return this.uploadService.uploadContentVideo(contentId, file);
    }

    // ═══════════════════════════════════════════════════════════════
    // CONTENT FILE (attachments)
    // ═══════════════════════════════════════════════════════════════
    @Post('content/:contentId/file')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @UseInterceptors(FileInterceptor('file'))
    @ApiConsumes('multipart/form-data')
    @ApiOperation({ summary: 'Upload content attachment file' })
    @ApiResponse({ status: 200, description: 'Returns public URL of uploaded file' })
    async uploadContentFile(
        @Param('contentId') contentId: string,
        @UploadedFile() file: Express.Multer.File
    ) {
        if (!file) {
            throw new BadRequestException('No file provided');
        }
        return this.uploadService.uploadContentFile(contentId, file);
    }

    // ═══════════════════════════════════════════════════════════════
    // CV/RESUME
    // ═══════════════════════════════════════════════════════════════
    @Post('cv')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @UseInterceptors(FileInterceptor('file'))
    @ApiConsumes('multipart/form-data')
    @ApiOperation({ summary: 'Upload CV/Resume PDF' })
    @ApiResponse({ status: 200, description: 'Returns public URL of uploaded CV' })
    async uploadCV(
        @Request() req,
        @UploadedFile() file: Express.Multer.File
    ) {
        if (!file) {
            throw new BadRequestException('No file provided');
        }
        return this.uploadService.uploadCV(req.user.id, file);
    }

    // ═══════════════════════════════════════════════════════════════
    // DELETE FILE
    // ═══════════════════════════════════════════════════════════════
    @Delete()
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Delete a file from R2' })
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                key: { type: 'string', example: 'avatars/user-123/avatar.jpg' },
            },
            required: ['key'],
        },
    })
    @ApiResponse({ status: 200, description: 'File deleted successfully' })
    async deleteFile(@Body() body: { key: string }) {
        return this.uploadService.deleteFile(body.key);
    }
}
