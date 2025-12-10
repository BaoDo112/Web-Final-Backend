import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BookingStatus, Role } from '@prisma/client';
import { MailService } from '../mail/mail.service';

interface CreateBookingDto {
    mentorId: string;
    startTime: string;
    endTime: string;
    duration?: number;
    note?: string;
}

interface UpdateBookingDto {
    status?: BookingStatus;
    meetingLink?: string;
    note?: string;
    cancelReason?: string;
}

@Injectable()
export class BookingService {
    constructor(
        private prisma: PrismaService,
        private mailService: MailService,
    ) { }

    // ═══════════════════════════════════════════════════════════════
    // CREATE BOOKING
    // ═══════════════════════════════════════════════════════════════
    async create(userId: string, createBookingDto: CreateBookingDto) {
        const { mentorId, startTime, endTime, duration = 60, note } = createBookingDto;

        // Validate mentor exists and is approved
        const mentor = await this.prisma.user.findUnique({
            where: { id: mentorId },
            include: { interviewerProfile: true },
        });

        if (!mentor || mentor.role !== Role.INTERVIEWER) {
            throw new NotFoundException('Mentor not found');
        }

        // Check for conflicting bookings
        const conflicting = await this.prisma.booking.findFirst({
            where: {
                mentorId,
                status: { in: [BookingStatus.PENDING, BookingStatus.CONFIRMED] },
                startTime: new Date(startTime),
            },
        });

        if (conflicting) {
            throw new BadRequestException('Time slot already booked');
        }

        const booking = await this.prisma.booking.create({
            data: {
                userId,
                mentorId,
                startTime: new Date(startTime),
                endTime: new Date(endTime),
                duration,
                note,
                status: BookingStatus.PENDING,
            },
            include: {
                user: { select: { id: true, name: true, email: true } },
                mentor: { select: { id: true, name: true, email: true } },
            },
        });

        // TODO: Send notification to mentor

        return booking;
    }

    // ═══════════════════════════════════════════════════════════════
    // GET USER'S BOOKINGS
    // ═══════════════════════════════════════════════════════════════
    async getMyBookings(userId: string, role: Role, status?: BookingStatus) {
        const where = role === Role.INTERVIEWER
            ? { mentorId: userId, deletedAt: null }
            : { userId, deletedAt: null };

        if (status) {
            where['status'] = status;
        }

        return this.prisma.booking.findMany({
            where,
            orderBy: { startTime: 'desc' },
            include: {
                user: { select: { id: true, name: true, email: true, avatar: true } },
                mentor: {
                    select: {
                        id: true, name: true, email: true, avatar: true,
                        interviewerProfile: { select: { title: true, company: true } },
                    },
                },
            },
        });
    }

    // ═══════════════════════════════════════════════════════════════
    // GET BOOKING BY ID
    // ═══════════════════════════════════════════════════════════════
    async findOne(id: string, userId: string) {
        const booking = await this.prisma.booking.findUnique({
            where: { id, deletedAt: null },
            include: {
                user: { select: { id: true, name: true, email: true, avatar: true } },
                mentor: {
                    select: {
                        id: true, name: true, email: true, avatar: true,
                        interviewerProfile: { select: { title: true, company: true } },
                    },
                },
                messages: {
                    orderBy: { createdAt: 'asc' },
                    include: {
                        sender: { select: { id: true, name: true, avatar: true } },
                    },
                },
                review: true,
            },
        });

        if (!booking) {
            throw new NotFoundException('Booking not found');
        }

        // Only participants can view
        if (booking.userId !== userId && booking.mentorId !== userId) {
            throw new ForbiddenException('Not authorized to view this booking');
        }

        return booking;
    }

