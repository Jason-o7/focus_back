import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { compare, hash } from 'bcrypt';
import { createHash, randomUUID } from 'node:crypto';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { UsersService } from '../users/users.service';
import { JwtPayload } from './auth.guard';
import { SignInDto } from './dto/sign-in.dto';
import { SignUpDto } from './dto/sign-up.dto';
import { RefreshToken } from './entities/refresh-token.entity';

const SALT_ROUNDS = 10;

// R E S P O N S E - S T R U C T U R E S
export interface PublicUser {
  id: string;
  email: string;
  username: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponse extends AuthTokens {
  user: PublicUser;
}
// --------------------------

interface RefreshTokenPayload {
  jti: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    @InjectRepository(RefreshToken)
    private readonly refreshTokensRepository: Repository<RefreshToken>,
    private readonly config: ConfigService,
  ) {}

  async signUp(dto: SignUpDto): Promise<AuthResponse> {
    // 1. Hash the password
    const passwordHash = await hash(dto.password, SALT_ROUNDS);
    // 2. Create the user in the database
    //    and also save it in "user"
    const user = await this.usersService.create({
      email: dto.email,
      passwordHash,
      username: dto.username,
    });
    // 3. Return AuthResponse that contains the access token,
    //    refresh token and user data
    return this.startSession(user);
  }

  async signIn(dto: SignInDto): Promise<AuthResponse> {
    // 1. Find the user by email and save it in "user"
    const user = await this.usersService.findByEmail(dto.email);
    // 1.1 If the user doesn't exist or the password is invalid
    //    throw an UnauthorizedException
    if (!user || !(await compare(dto.password, user.passwordHash))) {
      throw new UnauthorizedException('Invalid email or password');
    }
    // 2. If the user exists and the password is valid
    //    return AuthResponse that contains the access token,
    //    refresh token and user data
    return this.startSession(user);
  }

  async refresh(refreshToken: string): Promise<AuthTokens> {
    // 1. Verify the refresh token signature and expiration
    await this.verifyRefreshToken(refreshToken);
    // 2. Hash the old refresh token
    const oldHash = sha256(refreshToken);
    // 3. Find the refresh token in the database and save that row in "stored"
    const stored = await this.refreshTokensRepository.findOneBy({
      tokenHash: oldHash,
    });
    // 3.1 If the refresh token doesn't exist or is expired, throw an UnauthorizedException
    if (!stored || stored.expiresAt <= new Date()) {
      throw new UnauthorizedException();
    }

    // 4. Generate a new refresh token
    const newRefreshToken = await this.signRefreshToken();
    // 5. Update the same row with the new refresh token and
    //    the new expiration date in the database
    const { affected } = await this.refreshTokensRepository.update(
      { id: stored.id, tokenHash: oldHash },
      {
        tokenHash: sha256(newRefreshToken),
        expiresAt: this.refreshTokenExpiry(),
      },
    );
    // 5.1 If no row was updated (the token was already rotated or deleted),
    //     throw an UnauthorizedException
    if (affected !== 1) throw new UnauthorizedException();

    // 6. Return the new access token and the new refresh token
    return {
      accessToken: await this.signAccessToken(stored.userId),
      refreshToken: newRefreshToken,
    };
  }

  async signOut(refreshToken: string): Promise<void> {
    // 1. Delete the refresh token from the database
    await this.refreshTokensRepository.delete({
      tokenHash: sha256(refreshToken),
    });
  }

  private async startSession(user: User): Promise<AuthResponse> {
    // 1. Generate a refresh token
    const refreshToken = await this.signRefreshToken();
    // 2. Store the refresh token in the database
    await this.refreshTokensRepository.save(
      this.refreshTokensRepository.create({
        userId: user.id,
        tokenHash: sha256(refreshToken),
        expiresAt: this.refreshTokenExpiry(),
      }),
    );
    // 3. Return the access token, refresh token, and public user data
    return {
      // 3.1 Generate an access token and return it along with the
      //     refresh token and user data
      accessToken: await this.signAccessToken(user.id),
      refreshToken,
      user: toPublicUser(user),
    };
  }

  private signAccessToken(userId: string): Promise<string> {
    // 1. Create a JWT payload with the user ID
    const payload: JwtPayload = { sub: userId };
    // 2. Finish the payload with iat and exp, also finish
    //    the token with the header and signature and return it
    return this.jwtService.signAsync(payload);
  }

  private signRefreshToken(): Promise<string> {
    // 1. Create a JWT payload with a random UUID as the jti
    //    so that 2 refresh tokens generated at the same time are different
    const payload: RefreshTokenPayload = { jti: randomUUID() };
    // 2. Finish the payload with iat and exp, also finish
    //    the token with the header and signature and return it
    return this.jwtService.signAsync(payload, {
      secret: this.config.getOrThrow<string>('JWT_REFRESH_SECRET'),
      expiresIn: this.refreshTokenTtlDays() * 24 * 60 * 60,
    });
  }

  private async verifyRefreshToken(refreshToken: string): Promise<void> {
    try {
      // 1. Verify the refresh token signature and expiration
      await this.jwtService.verifyAsync<RefreshTokenPayload>(refreshToken, {
        secret: this.config.getOrThrow<string>('JWT_REFRESH_SECRET'),
      });
    } catch {
      // 1.1 If the refresh token is invalid or expired, throw an UnauthorizedException
      throw new UnauthorizedException();
    }
  }

  private refreshTokenExpiry(): Date {
    return new Date(
      Date.now() + this.refreshTokenTtlDays() * 24 * 60 * 60 * 1000,
    );
  }

  private refreshTokenTtlDays(): number {
    return this.config.getOrThrow<number>('REFRESH_TOKEN_TTL_DAYS');
  }
}

function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

function toPublicUser({ id, email, username }: User): PublicUser {
  return { id, email, username };
}
