import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { CompaniesModule } from './modules/companies/companies.module';
import { InvitesModule } from './modules/invites/invites.module';
import { WorkTimeModule } from './modules/work-time/work-time.module';
import { LeavesModule } from './modules/leaves/leaves.module';
import { CalendarModule } from './modules/calendar/calendar.module';
import { HolidaysModule } from './modules/holidays/holidays.module';
import { RealtimeModule } from './modules/realtime/realtime.module';
import { TasksModule } from './modules/tasks/tasks.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '../../.env'],
    }),
    PrismaModule,
    AuthModule,
    UsersModule,
    CompaniesModule,
    InvitesModule,
    WorkTimeModule,
    LeavesModule,
    CalendarModule,
    HolidaysModule,
    RealtimeModule,
    TasksModule,
  ],
})
export class AppModule {}
