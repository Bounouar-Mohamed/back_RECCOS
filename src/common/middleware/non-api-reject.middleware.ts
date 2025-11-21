import { Injectable, NestMiddleware, HttpException, HttpStatus } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class NonApiRejectMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    // Si la route ne commence pas par /api, rejeter avec un message clair
    if (!req.path.startsWith('/api')) {
      throw new HttpException(
        {
          statusCode: HttpStatus.NOT_FOUND,
          timestamp: new Date().toISOString(),
          path: req.path,
          method: req.method,
          message: `Cette route n'existe pas sur le backend API. Le backend ne gère que les routes /api/*. Pour accéder au frontend, utilisez le port 3001 (http://localhost:3001${req.path})`,
        },
        HttpStatus.NOT_FOUND,
      );
    }
    next();
  }
}

