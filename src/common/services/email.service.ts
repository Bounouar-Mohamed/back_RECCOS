import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private sesClient: SESClient | null = null;
  private readonly fromAddress: string;

  constructor(private readonly configService: ConfigService) {
    const accessKeyId = this.configService.get<string>('aws.accessKeyId');
    const secretAccessKey = this.configService.get<string>('aws.secretAccessKey');
    const region = this.configService.get<string>('aws.region') || 'us-east-1';

    this.fromAddress = this.configService.get<string>('email.fromAddress') || 'no-reply@example.com';

    if (accessKeyId && secretAccessKey) {
      this.sesClient = new SESClient({
        region,
        credentials: {
          accessKeyId,
          secretAccessKey,
        },
      });
      this.logger.log(`Amazon SES client initialized successfully (region: ${region})`);
    } else {
      this.logger.warn('AWS credentials not configured; emails will be logged instead of sent.');
    }
  }

  async sendMail(to: string, subject: string, html: string, text?: string): Promise<void> {
    if (!this.sesClient) {
      this.logger.log(`Email (simulated) -> To: ${to}; Subject: ${subject}`);
      this.logger.debug(`HTML content: ${html.substring(0, 200)}...`);
      return;
    }

    try {
      // Formater le Source avec le nom d'affichage "RECCOS"
      const sourceWithDisplayName = `RECCOS <${this.fromAddress}>`;
      
      const command = new SendEmailCommand({
        Source: sourceWithDisplayName,
        Destination: {
          ToAddresses: [to],
        },
        Message: {
          Subject: {
            Data: subject,
            Charset: 'UTF-8',
          },
          Body: {
            Html: {
              Data: html,
              Charset: 'UTF-8',
            },
            ...(text && {
              Text: {
                Data: text,
                Charset: 'UTF-8',
              },
            }),
          },
        },
      });

      const response = await this.sesClient.send(command);
      this.logger.log(`Email sent successfully to ${to}. MessageId: ${response.MessageId}`);
    } catch (error) {
      this.logger.error(`Failed to send email to ${to}:`, error);
      // Ne pas faire planter l'application si l'email échoue
      // L'utilisateur peut toujours utiliser le lien de vérification
      this.logger.warn(`Email sending failed, but user registration continues. Token is still valid.`);
    }
  }
}

