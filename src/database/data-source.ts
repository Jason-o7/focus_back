import { existsSync } from 'node:fs';
import { DataSource } from 'typeorm';
import { RefreshToken } from '../auth/entities/refresh-token.entity';
import { StudySession } from '../study-sessions/entities/study-session.entity';
import { User } from '../users/entities/user.entity';

if (existsSync('.env')) {
  process.loadEnvFile('.env');
}

export default new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  entities: [User, StudySession, RefreshToken],
  migrations: [__dirname + '/migrations/*{.ts,.js}'],
});
