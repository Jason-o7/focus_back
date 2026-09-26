import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from '../users/users.module';
import { StudySession } from './entities/study-session.entity';
import { StudySessionsController } from './study-sessions.controller';
import { StudySessionsService } from './study-sessions.service';

@Module({
  imports: [UsersModule, TypeOrmModule.forFeature([StudySession])],
  providers: [StudySessionsService],
  controllers: [StudySessionsController],
})
export class StudySessionsModule {}
