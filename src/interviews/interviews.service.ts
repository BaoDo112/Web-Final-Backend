import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StartInterviewDto } from './dto/start-interview.dto';
import { SubmitResponseDto } from './dto/submit-response.dto';
import { SessionStatus } from '@prisma/client';

@Injectable()
export class InterviewsService {
    constructor(private prisma: PrismaService) { }

    async startSession(startInterviewDto: StartInterviewDto) {
        return this.prisma.interviewSession.create({
            data: {
                userId: startInterviewDto.userId,
                type: startInterviewDto.type,
                status: SessionStatus.STARTED,
            },
            include: {
                responses: true,
            },
        });
    }

    async submitResponse(sessionId: string, submitResponseDto: SubmitResponseDto) {
        const session = await this.prisma.interviewSession.findUnique({
            where: { id: sessionId },
        });

        if (!session) {
            throw new NotFoundException('Session not found');
        }

        return this.prisma.interviewResponse.create({
            data: {
                sessionId,
                ...submitResponseDto,
            },
        });
    }

    async getSession(id: string) {
        return this.prisma.interviewSession.findUnique({
            where: { id },
            include: {
                responses: {
                    include: {
                        question: true,
                        feedback: true,
                    },
                },
            },
        });
    }

    async getUserHistory(userId: string) {
        return this.prisma.interviewSession.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            include: {
                _count: {
                    select: { responses: true },
                },
            },
        });
    }
}
