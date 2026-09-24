import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StudySessionDto } from './dto/create-study-sessions.dto';
import { StudySession } from './entities/study-session.entity';

const HOUR_MS = 60 * 60 * 1000;
const CLOCK_SKEW_MS = 60 * 1000;
const MAX_PART_MS = 25 * HOUR_MS;

@Injectable()
export class StudySessionsService {
  constructor(
    @InjectRepository(StudySession)
    private readonly studySessionsRepository: Repository<StudySession>,
  ) {}

  // ---------------------------------------------------------------------------
  // C R E A T E

  async create(userId: string, sessions: StudySessionDto[]): Promise<void> {
    // 1. Identify all errors in the study sessions and throw
    //    a single BadRequestException with all of them
    const errors = sessions.flatMap((session, index) =>
      crossFieldErrors(session, `sessions.${index}`),
    );
    if (errors.length > 0) throw new BadRequestException(errors);

    // 2. Insert all study sessions into the database, ignoring any that
    //    already exist (i.e. have the same id)
    await this.studySessionsRepository
      .createQueryBuilder()
      .insert()
      .into(StudySession)
      .values(
        sessions.map((session) => ({
          id: session.id,
          userId,
          mode: session.mode,
          startedAt: new Date(session.startedAt),
          endedAt: new Date(session.endedAt),
          focusedMs: session.focusedMs,
          day: session.day,
        })),
      )
      .orIgnore()
      .execute();
  }
}

function crossFieldErrors(session: StudySessionDto, path: string): string[] {
  const { startedAt, endedAt, focusedMs, day } = session;
  const errors: string[] = [];

  if (startedAt > Date.now() + CLOCK_SKEW_MS) {
    errors.push(`${path}.startedAt must not be in the future`);
  }
  if (endedAt < startedAt) {
    errors.push(`${path}.endedAt must not be before startedAt`);
  } else {
    if (endedAt - startedAt > MAX_PART_MS) {
      errors.push(`${path}.endedAt must be at most 25 hours after startedAt`);
    }
    if (focusedMs > endedAt - startedAt + CLOCK_SKEW_MS) {
      errors.push(`${path}.focusedMs must not exceed endedAt - startedAt`);
    }
  }

  const dayStart = Date.parse(`${day}T00:00:00Z`);
  if (
    Number.isNaN(dayStart) ||
    new Date(dayStart).toISOString().slice(0, 10) !== day
  ) {
    errors.push(`${path}.day must be a valid date`);
  } else if (
    startedAt < dayStart - 14 * HOUR_MS ||
    startedAt >= dayStart + 36 * HOUR_MS
  ) {
    errors.push(`${path}.day must match startedAt in some time zone`);
  }

  return errors;
}
