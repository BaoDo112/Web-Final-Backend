import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationType } from '@prisma/client';

interface CreateNotificationDto {
    userId: string;
    type: NotificationType;
    title: string;
    message: string;
    data?: any;
}

@Injectable()
export class NotificationService {
    constructor(private prisma: PrismaService) { }

    // ═══════════════════════════════════════════════════════════════
    // CREATE NOTIFICATION
    // ═══════════════════════════════════════════════════════════════
    async create(createNotificationDto: CreateNotificationDto) {
        return this.prisma.notification.create({
            data: createNotificationDto,
        });
    }

    // ═══════════════════════════════════════════════════════════════
    // CREATE BULK NOTIFICATIONS
    // ═══════════════════════════════════════════════════════════════
    async createMany(notifications: CreateNotificationDto[]) {
        return this.prisma.notification.createMany({
            data: notifications,
        });
    }

    // ═══════════════════════════════════════════════════════════════
    // GET USER NOTIFICATIONS
    // ═══════════════════════════════════════════════════════════════
    async getMyNotifications(userId: string, page = 1, limit = 20) {
        const skip = (page - 1) * limit;

        const [notifications, total, unreadCount] = await Promise.all([
            this.prisma.notification.findMany({
                where: { userId },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
            }),
            this.prisma.notification.count({ where: { userId } }),
            this.prisma.notification.count({ where: { userId, isRead: false } }),
        ]);

        return { notifications, total, unreadCount, page, limit };
    }

    // ═══════════════════════════════════════════════════════════════
    // MARK AS READ
    // ═══════════════════════════════════════════════════════════════
    async markAsRead(id: string, userId: string) {
        return this.prisma.notification.updateMany({
            where: { id, userId },
            data: { isRead: true, readAt: new Date() },
        });
    }

    // ═══════════════════════════════════════════════════════════════
    // MARK ALL AS READ
    // ═══════════════════════════════════════════════════════════════
    async markAllAsRead(userId: string) {
        return this.prisma.notification.updateMany({
            where: { userId, isRead: false },
            data: { isRead: true, readAt: new Date() },
        });
    }

    // ═══════════════════════════════════════════════════════════════
    // DELETE NOTIFICATION
    // ═══════════════════════════════════════════════════════════════
    async delete(id: string, userId: string) {
        await this.prisma.notification.deleteMany({
            where: { id, userId },
        });
        return { message: 'Notification deleted' };
    }

    // ═══════════════════════════════════════════════════════════════
    // HELPER: Notification Templates
    // ═══════════════════════════════════════════════════════════════
    async notifyBookingRequest(mentorId: string, bookingData: any) {
        return this.create({
            userId: mentorId,
            type: NotificationType.BOOKING_REQUEST,
            title: 'Yêu cầu đặt lịch mới',
            message: `Bạn có yêu cầu đặt lịch mới từ ${bookingData.userName}`,
            data: bookingData,
        });
    }

    async notifyBookingConfirmed(userId: string, bookingData: any) {
        return this.create({
            userId,
            type: NotificationType.BOOKING_CONFIRMED,
            title: 'Lịch hẹn đã được xác nhận',
            message: `Mentor ${bookingData.mentorName} đã xác nhận lịch hẹn của bạn`,
            data: bookingData,
        });
    }

    async notifyBookingCancelled(userId: string, bookingData: any) {
        return this.create({
            userId,
            type: NotificationType.BOOKING_CANCELLED,
            title: 'Lịch hẹn đã bị hủy',
            message: `Lịch hẹn với ${bookingData.partnerName} đã bị hủy`,
            data: bookingData,
        });
    }

    async notifyBookingReminder(userId: string, bookingData: any) {
        return this.create({
            userId,
            type: NotificationType.BOOKING_REMINDER,
            title: 'Nhắc nhở: Buổi phỏng vấn sắp diễn ra',
            message: `Buổi phỏng vấn với ${bookingData.partnerName} sẽ bắt đầu sau 1 giờ`,
            data: bookingData,
        });
    }

    async notifyNewReview(userId: string, reviewData: any) {
        return this.create({
            userId,
            type: NotificationType.NEW_REVIEW,
            title: 'Bạn có đánh giá mới',
            message: `${reviewData.authorName} đã đánh giá bạn ${reviewData.rating}⭐`,
            data: reviewData,
        });
    }
}
