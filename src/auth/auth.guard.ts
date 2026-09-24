import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { IS_PUBLIC_KEY } from './public.decorator';

export interface JwtPayload {
  sub: string;
}

export interface AuthenticatedRequest extends Request {
  user: JwtPayload;
}

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // 1. Check if the route is public
    //    A public route has @Public() decorator defined in the controller
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    // 1.1 If the route is public, allow access without checking for a JWT
    if (isPublic) return true;

    // 2. Get only the HTTP request from the context
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    // 3. Check if the request has an Authorization header with a Bearer token
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    // 3.1 If the Authorization header is missing or does not contain a Bearer token
    //     throw an UnauthorizedException
    if (type !== 'Bearer' || !token) throw new UnauthorizedException();

    try {
      // 4. Verify the signature and expiration of the JWT
      //    and save the payload in request.user to be used in the controller
      request.user = await this.jwtService.verifyAsync<JwtPayload>(token);
    } catch {
      // 4.1 If the JWT is invalid or expired, throw an UnauthorizedException
      throw new UnauthorizedException();
    }

    // 5. If the JWT is valid, allow access to the route
    return true;
  }
}
