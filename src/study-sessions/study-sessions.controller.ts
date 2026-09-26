import { Body, Controller, Get, Post } from '@nestjs/common';
import { CurrentUserId } from '../auth/current-user-id.decorator';
import { CreateStudySessionsDto } from './dto/create-study-sessions.dto';
import {
  StudySessionListResponse,
  StudySessionsService,
} from './study-sessions.service';

@Controller('study-sessions')
export class StudySessionsController {
  constructor(private readonly studySessionsService: StudySessionsService) {}

  @Get()
  findAll(@CurrentUserId() userId: string): Promise<StudySessionListResponse> {
    return this.studySessionsService.findAll(userId);
  }

  @Post()
  create(
    @CurrentUserId() userId: string,
    @Body() dto: CreateStudySessionsDto,
  ): Promise<StudySessionListResponse> {
    return this.studySessionsService.create(userId, dto.sessions);
  }
}
