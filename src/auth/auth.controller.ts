import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignInDto } from './dto/sign-in.dto';
import { SignUpDto } from './dto/sign-up.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // TODO: return the same payload as signin (accessToken + user) once JWT exists
  @Post('signup')
  async signUp(@Body() dto: SignUpDto): Promise<{ message: string }> {
    await this.authService.signUp(dto);
    return { message: 'Account created' };
  }

  // TODO: return accessToken + user once JWT exists
  @Post('signin')
  @HttpCode(HttpStatus.OK)
  async signIn(@Body() dto: SignInDto): Promise<{ message: string }> {
    await this.authService.signIn(dto);
    return { message: 'Signed in' };
  }
}
