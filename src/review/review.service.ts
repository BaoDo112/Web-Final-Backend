import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

interface CreateReviewDto {
    rating: number;
    comment?: string;
    bookingId?: string;
    contentId?: string;
    targetUserId?: string;
}

@Injectable()
export class ReviewService {
    constructor(private prisma: PrismaService) { }

    // ═══════════════════════════════════════════════════════════════
    // CREATE REVIEW
    // ═══════════════════════════════════════════════════════════════
    async create(authorId: string, createReviewDto: CreateReviewDto) {
        const { rating, comment, bookingId, contentId, targetUserId } = createReviewDto;

        // Validate rating
        if (rating < 1 || rating > 5) {
            throw new BadRequestException('Rating must be between 1 and 5');
        }

        // Must have exactly one target
        const targets = [bookingId, contentId, targetUserId].filter(Boolean);
        if (targets.length !== 1) {
            throw new BadRequestException('Must specify exactly one of: bookingId, contentId, or targetUserId');
        }

        // Check for existing review
        if (contentId) {
            const existing = await this.prisma.review.findUnique({
                where: { authorId_contentId: { authorId, contentId } },
            });
            if (existing) {
                throw new BadRequestException('You have already reviewed this content');
            }
        }

        if (targetUserId) {
            const existing = await this.prisma.review.findUnique({
                where: { authorId_targetUserId: { authorId, targetUserId } },
            });
            if (existing) {
                throw new BadRequestException('You have already reviewed this user');
            }
        }

        const review = await this.prisma.review.create({
            data: {
                rating,
                comment,
                authorId,
                bookingId,
                contentId,
                targetUserId,
            },
            include: {
                author: { select: { id: true, name: true, avatar: true } },
            },
        });

        // Update aggregate ratings
        if (contentId) {
            await this.updateContentRating(contentId);
        }
        if (targetUserId) {
            await this.updateUserRating(targetUserId);
        }

        return review;
    }

    // ═══════════════════════════════════════════════════════════════
    // GET REVIEWS
    // ═══════════════════════════════════════════════════════════════
    async getContentReviews(contentId: string, page = 1, limit = 10) {
        const skip = (page - 1) * limit;

        const [reviews, total] = await Promise.all([
            this.prisma.review.findMany({
                where: { contentId, isApproved: true },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
                include: {
                    author: { select: { id: true, name: true, avatar: true } },
                },
            }),
            this.prisma.review.count({ where: { contentId, isApproved: true } }),
        ]);

        return { reviews, total, page, limit };
    }

    async getUserReviews(targetUserId: string, page = 1, limit = 10) {
        const skip = (page - 1) * limit;

        const [reviews, total] = await Promise.all([
            this.prisma.review.findMany({
                where: { targetUserId, isApproved: true },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
                include: {
                    author: { select: { id: true, name: true, avatar: true } },
                },
            }),
            this.prisma.review.count({ where: { targetUserId, isApproved: true } }),
        ]);

        return { reviews, total, page, limit };
    }

    // ═══════════════════════════════════════════════════════════════
    // UPDATE REVIEW
    // ═══════════════════════════════════════════════════════════════
    async update(id: string, authorId: string, data: { rating?: number; comment?: string }) {
        const review = await this.prisma.review.findUnique({ where: { id } });

        if (!review || review.authorId !== authorId) {
            throw new NotFoundException('Review not found or not authorized');
        }

        if (data.rating && (data.rating < 1 || data.rating > 5)) {
            throw new BadRequestException('Rating must be between 1 and 5');
        }

        const updated = await this.prisma.review.update({
            where: { id },
            data,
        });

        // Update aggregate ratings
        if (review.contentId) {
            await this.updateContentRating(review.contentId);
        }
        if (review.targetUserId) {
            await this.updateUserRating(review.targetUserId);
        }

        return updated;
    }

    // ═══════════════════════════════════════════════════════════════
    // DELETE REVIEW
    // ═══════════════════════════════════════════════════════════════
    async delete(id: string, authorId: string) {
        const review = await this.prisma.review.findUnique({ where: { id } });

        if (!review || review.authorId !== authorId) {
            throw new NotFoundException('Review not found or not authorized');
        }

        await this.prisma.review.delete({ where: { id } });

        // Update aggregate ratings
        if (review.contentId) {
            await this.updateContentRating(review.contentId);
        }
        if (review.targetUserId) {
            await this.updateUserRating(review.targetUserId);
        }

        return { message: 'Review deleted successfully' };
    }

    // ═══════════════════════════════════════════════════════════════
    // HELPERS
    // ═══════════════════════════════════════════════════════════════
    private async updateContentRating(contentId: string) {
        const result = await this.prisma.review.aggregate({
            where: { contentId, isApproved: true },
            _avg: { rating: true },
            _count: true,
        });

        await this.prisma.content.update({
            where: { id: contentId },
            data: {
                rating: result._avg.rating || 0,
                reviewCount: result._count,
            },
        });
    }

    private async updateUserRating(targetUserId: string) {
        const result = await this.prisma.review.aggregate({
            where: { targetUserId, isApproved: true },
            _avg: { rating: true },
            _count: true,
        });

        await this.prisma.interviewerProfile.updateMany({
            where: { userId: targetUserId },
            data: {
                rating: result._avg.rating || 0,
                totalReviews: result._count,
            },
        });
    }
}
