import { existsSync } from 'node:fs';
import { DataSource } from 'typeorm';
import { Session } from '../sessions/entities/session.entity';
import { User } from '../users/entities/user.entity';

if (existsSync('.env')) {
  process.loadEnvFile('.env');
}

export default new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  entities: [User, Session],
  migrations: [__dirname + '/migrations/*{.ts,.js}'],
});