    // ═══════════════════════════════════════════════════════════════
    // CONFIRM BOOKING (Mentor only)
    // ═══════════════════════════════════════════════════════════════
    async confirm(id: string, mentorId: string, meetingLink?: string) {
        console.log(`[BookingService] Confirming booking ${id} for mentor ${mentorId}`);
        try {
            const booking = await this.prisma.booking.findUnique({
                where: { id },
                include: {
                    user: { select: { email: true, name: true } },
                    mentor: { select: { name: true } },
                },
            });

            if (!booking) {
                console.error(`[BookingService] Booking ${id} not found`);
                throw new NotFoundException('Booking not found');
            }
            if (booking.mentorId !== mentorId) {
                console.error(`[BookingService] Unauthorized access to booking ${id} by mentor ${mentorId}`);
                throw new NotFoundException('Not authorized');
            }

            if (booking.status !== BookingStatus.PENDING) {
                console.error(`[BookingService] Booking ${id} is not PENDING (status: ${booking.status})`);
                throw new BadRequestException('Booking is not in pending status');
            }

            console.log(`[BookingService] Generating meeting link...`);
            // Auto-generate meeting link if not provided (unique room per booking)
            const frontendUrl = process.env.FRONTEND_URL || 'https://nervis.dev';
            const generatedLink = meetingLink || `${frontendUrl}/training1v1/call?room=booking-${id}`;

            console.log(`[BookingService] Updating booking status...`);
            const updated = await this.prisma.booking.update({
                where: { id },
                data: {
                    status: BookingStatus.CONFIRMED,
                    meetingLink: generatedLink,
                },
            });

            // Send confirmation email
            if (booking.user.email) {
                console.log(`[BookingService] Sending confirmation email to ${booking.user.email}...`);
                const date = booking.startTime.toLocaleDateString('vi-VN');
                const time = booking.startTime.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });

                // Don't await email to prevent blocking, but catch errors properly
                this.mailService.sendBookingConfirmedEmail(
                    booking.user.email,
                    booking.user.name || 'User',
                    booking.mentor.name || 'Mentor',
                    date,
                    time,
                    meetingLink
                ).then(success => {
                    if (success) console.log(`[BookingService] Email sent successfully`);
                    else console.error(`[BookingService] Email sending failed (returned false)`);
                }).catch(err => {
                    console.error('[BookingService] Failed to send confirmation email (async catch):', err);
                });
            } else {
                console.warn(`[BookingService] User has no email, skipping notification`);
            }

            console.log(`[BookingService] Booking confirmed successfully`);
            return updated;
        } catch (error) {
            console.error('[BookingService] Error in confirm method:', error);
            // Re-throw appropriate exceptions
            if (error instanceof NotFoundException || error instanceof BadRequestException) {
                throw error;
            }
            throw new Error(`Internal Server Error in Booking Confirmation: ${error.message}`);
        }
    }

    // ═══════════════════════════════════════════════════════════════
    // CANCEL BOOKING
    // ═══════════════════════════════════════════════════════════════
    async cancel(id: string, userId: string, cancelReason?: string) {
        const booking = await this.prisma.booking.findUnique({
            where: { id },
        });

        if (!booking) {
            throw new NotFoundException('Booking not found');
        }

        if (booking.userId !== userId && booking.mentorId !== userId) {
            throw new ForbiddenException('Not authorized to cancel this booking');
        }

        if (booking.status === BookingStatus.COMPLETED || booking.status === BookingStatus.CANCELLED) {
            throw new BadRequestException('Cannot cancel this booking');
        }

        return this.prisma.booking.update({
            where: { id },
            data: {
                status: BookingStatus.CANCELLED,
                cancelledAt: new Date(),
                cancelledBy: userId,
                cancelReason,
            },
        });
    }

    // ═══════════════════════════════════════════════════════════════
    // COMPLETE BOOKING (after session ends)
    // ═══════════════════════════════════════════════════════════════
    async complete(id: string, mentorId: string) {
        const booking = await this.prisma.booking.findUnique({
            where: { id },
        });

        if (!booking || booking.mentorId !== mentorId) {
            throw new NotFoundException('Booking not found or not authorized');
        }

        if (booking.status !== BookingStatus.CONFIRMED) {
            throw new BadRequestException('Booking must be confirmed first');
        }

        return this.prisma.booking.update({
            where: { id },
            data: { status: BookingStatus.COMPLETED },
        });
    }

    // ═══════════════════════════════════════════════════════════════
    // GET UPCOMING BOOKINGS (for reminders)
    // ═══════════════════════════════════════════════════════════════
    async getUpcoming(hoursAhead: number = 1) {
        const now = new Date();
        const threshold = new Date(now.getTime() + hoursAhead * 60 * 60 * 1000);

        return this.prisma.booking.findMany({
            where: {
                status: BookingStatus.CONFIRMED,
                startTime: {
                    gte: now,
                    lte: threshold,
                },
            },
            include: {
                user: { select: { email: true, name: true } },
                mentor: { select: { email: true, name: true } },
            },
        });
    }
}
