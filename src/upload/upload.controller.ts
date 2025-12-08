import { Controller, Post, Delete, Body, UseGuards, Request, Param } from '@nestjs/common';
import { UploadService } from './upload.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiBody } from '@nestjs/swagger';

@ApiTags('upload')
@Controller('upload')
export class UploadController {
    constructor(private readonly uploadService: UploadService) { }

    // ═══════════════════════════════════════════════════════════════
    // AVATAR
    // ═══════════════════════════════════════════════════════════════
    @Post('avatar')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get presigned URL for avatar upload' })
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                fileType: { type: 'string', example: 'image/jpeg' },
            },
            required: ['fileType'],
        },
    })
    @ApiResponse({ status: 200, description: 'Returns presigned upload URL' })
    async getAvatarPresignedUrl(
        @Request() req,
        @Body() body: { fileType: string }
    ) {
        return this.uploadService.getAvatarPresignedUrl(req.user.id, body.fileType);
    }

    // ═══════════════════════════════════════════════════════════════
    // CONTENT THUMBNAIL
    // ═══════════════════════════════════════════════════════════════
    @Post('content/:contentId/thumbnail')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get presigned URL for content thumbnail' })
    @ApiResponse({ status: 200, description: 'Returns presigned upload URL' })
    async getContentThumbnailPresignedUrl(
        @Param('contentId') contentId: string,
        @Body() body: { fileType: string }
    ) {
        return this.uploadService.getContentThumbnailPresignedUrl(contentId, body.fileType);
    }

    // ═══════════════════════════════════════════════════════════════
    // CONTENT VIDEO
    // ═══════════════════════════════════════════════════════════════
    @Post('content/:contentId/video')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get presigned URL for content video' })
    @ApiResponse({ status: 200, description: 'Returns presigned upload URL' })
    async getContentVideoPresignedUrl(
        @Param('contentId') contentId: string,
        @Body() body: { fileType: string }
    ) {
        return this.uploadService.getContentVideoPresignedUrl(contentId, body.fileType);
    }

    // ═══════════════════════════════════════════════════════════════
    // CONTENT FILE
    // ═══════════════════════════════════════════════════════════════
    @Post('content/:contentId/file')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get presigned URL for content file attachment' })
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                fileName: { type: 'string', example: 'document.pdf' },
                fileType: { type: 'string', example: 'application/pdf' },
            },
            required: ['fileName', 'fileType'],
        },
    })
    @ApiResponse({ status: 200, description: 'Returns presigned upload URL' })
    async getContentFilePresignedUrl(
        @Param('contentId') contentId: string,
        @Body() body: { fileName: string; fileType: string }
    ) {
        return this.uploadService.getContentFilePresignedUrl(contentId, body.fileName, body.fileType);
    }

    // ═══════════════════════════════════════════════════════════════
    // CV
    // ═══════════════════════════════════════════════════════════════
    @Post('cv')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get presigned URL for CV/Resume upload' })
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                fileType: { type: 'string', example: 'application/pdf' },
            },
            required: ['fileType'],
        },
    })
    @ApiResponse({ status: 200, description: 'Returns presigned upload URL' })
    async getCvPresignedUrl(
        @Request() req,
        @Body() body: { fileType: string }
    ) {
        return this.uploadService.getCvPresignedUrl(req.user.id, body.fileType);
    }

    // ═══════════════════════════════════════════════════════════════
    // GENERIC PRESIGN (legacy)
    // ═══════════════════════════════════════════════════════════════
    @Post('presign')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get generic presigned upload URL' })
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                fileName: { type: 'string', example: 'file.pdf' },
                fileType: { type: 'string', example: 'application/pdf' },
            },
            required: ['fileName', 'fileType'],
        },
    })
    async getPresignedUrl(@Body() body: { fileName: string; fileType: string }) {
        return this.uploadService.getPresignedUrl(body.fileName, body.fileType);
    }

    // ═══════════════════════════════════════════════════════════════
    // DELETE FILE
    // ═══════════════════════════════════════════════════════════════
    @Delete()
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Delete a file from storage' })
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                key: { type: 'string', example: 'avatars/user-id/avatar.jpg' },
            },
            required: ['key'],
        },
    })
    async deleteFile(@Body() body: { key: string }) {
        return this.uploadService.deleteFile(body.key);
    }
}
