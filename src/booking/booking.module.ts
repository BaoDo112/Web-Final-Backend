import { Module } from '@nestjs/common';
import { BookingService } from './booking.service';
import { BookingController } from './booking.controller';
import { ReminderSchedulerService } from './reminder-scheduler.service';
import { PrismaModule } from '../prisma/prisma.module';
import { MailModule } from '../mail/mail.module';

@Module({
    imports: [PrismaModule, MailModule],
    controllers: [BookingController],
    providers: [BookingService, ReminderSchedulerService],
    exports: [BookingService],
})
export class BookingModule { }
