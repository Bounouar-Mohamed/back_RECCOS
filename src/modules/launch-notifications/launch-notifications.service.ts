import { Injectable, Logger, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual, In } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { LaunchNotification, NotificationTiming } from '../../database/entities/launch-notification.entity';
import { Property, PropertyStatus } from '../../database/entities/property.entity';
import { EmailService } from '../../common/services/email.service';
import { SubscribeLaunchDto } from './dto/subscribe-launch.dto';

@Injectable()
export class LaunchNotificationsService {
  private readonly logger = new Logger(LaunchNotificationsService.name);

  constructor(
    @InjectRepository(LaunchNotification)
    private launchNotificationsRepository: Repository<LaunchNotification>,
    @InjectRepository(Property)
    private propertiesRepository: Repository<Property>,
    private emailService: EmailService,
  ) {}

  async subscribe(dto: SubscribeLaunchDto): Promise<{ message: string }> {
    // Vérifier que la propriété existe et est publiée
    const property = await this.propertiesRepository.findOne({
      where: { id: dto.propertyId, status: In([PropertyStatus.PUBLISHED, PropertyStatus.UPCOMING]) },
    });

    if (!property) {
      throw new NotFoundException('Property not found or not available');
    }

    // Vérifier si l'utilisateur est déjà inscrit
    const existing = await this.launchNotificationsRepository.findOne({
      where: { email: dto.email, propertyId: dto.propertyId },
    });

    if (existing) {
      // Mettre à jour le timing si différent
      if (existing.timing !== dto.timing) {
        existing.timing = dto.timing || NotificationTiming.AT_LAUNCH;
        existing.locale = dto.locale || 'en';
        await this.launchNotificationsRepository.save(existing);
        return { message: 'Subscription updated' };
      }
      throw new ConflictException('Already subscribed to this launch');
    }

    // Créer la nouvelle inscription
    const timing = dto.timing || NotificationTiming.AT_LAUNCH;
    const notification = this.launchNotificationsRepository.create({
      email: dto.email,
      propertyId: dto.propertyId,
      timing,
      locale: dto.locale || 'en',
    });

    await this.launchNotificationsRepository.save(notification);
    this.logger.log(`New launch subscription: ${dto.email} for property ${dto.propertyId}`);

    return { message: 'Successfully subscribed' };
  }

  // Exécuter toutes les minutes pour vérifier les notifications à envoyer
  @Cron(CronExpression.EVERY_MINUTE)
  async processNotifications(): Promise<void> {
    const now = new Date();

    // Récupérer les propriétés avec des notifications en attente
    const pendingNotifications = await this.launchNotificationsRepository
      .createQueryBuilder('notification')
      .leftJoinAndSelect('notification.property', 'property')
      .where('notification.isNotified = :isNotified', { isNotified: false })
      .andWhere('property.status IN (:...statuses)', {
        statuses: [PropertyStatus.UPCOMING, PropertyStatus.PUBLISHED],
      })
      .andWhere('property.availableAt IS NOT NULL')
      .getMany();

    for (const notification of pendingNotifications) {
      const property = notification.property;
      if (!property?.availableAt) continue;

      const launchDate = new Date(property.availableAt);
      let shouldNotify = false;

      switch (notification.timing) {
        case NotificationTiming.ONE_HOUR:
          // Notifier 1 heure avant
          const oneHourBefore = new Date(launchDate.getTime() - 60 * 60 * 1000);
          shouldNotify = now >= oneHourBefore && now < launchDate;
          break;
        case NotificationTiming.ONE_DAY:
          // Notifier 1 jour avant
          const oneDayBefore = new Date(launchDate.getTime() - 24 * 60 * 60 * 1000);
          shouldNotify = now >= oneDayBefore && now < launchDate;
          break;
        case NotificationTiming.AT_LAUNCH:
          // Notifier au moment du lancement (avec une tolérance de 5 minutes)
          const fiveMinutesAfter = new Date(launchDate.getTime() + 5 * 60 * 1000);
          shouldNotify = now >= launchDate && now <= fiveMinutesAfter;
          break;
      }

      if (shouldNotify) {
        await this.sendLaunchNotification(notification, property);
      }
    }
  }

