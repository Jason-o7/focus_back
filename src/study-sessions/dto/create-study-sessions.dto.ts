import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsIn,
  IsInt,
  IsUUID,
  Matches,
  Min,
  ValidateNested,
} from 'class-validator';
import type { StudySessionMode } from '../entities/study-session.entity';

export class StudySessionDto {
  @IsUUID('4')
  id: string;

  @IsIn(['timer', 'stopwatch'])
  mode: StudySessionMode;

  @IsInt()
  @Min(0)
  startedAt: number;

  @IsInt()
  @Min(0)
  endedAt: number;

  @IsInt()
  @Min(0)
  focusedMs: number;

  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  day: string;
}

export class CreateStudySessionsDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayUnique((session: StudySessionDto | null) => session?.id)
  @ValidateNested({ each: true })
  @Type(() => StudySessionDto)
  sessions: StudySessionDto[];
}
