import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug', 'verbose'],
  });

  const configService = app.get(ConfigService);
  const isProduction = configService.get('NODE_ENV') === 'production';

  // ═══════════════════════════════════════════════════════════════════════════════
  // SÉCURITÉ: Helmet pour les headers HTTP de sécurité
  // ═══════════════════════════════════════════════════════════════════════════════
  app.use(helmet({
    contentSecurityPolicy: isProduction ? undefined : false, // Désactivé en dev pour Swagger
    crossOriginEmbedderPolicy: false, // Permet les requêtes cross-origin
    hsts: isProduction ? { maxAge: 31536000, includeSubDomains: true } : false,
  }));
  logger.log('🛡️  Helmet activé pour les headers de sécurité');

  // Validation des variables critiques en production
  if (isProduction) {
    const requiredVars = [
      'JWT_SECRET',
      'DB_HOST',
      'DB_USERNAME',
      'DB_PASSWORD',
      'DB_NAME',
    ];

    const missingVars = requiredVars.filter(
      (varName) => !process.env[varName] || process.env[varName] === '',
    );

    if (missingVars.length > 0) {
      logger.error(
        `❌ Variables d'environnement manquantes: ${missingVars.join(', ')}`,
      );
      logger.error('L\'application ne peut pas démarrer en production sans ces variables.');
      process.exit(1);
    }

    // Vérifier que JWT_SECRET n'est pas la valeur par défaut
    if (
      process.env.JWT_SECRET === 'your-secret-key-change-in-production' ||
      process.env.JWT_SECRET.length < 32
    ) {
      logger.error(
        '❌ JWT_SECRET doit être défini et avoir au moins 32 caractères en production',
      );
      process.exit(1);
    }
  }

  // CORS Configuration
  app.enableCors(configService.get('cors'));

  // Global prefix
  app.setGlobalPrefix('api');

  // Swagger Documentation (uniquement en développement)
  if (!isProduction) {
    const config = new DocumentBuilder()
      .setTitle('All4One API')
      .setDescription('All4One Backend API Documentation')
      .setVersion('1.0')
      .addBearerAuth()
      .addTag('auth', 'Authentication endpoints')
      .addTag('users', 'User management endpoints')
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);
    logger.log('📚 Swagger documentation disponible sur /api/docs');
  } else {
    logger.warn('⚠️  Swagger désactivé en production');
  }

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
      disableErrorMessages: isProduction, // Masquer les détails d'erreur en production
    }),
  );

  const port = configService.get('port') || 3000;
  // Écouter sur toutes les interfaces (0.0.0.0) pour accepter les connexions depuis n'importe quelle interface
  await app.listen(port, '0.0.0.0');

  logger.log(`🚀 Application démarrée sur http://localhost:${port}/api`);
  logger.log(`🌍 Environnement: ${isProduction ? 'PRODUCTION' : 'DEVELOPMENT'}`);
  
  if (!isProduction) {
    logger.log(`📚 Swagger documentation: http://localhost:${port}/api/docs`);
  }
}

bootstrap().catch((error) => {
  const logger = new Logger('Bootstrap');
  logger.error('❌ Erreur lors du démarrage de l\'application', error);
  process.exit(1);
});
