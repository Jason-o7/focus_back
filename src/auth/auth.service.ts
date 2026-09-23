import { Injectable, UnauthorizedException } from '@nestjs/common';
import { compare, hash } from 'bcrypt';
import { User } from '../users/entities/user.entity';
import { UsersService } from '../users/users.service';
import { SignInDto } from './dto/sign-in.dto';
import { SignUpDto } from './dto/sign-up.dto';

const SALT_ROUNDS = 10;

@Injectable()
export class AuthService {
  constructor(private readonly usersService: UsersService) {}

  async signUp(dto: SignUpDto): Promise<void> {
    const passwordHash = await hash(dto.password, SALT_ROUNDS);
    await this.usersService.create({
      email: dto.email,
      passwordHash,
      username: dto.username,
    });
  }

  async signIn(dto: SignInDto): Promise<User> {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user || !(await compare(dto.password, user.passwordHash))) {
      throw new UnauthorizedException('Invalid email or password');
    }
    return user;
  }
}
