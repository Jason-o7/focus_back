import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StudySession } from './entities/study-session.entity';
import { StudySessionsController } from './study-sessions.controller';
import { StudySessionsService } from './study-sessions.service';

@Module({
  imports: [TypeOrmModule.forFeature([StudySession])],
  providers: [StudySessionsService],
  controllers: [StudySessionsController],
})
export class StudySessionsModule {}
