import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { LibraryService } from './library.service';
import { CreateContentDto } from './dto/create-content.dto';
import { ContentType, ContentStatus } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';

@ApiTags('library')
@Controller('library')
export class LibraryController {
    constructor(private readonly libraryService: LibraryService) { }

    @Post()
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Create new content' })
    async create(@Request() req, @Body() createContentDto: CreateContentDto) {
        return this.libraryService.create(req.user.id, createContentDto);
    }

    @Get()
    @ApiOperation({ summary: 'Get all published content' })
    @ApiQuery({ name: 'type', required: false, enum: ContentType })
    @ApiQuery({ name: 'status', required: false, enum: ContentStatus })
    async findAll(
        @Query('type') type?: ContentType,
        @Query('status') status?: ContentStatus,
    ) {
        return this.libraryService.findAll(type, status);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get content by ID' })
    async findOne(@Param('id') id: string) {
        return this.libraryService.findOne(id);
    }

    @Get('slug/:slug')
    @ApiOperation({ summary: 'Get content by slug' })
    async findBySlug(@Param('slug') slug: string) {
        return this.libraryService.findBySlug(slug);
    }

    @Put(':id')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Update content' })
    async update(
        @Request() req,
        @Param('id') id: string,
        @Body() updateData: Partial<CreateContentDto>,
    ) {
        return this.libraryService.update(id, req.user.id, updateData);
    }

    @Delete(':id')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Soft delete content' })
    async delete(@Request() req, @Param('id') id: string) {
        return this.libraryService.delete(id, req.user.id);
    }

    @Post(':id/publish')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Publish content' })
    async publish(@Request() req, @Param('id') id: string) {
        return this.libraryService.publish(id, req.user.id);
    }
}
