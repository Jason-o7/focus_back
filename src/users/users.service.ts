import { ConflictException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryFailedError, Repository } from 'typeorm';
import { User } from './entities/user.entity';

const UNIQUE_VIOLATION = '23505';

export interface CreateUserData {
  email: string;
  username: string;
  passwordHash: string;
}

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  findById(id: string): Promise<User | null> {
    return this.usersRepository.findOneBy({ id });
  }

  findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({
      where: { email },
      select: { id: true, email: true, username: true, passwordHash: true },
    });
  }

  async create(data: CreateUserData): Promise<User> {
    const taken = await this.usersRepository.find({
      where: [{ email: data.email }, { username: data.username }],
    });
    const fields: string[] = [];
    if (taken.some((user) => user.email === data.email)) fields.push('email');
    if (taken.some((user) => user.username === data.username))
      fields.push('username');
    if (fields.length > 0) {
      throw new ConflictException({
        message: `${fields.join(' and ')} already taken`,
        error: 'Conflict',
        statusCode: 409,
        fields,
      });
    }

    try {
      return await this.usersRepository.save(this.usersRepository.create(data));
    } catch (error) {
      if (
        error instanceof QueryFailedError &&
        (error.driverError as { code?: string }).code === UNIQUE_VIOLATION
      ) {
        throw new ConflictException('email or username already taken');
      }
      throw error;
    }
  }
}
