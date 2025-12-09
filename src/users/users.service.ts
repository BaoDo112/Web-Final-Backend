import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { User, Role } from '@prisma/client';

@Injectable()
export class UsersService {
    constructor(private prisma: PrismaService) { }

    async create(createUserDto: CreateUserDto): Promise<User> {
        return this.prisma.user.create({
            data: createUserDto,
        });
    }

    async findOne(email: string): Promise<User | null> {
        return this.prisma.user.findUnique({
            where: { email },
        });
    }

    async findById(id: string): Promise<User | null> {
        return this.prisma.user.findUnique({
            where: { id },
        });
    }

    // ═══════════════════════════════════════════════════════════════
    // INTERVIEWER LISTING
    // ═══════════════════════════════════════════════════════════════
    async getInterviewers(options: {
        page?: number;
        limit?: number;
        skill?: string;
        minRating?: number;
        sortBy?: 'rating' | 'sessions' | 'price';
    }) {
        const { page = 1, limit = 10, skill, minRating, sortBy = 'rating' } = options;
        const skip = (page - 1) * limit;

        const where: any = {
            role: Role.INTERVIEWER,
            isActive: true,
            deletedAt: null,
            interviewerProfile: {
                isNot: null, // Show any interviewer with profile (for testing)
            },
        };

        // Filter by skill
        if (skill) {
            where.interviewerProfile.skills = { has: skill };
        }

        // Filter by minimum rating
        if (minRating) {
            where.interviewerProfile.rating = { gte: minRating };
        }

        // Determine sort order
        let orderBy: any = {};
        switch (sortBy) {
            case 'sessions':
                orderBy = { interviewerProfile: { totalSessions: 'desc' } };
                break;
            case 'price':
                orderBy = { interviewerProfile: { hourlyRate: 'asc' } };
                break;
            default:
                orderBy = { interviewerProfile: { rating: 'desc' } };
        }

        const [interviewers, total] = await Promise.all([
            this.prisma.user.findMany({
                where,
                skip,
                take: limit,
                orderBy,
                select: {
                    id: true,
                    name: true,
                    avatar: true,
                    interviewerProfile: {
                        select: {
                            title: true,
                            company: true,
                            bio: true,
                            skills: true,
                            experience: true,
                            hourlyRate: true,
                            rating: true,
                            totalReviews: true,
                            totalSessions: true,
                        },
                    },
                },
            }),
            this.prisma.user.count({ where }),
        ]);

        return {
            data: interviewers,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    // ═══════════════════════════════════════════════════════════════
    // GET INTERVIEWER PROFILE
    // ═══════════════════════════════════════════════════════════════
    async getInterviewerProfile(id: string) {
        const user = await this.prisma.user.findUnique({
            where: { id, role: Role.INTERVIEWER, isActive: true, deletedAt: null },
            select: {
                id: true,
                name: true,
                avatar: true,
                bio: true,
                interviewerProfile: {
                    select: {
                        title: true,
                        company: true,
                        bio: true,
                        skills: true,
                        experience: true,
                        hourlyRate: true,
                        cvUrl: true,
                        linkedinUrl: true,
                        availability: true,
                        timezone: true,
                        rating: true,
                        totalReviews: true,
                        totalSessions: true,
                        isApproved: true,
                    },
                },
                reviewsReceived: {
                    take: 5,
                    orderBy: { createdAt: 'desc' },
                    select: {
                        id: true,
                        rating: true,
                        comment: true,
                        createdAt: true,
                        author: {
                            select: { id: true, name: true, avatar: true },
                        },
                    },
                },
            },
        });

        if (!user) {
            throw new NotFoundException('Interviewer not found');
        }

        return user;
    }

    // ═══════════════════════════════════════════════════════════════
    // UPDATE INTERVIEWER PROFILE
    // ═══════════════════════════════════════════════════════════════
    async updateInterviewerProfile(userId: string, updateData: {
        title?: string;
        company?: string;
        bio?: string;
        skills?: string[];
        experience?: number;
        hourlyRate?: number;
        cvUrl?: string;
        linkedinUrl?: string;
        availability?: any;
    }) {
        return this.prisma.interviewerProfile.upsert({
            where: { userId },
            update: updateData,
            create: {
                userId,
                ...updateData,
            },
        });
    }
}
