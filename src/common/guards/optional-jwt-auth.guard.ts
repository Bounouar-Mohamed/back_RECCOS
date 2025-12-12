import {
  Injectable,
  ExecutionContext,
  Logger,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Guard JWT optionnel - permet l'accès avec ou sans authentification
 * 
 * Si un token est présent et valide, l'utilisateur est attaché à la requête.
 * Si pas de token ou token invalide, la requête passe quand même avec user = null.
 */
@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  private readonly logger = new Logger(OptionalJwtAuthGuard.name);

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers?.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      // Token présent, essayer de l'authentifier
      try {
        const result = await super.canActivate(context);
        this.logger.debug('Token valide, utilisateur authentifié');
        return result as boolean;
      } catch (error) {
        // Token invalide, mais on laisse passer avec user = null
        this.logger.debug('Token invalide, accès anonyme autorisé');
        request.user = null;
        return true;
      }
    }

    // Pas de token, accès anonyme autorisé
    this.logger.debug('Pas de token, accès anonyme');
    request.user = null;
    return true;
  }

  handleRequest(err: any, user: any, info: any, context: ExecutionContext) {
    // Ne jamais lancer d'erreur - retourner null si pas d'utilisateur
    if (err) {
      this.logger.debug(`Erreur d'authentification ignorée: ${err.message}`);
      return null;
    }
    return user || null;
  }
}
