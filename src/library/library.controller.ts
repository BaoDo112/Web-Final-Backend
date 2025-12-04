import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { LibraryService } from './library.service';
import { CreatePostDto } from './dto/create-post.dto';
import { PostType } from '@prisma/client';

@Controller('library')
export class LibraryController {
    constructor(private readonly libraryService: LibraryService) { }

    @Post()
    async create(@Body() createPostDto: CreatePostDto) {
        // TODO: Get userId from JWT
        const mockUserId = 'admin-id';
        return this.libraryService.create(mockUserId, createPostDto);
    }

    @Get()
    async findAll(@Query('type') type?: PostType) {
        return this.libraryService.findAll(type);
    }

    @Get(':id')
    async findOne(@Param('id') id: string) {
        return this.libraryService.findOne(id);
    }
}
