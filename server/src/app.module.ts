import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { OrganizationsModule } from './organizations/organizations.module';
import { BillingModule } from './billing/billing.module';
import { ProjectsModule } from './projects/projects.module';
import { TasksModule } from './tasks/tasks.module';
import { NotificationsModule } from './notifications/notifications.module';
import { EmailPasswordModule } from './auth/email-password/email-password.module';
import { GoogleModule } from './auth/google/google.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [
    UsersModule,
    OrganizationsModule,
    BillingModule,
    ProjectsModule,
    TasksModule,
    NotificationsModule,
    EmailPasswordModule,
    GoogleModule,
    PrismaModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
