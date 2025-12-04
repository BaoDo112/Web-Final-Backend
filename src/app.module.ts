import { Module } from '@nestjs/common';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';

import { QuestionsModule } from './questions/questions.module';
import { InterviewsModule } from './interviews/interviews.module';

@Module({
  imports: [PrismaModule, UsersModule, AuthModule, QuestionsModule, InterviewsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