  private async sendLaunchNotification(
    notification: LaunchNotification,
    property: Property,
  ): Promise<void> {
    try {
      const locale = notification.locale || 'en';
      const launchDate = property.availableAt
        ? new Intl.DateTimeFormat(locale, {
            dateStyle: 'full',
            timeStyle: 'short',
          }).format(new Date(property.availableAt))
        : 'Soon';

      const subject = this.getEmailSubject(locale, property.title);
      const html = this.generateEmailHtml(locale, property, launchDate);
      const text = this.generateEmailText(locale, property, launchDate);

      await this.emailService.sendMail(notification.email, subject, html, text);

      // Marquer comme notifié
      notification.isNotified = true;
      notification.notifiedAt = new Date();
      await this.launchNotificationsRepository.save(notification);

      this.logger.log(`Launch notification sent to ${notification.email} for property ${property.id}`);
    } catch (error) {
      this.logger.error(`Failed to send launch notification to ${notification.email}:`, error);
    }
  }

  private getEmailSubject(locale: string, propertyTitle: string): string {
    const subjects: Record<string, string> = {
      fr: `🚀 ${propertyTitle} est maintenant disponible !`,
      en: `🚀 ${propertyTitle} is now available!`,
      ar: `🚀 ${propertyTitle} متاح الآن!`,
    };
    return subjects[locale] || subjects.en;
  }

