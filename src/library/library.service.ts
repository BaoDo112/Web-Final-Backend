import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateContentDto } from './dto/create-content.dto';
import { ContentType, ContentStatus } from '@prisma/client';

@Injectable()
export class LibraryService {
    constructor(private prisma: PrismaService) { }

    async create(userId: string, createContentDto: CreateContentDto) {
        try {
            console.log('Creating content with userId:', userId);
            console.log('Content data:', JSON.stringify(createContentDto, null, 2));

            return await this.prisma.content.create({
                data: {
                    ...createContentDto,
                    authorId: userId,
                },
            });
        } catch (error) {
            console.error('Error creating content:', error);
            throw new BadRequestException(`Failed to create content: ${error.message}`);
        }
    }

    async findAll(type?: ContentType, status?: ContentStatus) {
        return this.prisma.content.findMany({
            where: {
                type: type || undefined,
                status: status || ContentStatus.PUBLISHED,
                deletedAt: null,
            },
            orderBy: { createdAt: 'desc' },
            include: {
                author: {
                    select: { id: true, name: true, avatar: true },
                },
            },
        });
    }

    async findOne(id: string) {
        const content = await this.prisma.content.findUnique({
            where: { id, deletedAt: null },
            include: {
                author: {
                    select: { id: true, name: true, avatar: true },
                },
                reviews: {
                    include: {
                        author: {
                            select: { id: true, name: true, avatar: true },
                        },
                    },
                    orderBy: { createdAt: 'desc' },
                    take: 10,
                },
            },
        });

        if (!content) {
            throw new NotFoundException('Content not found');
        }

        // Increment view count
        await this.prisma.content.update({
            where: { id },
            data: { viewCount: { increment: 1 } },
        });

        return content;
    }

    async findBySlug(slug: string) {
        const content = await this.prisma.content.findUnique({
            where: { slug, deletedAt: null },
            include: {
                author: {
                    select: { id: true, name: true, avatar: true },
                },
            },
        });

        if (!content) {
            throw new NotFoundException('Content not found');
        }

        return content;
    }

    async update(id: string, userId: string, updateData: Partial<CreateContentDto>) {
        const content = await this.prisma.content.findUnique({
            where: { id },
        });

        if (!content || content.authorId !== userId) {
            throw new NotFoundException('Content not found or not authorized');
        }

        return this.prisma.content.update({
            where: { id },
            data: updateData,
        });
    }

    async delete(id: string, userId: string) {
        const content = await this.prisma.content.findUnique({
            where: { id },
        });

        if (!content || content.authorId !== userId) {
            throw new NotFoundException('Content not found or not authorized');
        }

        // Soft delete
        return this.prisma.content.update({
            where: { id },
            data: { deletedAt: new Date() },
        });
    }

    async publish(id: string, userId: string) {
        const content = await this.prisma.content.findUnique({
            where: { id },
        });

        if (!content || content.authorId !== userId) {
            throw new NotFoundException('Content not found or not authorized');
        }

        return this.prisma.content.update({
            where: { id },
            data: {
                status: ContentStatus.PUBLISHED,
                publishedAt: new Date(),
            },
        });
    }
}
