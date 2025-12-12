import {
  Injectable,
  ExecutionContext,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  private readonly logger = new Logger(JwtAuthGuard.name);

  constructor(private reflector: Reflector) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Vérifier le décorateur @Public()
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // Vérifier si c'est une route optionnellement authentifiée (comme /api/ai/chat)
    const isOptionallyAuthenticated = this.isRouteOptionallyAuthenticated(context);

    if (isPublic) {
      this.logger.debug(`Route publique détectée (isPublic=${isPublic})`);
      return true;
    }

    // Pour les routes optionnellement authentifiées:
    // - Si un token est présent, on valide l'utilisateur
    // - Si pas de token, on laisse passer avec user = null
    if (isOptionallyAuthenticated) {
      const request = context.switchToHttp().getRequest();
      const authHeader = request.headers?.authorization;
      
      if (authHeader && authHeader.startsWith('Bearer ')) {
        // Token présent, essayer de l'authentifier
        try {
          const result = await super.canActivate(context);
          this.logger.debug(`Route AI Chat avec token valide, user authentifié`);
          return result as boolean;
        } catch (error) {
          // Token invalide, mais la route est optionnellement authentifiée
          // donc on laisse passer avec user = null
          this.logger.debug(`Route AI Chat avec token invalide, accès anonyme autorisé`);
          request.user = null;
          return true;
        }
      } else {
        // Pas de token, accès anonyme autorisé
        this.logger.debug(`Route AI Chat sans token, accès anonyme autorisé`);
        request.user = null;
        return true;
      }
    }

    return super.canActivate(context) as Promise<boolean>;
  }

  handleRequest(err: any, user: any, info: any, context: ExecutionContext) {
    // Vérifier si c'est une route optionnellement authentifiée
    const isOptionallyAuthenticated = this.isRouteOptionallyAuthenticated(context);
    
    if (isOptionallyAuthenticated) {
      // Pour les routes optionnellement authentifiées, on ne lance pas d'erreur si pas d'user
      if (err) {
        this.logger.debug(`Route optionnelle - erreur ignorée: ${err.message}`);
        return null;
      }
      return user || null;
    }
    
    if (err || !user) {
      throw err || new UnauthorizedException('Invalid token');
    }
    return user;
  }

  private isRouteOptionallyAuthenticated(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    if (!request) {
      return false;
    }
    
    const method = (request.method || '').toUpperCase();
    const url: string = request.originalUrl || request.url || '';
    const path: string = request.path || '';

    if (!method) {
      return false;
    }

    // Normaliser les URLs pour la comparaison
    const normalizedUrl = url.toLowerCase().split('?')[0]; // Retirer les query params
    const normalizedPath = path.toLowerCase().split('?')[0];

    // Routes IA optionnellement authentifiées (Noor chat)
    // - Accessibles sans authentification (mode anonyme)
    // - Si un token est présent, on authentifie l'utilisateur pour sauvegarder l'historique
    if (method === 'POST') {
      const isAiChat = 
        normalizedUrl === '/ai/chat' ||
        normalizedUrl === '/api/ai/chat' ||
        normalizedPath === '/ai/chat' ||
        normalizedPath === '/api/ai/chat';
      
      if (isAiChat) {
        return true;
      }

      // Routes Realtime optionnellement authentifiées
      const isRealtimeRoute = 
        normalizedUrl.includes('/chatbot/realtime/ephemeral-token') ||
        normalizedPath.includes('/chatbot/realtime/ephemeral-token') ||
        normalizedUrl.includes('/chatbot/realtime/revoke') ||
        normalizedPath.includes('/chatbot/realtime/revoke') ||
        normalizedUrl.includes('/chatbot/realtime/tools/execute') ||
        normalizedPath.includes('/chatbot/realtime/tools/execute');
      
      if (isRealtimeRoute) {
        return true;
      }
    }

    // GET pour la config realtime
    if (method === 'GET') {
      const isRealtimeConfig = 
        normalizedUrl.includes('/chatbot/realtime/config') ||
        normalizedPath.includes('/chatbot/realtime/config');
      
      if (isRealtimeConfig) {
        return true;
      }
    }

    return false;
  }
}
