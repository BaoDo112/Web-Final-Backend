import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { BookingStatus } from '@prisma/client';

@Injectable()
export class ReminderSchedulerService {
    private readonly logger = new Logger(ReminderSchedulerService.name);
    private sentReminders = new Set<string>(); // Track sent reminders to avoid duplicates

    constructor(
        private prisma: PrismaService,
        private mailService: MailService,
    ) { }

    /**
     * Runs every 10 minutes to check for upcoming interviews
     * Sends reminder emails 1 hour before the scheduled time
     */
    @Cron(CronExpression.EVERY_10_MINUTES)
    async sendInterviewReminders() {
        this.logger.log('📧 Checking for upcoming interviews to send reminders...');

        const now = new Date();
        const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);
        const fiftyMinutesFromNow = new Date(now.getTime() + 50 * 60 * 1000);

        // Find bookings starting in ~1 hour (between 50-70 minutes from now)
        const upcomingBookings = await this.prisma.booking.findMany({
            where: {
                status: BookingStatus.CONFIRMED,
                startTime: {
                    gte: fiftyMinutesFromNow,
                    lte: oneHourFromNow,
                },
            },
            include: {
                user: { select: { email: true, name: true } },
                mentor: { select: { email: true, name: true } },
            },
        });

        this.logger.log(`Found ${upcomingBookings.length} bookings needing reminders`);

        for (const booking of upcomingBookings) {
            // Skip if already sent reminder for this booking
            if (this.sentReminders.has(booking.id)) {
                continue;
            }

            const time = booking.startTime.toLocaleTimeString('vi-VN', {
                hour: '2-digit',
                minute: '2-digit',
            });

            // Send reminder to interviewee (user)
            if (booking.user.email) {
                try {
                    await this.mailService.sendInterviewReminderEmail(
                        booking.user.email,
                        booking.user.name || 'User',
                        booking.mentor.name || 'Mentor',
                        time,
                        booking.meetingLink || undefined,
                        false // isInterviewer = false
                    );
                    this.logger.log(`✅ Sent reminder to interviewee: ${booking.user.email}`);
                } catch (err) {
                    this.logger.error(`❌ Failed to send reminder to ${booking.user.email}:`, err);
                }
            }

            // Send reminder to interviewer (mentor)
            if (booking.mentor.email) {
                try {
                    await this.mailService.sendInterviewReminderEmail(
                        booking.mentor.email,
                        booking.mentor.name || 'Mentor',
                        booking.user.name || 'User',
                        time,
                        booking.meetingLink || undefined,
                        true // isInterviewer = true
                    );
                    this.logger.log(`✅ Sent reminder to interviewer: ${booking.mentor.email}`);
                } catch (err) {
                    this.logger.error(`❌ Failed to send reminder to ${booking.mentor.email}:`, err);
                }
            }

            // Mark as sent
            this.sentReminders.add(booking.id);
        }

        // Clean up old reminder records (older than 2 hours)
        const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);
        const oldBookings = await this.prisma.booking.findMany({
            where: {
                startTime: { lt: twoHoursAgo },
            },
            select: { id: true },
        });

        for (const booking of oldBookings) {
            this.sentReminders.delete(booking.id);
        }
    }

    /**
     * Runs daily at midnight to expire old pending bookings
     */
    @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
    async expirePendingBookings() {
        this.logger.log('🗑️ Checking for expired pending bookings...');

        const now = new Date();

        // Expire bookings that are still PENDING but start time has passed
        const result = await this.prisma.booking.updateMany({
            where: {
                status: BookingStatus.PENDING,
                startTime: { lt: now },
            },
            data: {
                status: BookingStatus.EXPIRED,
            },
        });

        this.logger.log(`Expired ${result.count} pending bookings`);
    }
}
