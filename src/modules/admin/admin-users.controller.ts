import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UsersService } from '../users/users.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/guards/roles.decorator';
import { UserRole } from '../../common/enums/user-role.enum';
import * as bcrypt from 'bcrypt';
import { ConfigService } from '@nestjs/config';
import { EmailService } from '../../common/services/email.service';
import { IsBoolean, IsEnum } from 'class-validator';

class CreateAdminUserDto {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  username?: string;
  role: UserRole; // client ou admin
}

class UpdateUserRoleDto {
  @IsEnum(UserRole, {
    message: 'role must be one of: client, admin, superadmin',
  })
  role: UserRole; // client, admin ou superadmin
}

class UpdateUserStatusDto {
  @IsBoolean()
  isActive: boolean;
}

@ApiTags('admin-users')
@ApiBearerAuth()
@Controller('admin/users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AdminUsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly configService: ConfigService,
    private readonly emailService: EmailService,
  ) {}

  /**
   * Créer un compte utilisateur (réservé SUPERADMIN)
   * Permet de créer :
   * - un simple client (CLIENT)
   * - un admin (ADMIN)
   */
  @Post()
  @Roles(UserRole.SUPERADMIN)
  @ApiOperation({
    summary: 'Create a new user account (SUPERADMIN only)',
  })
  async createUser(@Body() dto: CreateAdminUserDto) {
    const existingByEmail = await this.usersService.findByEmail(dto.email);
    if (existingByEmail) {
      throw new Error('User with this email already exists');
    }

    let username = dto.username || dto.email.split('@')[0];
    let counter = 1;
    while (await this.usersService.findByUsername(username)) {
      username = `${username}${counter}`;
      counter++;
    }

    const saltRounds = this.configService.get('bcrypt.saltRounds') || 10;
    const hashedPassword = await bcrypt.hash(dto.password, saltRounds);

    const user = await this.usersService.create({
      email: dto.email,
      password: hashedPassword,
      firstName: dto.firstName || null,
      lastName: dto.lastName || null,
      username,
      role: dto.role,
      isActive: true,
      emailVerified: true,
    });

    const { password, ...safeUser } = user as any;
    return safeUser;
  }

  /**
   * Modifier le rôle d'un utilisateur (réservé SUPERADMIN)
   * Exemple : client -> admin, admin -> superadmin, etc.
   */
  @Patch(':id/role')
  @Roles(UserRole.SUPERADMIN)
  @ApiOperation({
    summary: 'Update user role (SUPERADMIN only)',
  })
  async updateUserRole(
    @Param('id') id: string,
    @Body() dto: UpdateUserRoleDto,
  ) {
    const updated = await this.usersService.update(id, { role: dto.role });

    // Notifier l'utilisateur par email
    try {
      const subject = 'Your account role has been updated - RECCOS';
      const html = this.buildUserChangeEmailHtml(
        updated.email,
        `Your role has been updated to <strong>${updated.role}</strong>.`,
      );
      const text = `Hello,\n\nYour RECCOS account role has been updated to: ${updated.role}.\n\nIf you did not expect this change, please contact the RECCOS team.\n\nRECCOS`;

      await this.emailService.sendMail(updated.email, subject, html, text);
    } catch (e) {
      // On log mais on ne bloque pas la mise à jour
      // (le mail est une notification, pas une contrainte métier)
      // eslint-disable-next-line no-console
      console.error('Failed to send role change email', e);
    }

    return updated;
  }

  /**
   * Activer / désactiver un utilisateur
   */
  @Patch(':id/status')
  @Roles(UserRole.SUPERADMIN)
  @ApiOperation({
    summary: 'Toggle user active status (SUPERADMIN only)',
  })
  async updateUserStatus(
    @Param('id') id: string,
    @Body() dto: UpdateUserStatusDto,
  ) {
    const updated = await this.usersService.update(id, { isActive: dto.isActive });

    // Notifier l'utilisateur par email
    try {
      const subject = 'Your account status has been updated - RECCOS';
      const statusText = updated.isActive ? 'activated' : 'deactivated';
      const html = this.buildUserChangeEmailHtml(
        updated.email,
        `Your account status has been <strong>${statusText}</strong> by the RECCOS team.`,
      );
      const text = `Hello,\n\nYour RECCOS account status has been ${statusText}.\n\nIf you did not expect this change, please contact the RECCOS team.\n\nRECCOS`;

      await this.emailService.sendMail(updated.email, subject, html, text);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('Failed to send status change email', e);
    }

    return updated;
  }

  private buildUserChangeEmailHtml(email: string, mainLine: string): string {
    // Gabarit calqué sur l’email OTP (structure, couleurs), avec contenu adapté
    return `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Your account update</title>

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
              Your account has been updated
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
              Please review the change applied by the RECCOS team.
            </p>
          </td>
        </tr>

        <!-- Main Block (same dark block style as OTP) -->
        <tr>
          <td style="padding:0 0 20px;">
            <div style="
              width:100%;
              background:#2c2c2c;
              text-align:center;
              padding:15px 12px;
              border-radius: 10px;
              forced-color-adjust:none;
            ">
              <p style="
                margin:0;
                font-size:14px;
                color:#FFFFFF;
                font-weight:400;
                line-height:1.6;
              ">
                ${mainLine}
              </p>
            </div>
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
              If you did not request or expect this change, please contact the RECCOS support team so we can review your account activity.
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

  /**
   * Liste des utilisateurs (lecture seule, SUPERADMIN uniquement)
   */
  @Get()
  @Roles(UserRole.SUPERADMIN)
  @ApiOperation({
    summary: 'List all users (SUPERADMIN only)',
  })
  async listUsers() {
    return this.usersService.findAll();
  }

  /**
   * Récupérer les insights d'un utilisateur (investissements, activité)
   * L'endpoint retourne toujours une réponse valide, même si les données sont vides
   */
  @Get(':id/insights')
  @Roles(UserRole.SUPERADMIN)
  @ApiOperation({
    summary: 'Get user insights (investments, activity) - SUPERADMIN only',
  })
  async getUserInsights(@Param('id') id: string) {
    const user = await this.usersService.findOne(id);
    
    // Retourner toujours une réponse valide, même si l'utilisateur n'existe pas
    // Le frontend gère l'affichage des données vides
    return {
      stats: {
        totalInvestments: 0,
        investedAmount: 0,
        propertiesCount: 0,
        averageTicket: null,
        sessionsCount: null,
        lastLoginAt: user?.lastLoginAt ? user.lastLoginAt.toISOString() : null,
      },
      investments: [],
      activity: [],
    };
  }
}





