import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePostDto } from './dto/create-post.dto';
import { PostType } from '@prisma/client';

@Injectable()
export class LibraryService {
    constructor(private prisma: PrismaService) { }

    async create(userId: string, createPostDto: CreatePostDto) {
        return this.prisma.post.create({
            data: {
                ...createPostDto,
                authorId: userId,
            },
        });
    }

    async findAll(type?: PostType) {
        return this.prisma.post.findMany({
            where: type ? { type } : undefined,
            orderBy: { createdAt: 'desc' },
            include: {
                author: {
                    select: { id: true, name: true, avatar: true },
                },
            },
        });
    }

    async findOne(id: string) {
        return this.prisma.post.findUnique({
            where: { id },
            include: {
                author: {
                    select: { id: true, name: true, avatar: true },
                },
            },
        });
    }
}