  private generateEmailHtml(locale: string, property: Property, launchDate: string): string {
    const content = this.getEmailContent(locale);
    const priceFormatted = new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: 'AED',
      maximumFractionDigits: 0,
    }).format(Number(property.pricePerShare));

    const location = [property.zone, property.emirate].filter(Boolean).join(', ') || property.address || '—';

    return `
<!DOCTYPE html>
<html lang="${locale}">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${content.title}</title>
<meta name="color-scheme" content="light dark">
<meta name="supported-color-schemes" content="light dark">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&display=swap" rel="stylesheet">
</head>
<body style="
  margin:0;
  padding:0;
  font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;
  color-scheme: light dark;
  forced-color-adjust:none;
">

<table role="presentation" style="width:100%; border-collapse:collapse; margin:0; padding:0;">
  <tr>
    <td style="padding:20px;">

      <table role="presentation" style="width:100%; max-width:600px; margin:0 auto; border-collapse:collapse;">

        <!-- Title -->
        <tr>
          <td style="text-align:left; padding:0 0 6px;">
            <h1 style="
              margin:0;
              font-size:24px;
              font-weight:bold;
              color:#000000;
            ">
              🚀 ${content.title}
            </h1>
          </td>
        </tr>

        <!-- Subtitle -->
        <tr>
          <td style="text-align:left; padding:0 0 20px;">
            <p style="
              margin:0;
              font-size:14px;
              color:#9b9b9b;
              line-height:1.5;
              font-weight:normal;
              forced-color-adjust:none;
            ">
              ${content.subtitle}
            </p>
          </td>
        </tr>

        <!-- Property Card -->
        <tr>
          <td style="padding:0 0 20px;">
            <div style="
              width:100%;
              background:#2c2c2c;
              border-radius: 16px;
              overflow:hidden;
              forced-color-adjust:none;
            ">
              ${property.mainImage ? `
              <img 
                src="${property.mainImage}" 
                alt="${property.title}"
                style="width:100%; height:200px; object-fit:cover;"
              />
              ` : ''}
              <div style="padding:20px;">
                <h2 style="
                  margin:0 0 10px;
                  font-size:20px;
                  color:#FFFFFF;
                  font-weight:600;
                  -webkit-text-fill-color:#FFFFFF;
                  forced-color-adjust:none;
                ">
                  ${property.title}
                </h2>
                <p style="
                  margin:0 0 15px;
                  font-size:13px;
                  color:#b0b0b0;
                  line-height:1.5;
                  -webkit-text-fill-color:#b0b0b0;
                  forced-color-adjust:none;
                ">
                  ${property.description?.substring(0, 150)}${property.description && property.description.length > 150 ? '...' : ''}
                </p>
                
                <table style="width:100%; border-collapse:collapse;">
                  <tr>
                    <td style="padding:8px 0; border-top:1px solid rgba(255,255,255,0.1);">
                      <span style="font-size:11px; color:#888; text-transform:uppercase; letter-spacing:0.1em;">${content.location}</span><br/>
                      <span style="font-size:14px; color:#fff; font-weight:500;">${location}</span>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:8px 0; border-top:1px solid rgba(255,255,255,0.1);">
                      <span style="font-size:11px; color:#888; text-transform:uppercase; letter-spacing:0.1em;">${content.pricePerShare}</span><br/>
                      <span style="font-size:14px; color:#fff; font-weight:500;">${priceFormatted}</span>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:8px 0; border-top:1px solid rgba(255,255,255,0.1);">
                      <span style="font-size:11px; color:#888; text-transform:uppercase; letter-spacing:0.1em;">${content.launchDate}</span><br/>
                      <span style="font-size:14px; color:#00ff94; font-weight:600;">${launchDate}</span>
                    </td>
                  </tr>
                </table>
              </div>
            </div>
          </td>
        </tr>

        <!-- CTA Button -->
        <tr>
          <td style="text-align:center; padding:0 0 25px;">
            <a href="https://reccos.ae/${locale}/launchpad" style="
              display:inline-block;
              background: linear-gradient(120deg, #ffffff 0%, #b3b3b3 100%);
              color:#050505;
              font-size:14px;
              font-weight:600;
              text-decoration:none;
              padding:14px 32px;
              border-radius:999px;
              text-transform:uppercase;
              letter-spacing:0.1em;
            ">
              ${content.ctaButton}
            </a>
          </td>
        </tr>

        <!-- Info -->
        <tr>
          <td style="text-align:left; padding:0 0 25px;">
            <p style="
              margin:0;
              font-size:12px;
              color:#9b9b9b;
              line-height:1.5;
              font-weight:normal;
              forced-color-adjust:none;
            ">
              ${content.footer}
            </p>
          </td>
        </tr>

        <!-- Logo RECCOS -->
        <tr>
          <td style="text-align:center; padding-top:10px;">
            <h2 style="
              margin:0;
              font-size:36px;
              text-transform:uppercase;
              font-family:'Bebas Neue', sans-serif;
              letter-spacing:0.08em;
              font-weight:normal;
              background: linear-gradient(to right, #FFFFFF, #656565 50%, #FFFFFF);
              -webkit-background-clip:text;
              -webkit-text-fill-color:transparent;
              background-clip:text;
              forced-color-adjust:none;
            ">
              RECCOS
            </h2>
          </td>
        </tr>

      </table>

    </td>
  </tr>
</table>

</body>
</html>
    `;
  }

  private generateEmailText(locale: string, property: Property, launchDate: string): string {
    const content = this.getEmailContent(locale);
    const priceFormatted = new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: 'AED',
      maximumFractionDigits: 0,
    }).format(Number(property.pricePerShare));
    const location = [property.zone, property.emirate].filter(Boolean).join(', ') || property.address || '—';

    return `
${content.title}

${content.subtitle}

---

${property.title}
${property.description?.substring(0, 200)}...

${content.location}: ${location}
${content.pricePerShare}: ${priceFormatted}
${content.launchDate}: ${launchDate}

---

${content.ctaButton}: https://reccos.ae/${locale}/launchpad

${content.footer}

RECCOS
    `.trim();
  }

  private getEmailContent(locale: string): Record<string, string> {
    const contents: Record<string, Record<string, string>> = {
      fr: {
        title: 'Le lancement est imminent !',
        subtitle: 'Une nouvelle opportunité d\'investissement exclusive vous attend.',
        location: 'Localisation',
        pricePerShare: 'Prix par part',
        launchDate: 'Date de lancement',
        ctaButton: 'Voir le bien',
        footer: 'Vous recevez cet email car vous vous êtes inscrit pour être notifié du lancement de ce bien sur RECCOS. Pour vous désinscrire, contactez-nous.',
      },
      en: {
        title: 'The launch is imminent!',
        subtitle: 'A new exclusive investment opportunity awaits you.',
        location: 'Location',
        pricePerShare: 'Price per share',
        launchDate: 'Launch date',
        ctaButton: 'View property',
        footer: 'You received this email because you subscribed to be notified about this property launch on RECCOS. To unsubscribe, contact us.',
      },
      ar: {
        title: 'الإطلاق وشيك!',
        subtitle: 'فرصة استثمارية حصرية جديدة في انتظارك.',
        location: 'الموقع',
        pricePerShare: 'سعر السهم',
        launchDate: 'تاريخ الإطلاق',
        ctaButton: 'عرض العقار',
        footer: 'تلقيت هذا البريد الإلكتروني لأنك اشتركت لتلقي إشعارات حول إطلاق هذا العقار على ريكوس. لإلغاء الاشتراك، اتصل بنا.',
      },
    };
    return contents[locale] || contents.en;
  }
}

