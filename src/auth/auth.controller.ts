import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AuthResponse, AuthService, AuthTokens } from './auth.service';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { SignInDto } from './dto/sign-in.dto';
import { SignUpDto } from './dto/sign-up.dto';
import { Public } from './public.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Throttle({ default: { ttl: 60_000, limit: 3 } })
  @Post('signup')
  signUp(@Body() dto: SignUpDto): Promise<AuthResponse> {
    return this.authService.signUp(dto);
  }

  @Public()
  @Throttle({ default: { ttl: 60_000, limit: 5 } })
  @Post('signin')
  @HttpCode(HttpStatus.OK)
  signIn(@Body() dto: SignInDto): Promise<AuthResponse> {
    return this.authService.signIn(dto);
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  refresh(@Body() dto: RefreshTokenDto): Promise<AuthTokens> {
    return this.authService.refresh(dto.refreshToken);
  }

  @Public()
  @Post('signout')
  @HttpCode(HttpStatus.NO_CONTENT)
  signOut(@Body() dto: RefreshTokenDto): Promise<void> {
    return this.authService.signOut(dto.refreshToken);
  }
}
