import { Body, Controller, Post } from '@nestjs/common';
import { CurrentUserId } from '../auth/current-user-id.decorator';
import { CreateStudySessionsDto } from './dto/create-study-sessions.dto';
import {
  StudySessionResponse,
  StudySessionsService,
} from './study-sessions.service';

@Controller('study-sessions')
export class StudySessionsController {
  constructor(private readonly studySessionsService: StudySessionsService) {}

  @Post()
  create(
    @CurrentUserId() userId: string,
    @Body() dto: CreateStudySessionsDto,
  ): Promise<StudySessionResponse[]> {
    return this.studySessionsService.create(userId, dto.sessions);
  }
}
