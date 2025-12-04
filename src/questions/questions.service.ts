import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateQuestionDto, GetQuestionsFilterDto } from './dto/create-question.dto';
import { Question } from '@prisma/client';

@Injectable()
export class QuestionsService {
    constructor(private prisma: PrismaService) { }

    async create(createQuestionDto: CreateQuestionDto): Promise<Question> {
        return this.prisma.question.create({
            data: createQuestionDto,
        });
    }

    async findAll(filter: GetQuestionsFilterDto): Promise<Question[]> {
        const { difficulty, category } = filter;
        return this.prisma.question.findMany({
            where: {
                difficulty,
                category: category ? { contains: category, mode: 'insensitive' } : undefined,
            },
        });
    }

    async findRandom(count: number, difficulty?: string): Promise<Question[]> {
        // Note: Prisma doesn't support random natively efficiently for large datasets, 
        // but for this scale, raw query or fetching all IDs and picking random is fine.
        // Using raw query for better performance with PostgreSQL RANDOM()

        // Type casting for raw query might be needed or just use findMany with skip if DB agnostic
        // For simplicity and safety let's fetch a pool and pick random for now.

        const where = difficulty ? { difficulty: difficulty as any } : {};
        const total = await this.prisma.question.count({ where });

        if (total <= count) {
            return this.prisma.question.findMany({ where });
        }

        // Fetch all IDs (lightweight)
        const questions = await this.prisma.question.findMany({
            where,
            select: { id: true },
        });

        // Shuffle and pick
        const shuffled = questions.sort(() => 0.5 - Math.random());
        const selectedIds = shuffled.slice(0, count).map(q => q.id);

        return this.prisma.question.findMany({
            where: { id: { in: selectedIds } },
        });
    }
}
