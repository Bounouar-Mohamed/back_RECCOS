import { Injectable, Logger } from '@nestjs/common';
import { EmailService } from '../../common/services/email.service';
import { CreatePurchaseDto } from './dto/create-purchase.dto';

@Injectable()
export class PurchasesService {
  private readonly logger = new Logger(PurchasesService.name);

  constructor(private readonly emailService: EmailService) {}

  async createPurchase(dto: CreatePurchaseDto): Promise<{ success: boolean; transactionId: string }> {
    // Générer un ID de transaction simulé
    const transactionId = `TXN-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    
    this.logger.log(`Processing simulated purchase: ${dto.shares} shares for ${dto.email}`);

    // Envoyer l'email de confirmation
    await this.sendPurchaseConfirmationEmail(dto, transactionId);

    this.logger.log(`Purchase completed: ${transactionId}`);

    return {
      success: true,
      transactionId,
    };
  }

  private async sendPurchaseConfirmationEmail(dto: CreatePurchaseDto, transactionId: string): Promise<void> {
    const currency = dto.currency || 'AED';
    const propertyTitle = dto.propertyTitle || 'RECCOS Investment';
    const propertyLocation = dto.propertyLocation || 'Dubai, UAE';
    const propertyImage = dto.propertyImage || null;
    const formattedAmount = new Intl.NumberFormat('en-AE', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(dto.totalAmount);

    const htmlContent = this.buildPurchaseEmailHtml({
      transactionId,
      shares: dto.shares,
      totalAmount: formattedAmount,
      propertyTitle,
      propertyLocation,
      propertyImage,
      email: dto.email,
    });

    const subject = `🎉 Your RECCOS investment is confirmed - ${propertyTitle}`;

    await this.emailService.sendMail(dto.email, subject, htmlContent);
  }

  private buildPurchaseEmailHtml(params: {
    transactionId: string;
    shares: number;
    totalAmount: string;
    propertyTitle: string;
    propertyLocation: string;
    propertyImage: string | null;
    email: string;
  }): string {
    const { transactionId, shares, totalAmount, propertyTitle, propertyLocation, propertyImage } = params;

    // Génère la section image si disponible
    const imageSection = propertyImage ? `
        <!-- Property Image -->
        <tr>
          <td align="center" style="padding:0 0 24px;">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 auto;">
              <tr>
                <td align="center">
                  <img 
                    src="${propertyImage}" 
                    alt="${propertyTitle}"
                    width="520"
                    style="
                      display:block;
                      width:100%;
                      max-width:520px;
                      height:auto;
                      border-radius:16px;
                      object-fit:cover;
                    "
                  />
                </td>
              </tr>
            </table>
          </td>
        </tr>
    ` : '';

    return `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Investment Confirmed</title>

<!-- Dark-mode support meta -->
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
  background-color:#ffffff;
">

<!-- Wrapper table for full-width background -->
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:#ffffff;">
  <tr>
    <td align="center" style="padding:40px 20px;">

      <!-- Main content table - centered -->
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="560" style="max-width:560px;">

        <!-- Logo RECCOS at top -->
        <tr>
          <td align="center" style="padding:0 0 32px;">
            <h2 style="
              margin:0;
              font-size:32px;
              text-transform:uppercase;
              font-family:'Bebas Neue', Arial, sans-serif;
              letter-spacing:0.08em;
              font-weight:normal;
              color:#1a1a1a;
            ">
              RECCOS
            </h2>
          </td>
        </tr>

        <!-- Success Badge -->
        <tr>
          <td align="center" style="padding:0 0 24px;">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td align="center" style="
                  background-color:#34c759;
                  padding:10px 24px;
                  border-radius:999px;
                ">
                  <span style="
                    color:#ffffff;
                    font-size:12px;
                    font-weight:600;
                    letter-spacing:0.1em;
                    text-transform:uppercase;
                  ">✓ Investment Confirmed</span>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Title -->
        <tr>
          <td align="center" style="padding:0 0 8px;">
            <h1 style="
              margin:0;
              font-size:32px;
              font-weight:700;
              color:#000000;
              line-height:1.2;
            ">
              Congratulations! 🎉
            </h1>
          </td>
        </tr>

        <!-- Subtitle -->
        <tr>
          <td align="center" style="padding:0 0 32px;">
            <p style="
              margin:0;
              font-size:16px;
              color:#666666;
              line-height:1.5;
            ">
              Your investment has been successfully processed.
            </p>
          </td>
        </tr>

        ${imageSection}

        <!-- Property Details Card -->
        <tr>
          <td align="center" style="padding:0 0 24px;">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="
              background-color:#1a1a1a;
              border-radius:16px;
              overflow:hidden;
            ">
              <tr>
                <td style="padding:28px 24px;">
                  
                  <!-- Property Name -->
                  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                    <tr>
                      <td align="center">
                        <p style="
                          margin:0 0 4px;
                          font-size:11px;
                          color:#888888;
                          text-transform:uppercase;
                          letter-spacing:0.12em;
                        ">Property</p>
                        <p style="
                          margin:0 0 20px;
                          font-size:22px;
                          color:#ffffff;
                          font-weight:600;
                          line-height:1.3;
                        ">${propertyTitle}</p>
                      </td>
                    </tr>
                  </table>

                  <!-- Location -->
                  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                    <tr>
                      <td align="center">
                        <p style="
                          margin:0 0 4px;
                          font-size:11px;
                          color:#888888;
                          text-transform:uppercase;
                          letter-spacing:0.12em;
                        ">Location</p>
                        <p style="
                          margin:0 0 24px;
                          font-size:15px;
                          color:#ffffff;
                        ">📍 ${propertyLocation}</p>
                      </td>
                    </tr>
                  </table>

                  <!-- Divider -->
                  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                    <tr>
                      <td style="
                        height:1px;
                        background-color:rgba(255,255,255,0.1);
                        font-size:1px;
                        line-height:1px;
                      ">&nbsp;</td>
                    </tr>
                  </table>

                  <!-- Shares & Amount -->
                  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-top:24px;">
                    <tr>
                      <td width="50%" align="center" valign="top" style="padding-right:12px;">
                        <p style="
                          margin:0 0 6px;
                          font-size:11px;
                          color:#888888;
                          text-transform:uppercase;
                          letter-spacing:0.12em;
                        ">Shares Purchased</p>
                        <p style="
                          margin:0;
                          font-size:28px;
                          color:#ffffff;
                          font-weight:700;
                        ">${shares}</p>
                      </td>
                      <td width="50%" align="center" valign="top" style="padding-left:12px;">
                        <p style="
                          margin:0 0 6px;
                          font-size:11px;
                          color:#888888;
                          text-transform:uppercase;
                          letter-spacing:0.12em;
                        ">Total Investment</p>
                        <p style="
                          margin:0;
                          font-size:28px;
                          color:#34c759;
                          font-weight:700;
                        ">${totalAmount}</p>
                      </td>
                    </tr>
                  </table>

                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Transaction ID -->
        <tr>
          <td align="center" style="padding:0 0 24px;">
            <p style="
              margin:0;
              font-size:12px;
              color:#999999;
              letter-spacing:0.05em;
            ">
              Transaction ID: <span style="color:#666666;">${transactionId}</span>
            </p>
          </td>
        </tr>

        <!-- Title Deed Notice -->
        <tr>
          <td align="center" style="padding:0 0 32px;">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="
              background-color:#f5f5f5;
              border-radius:12px;
              border-left:4px solid #34c759;
            ">
              <tr>
                <td style="padding:20px 24px;">
                  <p style="
                    margin:0 0 8px;
                    font-size:15px;
                    color:#000000;
                    font-weight:600;
                  ">📄 Your Title Deed</p>
                  <p style="
                    margin:0;
                    font-size:14px;
                    color:#555555;
                    line-height:1.6;
                  ">
                    Your official title deed will be sent to this email within <strong>24 hours</strong>. 
                    This document certifies your ownership of ${shares} share${shares > 1 ? 's' : ''} in ${propertyTitle}.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Support Info -->
        <tr>
          <td align="center" style="padding:0 0 32px;">
            <p style="
              margin:0;
              font-size:13px;
              color:#999999;
              line-height:1.6;
            ">
              If you have any questions about your investment,<br/>
              please contact our support team.<br/>
              Thank you for investing with RECCOS!
            </p>
          </td>
        </tr>

        <!-- Divider -->
        <tr>
          <td align="center" style="padding:0 0 24px;">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="80">
              <tr>
                <td style="
                  height:1px;
                  background-color:#e0e0e0;
                  font-size:1px;
                  line-height:1px;
                ">&nbsp;</td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td align="center">
            <p style="
              margin:0;
              font-size:11px;
              color:#bbbbbb;
              line-height:1.5;
            ">
              © 2025 RECCOS. All rights reserved.<br/>
              Dubai, United Arab Emirates
            </p>
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
}

