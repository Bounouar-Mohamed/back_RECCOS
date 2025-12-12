import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';

@Injectable()
export class InternalKeyGuard implements CanActivate {
  private readonly headerName = 'x-internal-key';

  constructor(private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const expectedKey =
      this.configService.get<string>('tools.internalKey') ||
      process.env.TOOLS_INTERNAL_KEY;

    if (!expectedKey) {
      throw new UnauthorizedException(
        'Configuration manquante pour TOOLS_INTERNAL_KEY',
      );
    }

    const providedKey =
      (request.headers[this.headerName] as string | undefined)?.trim() || '';

    if (!providedKey || providedKey !== expectedKey) {
      throw new UnauthorizedException('Clé interne invalide');
    }

    return true;
  }
}

