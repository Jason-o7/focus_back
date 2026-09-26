import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { PublicUser, toPublicUser } from '../auth/auth.service';
import { UsersService } from '../users/users.service';
import { StudySessionDto } from './dto/create-study-sessions.dto';
import {
  StudySession,
  StudySessionMode,
} from './entities/study-session.entity';

const HOUR_MS = 60 * 60 * 1000;
const CLOCK_SKEW_MS = 60 * 1000;
const MAX_PART_MS = 25 * HOUR_MS;

// R E S P O N S E - S T R U C T U R E S
export interface StudySessionResponse {
  id: string;
  mode: StudySessionMode;
  startedAt: number;
  endedAt: number;
  focusedMs: number;
  day: string;
  createdAt: number;
}

export interface StudySessionListResponse {
  sessions: StudySessionResponse[];
  user: PublicUser;
}
// --------------------------

@Injectable()
export class StudySessionsService {
  constructor(
    @InjectRepository(StudySession)
    private readonly studySessionsRepository: Repository<StudySession>,
    private readonly usersService: UsersService,
  ) {}

  // ---------------------------------------------------------------------------
  // F I N D - A L L

  async findAll(userId: string): Promise<StudySessionListResponse> {
    // 1. Get the user data for this userId, if it exists
    const user = await this.usersService.findById(userId);
    // 1.1 If the user doesn't exist, throw an UnauthorizedException
    if (!user) throw new UnauthorizedException();

    // 2. Read all study sessions of this user, oldest first
    const sessions = await this.studySessionsRepository.find({
      where: { userId },
      order: { startedAt: 'ASC' },
    });

    // 3. Return the list of study sessions, with the user once at the end
    return {
      sessions: sessions.map(toStudySessionResponse),
      user: toPublicUser(user),
    };
  }

  // ---------------------------------------------------------------------------
  // C R E A T E

  async create(
    userId: string,
    sessions: StudySessionDto[],
  ): Promise<StudySessionListResponse> {
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

    // 3. Get the user data for this userId, if it exists
    const user = await this.usersService.findById(userId);
    // 3.1 If the user doesn't exist, throw an UnauthorizedException
    if (!user) throw new UnauthorizedException();

    // 4. Read back the rows of this user as they are stored in the database
    const stored = await this.studySessionsRepository.find({
      where: { id: In(sessions.map((session) => session.id)), userId },
      order: { startedAt: 'ASC' },
    });

    // 5. Return the list of study sessions, with the user once at the end
    return {
      sessions: stored.map(toStudySessionResponse),
      user: toPublicUser(user),
    };
  }
}

function toStudySessionResponse(session: StudySession): StudySessionResponse {
  return {
    id: session.id,
    mode: session.mode,
    startedAt: session.startedAt.getTime(),
    endedAt: session.endedAt.getTime(),
    focusedMs: session.focusedMs,
    day: session.day,
    createdAt: session.createdAt.getTime(),
  };
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
