import { Injectable, NestMiddleware, HttpException, HttpStatus } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class NonApiRejectMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    // Utiliser l'URL brute pour détecter correctement le préfixe /api,
    // même avec un globalPrefix ou un reverse proxy devant Nest
    const url = req.originalUrl || req.url || req.path || '/';

    // Si la route ne commence pas par /api, rejeter avec un message clair
    if (!url.startsWith('/api')) {
      throw new HttpException(
        {
          statusCode: HttpStatus.NOT_FOUND,
          timestamp: new Date().toISOString(),
          path: url,
          method: req.method,
          message: `Cette route n'existe pas sur le backend API. Le backend ne gère que les routes /api/*. Pour accéder au frontend, utilisez le port 3001 (http://localhost:3001${req.path})`,
        },
        HttpStatus.NOT_FOUND,
      );
    }
    next();
  }
}

