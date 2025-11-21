import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
  UploadedFiles,
  UseInterceptors,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { IdentityVerificationService } from './services/identity-verification.service';
import { UploadDocumentDto } from './dto/upload-document.dto';
import { VerifyFaceDto } from './dto/verify-face.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('identity-verification')
@ApiBearerAuth()
@Controller('identity-verification')
@UseGuards(JwtAuthGuard)
export class IdentityVerificationController {
  constructor(
    private readonly identityVerificationService: IdentityVerificationService,
  ) {}

  @Post('upload-document')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Upload identity document (Emirates ID or Passport)' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FilesInterceptor('files', 2))
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        documentType: {
          type: 'string',
          enum: ['emirates_id', 'passport'],
        },
        documentNumber: { type: 'string' },
        files: {
          type: 'array',
          items: { type: 'string', format: 'binary' },
        },
      },
    },
  })
  async uploadDocument(
    @CurrentUser() user: any,
    @Body() uploadDto: UploadDocumentDto,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    // TODO: Upload files to secure storage (S3, etc.) and get URLs
    const frontImageUrl = `https://storage.example.com/${files[0].filename}`;
    const backImageUrl = files[1] ? `https://storage.example.com/${files[1].filename}` : undefined;

    return this.identityVerificationService.uploadDocument(
      user.id,
      uploadDto,
      frontImageUrl,
      backImageUrl,
    );
  }

  @Post('upload-selfie')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Upload selfie for face verification' })
  @UseInterceptors(FilesInterceptor('file', 1))
  async uploadSelfie(
    @CurrentUser() user: any,
    @Body('documentId') documentId: string,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    const selfieImageUrl = `https://storage.example.com/${files[0].filename}`;
    return this.identityVerificationService.uploadSelfie(documentId, selfieImageUrl);
  }

  @Post('verify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify document and face match' })
  async verifyDocument(@Body('documentId') documentId: string) {
    return this.identityVerificationService.verifyDocumentAndFace(documentId);
  }

  @Get('status/:documentId')
  @ApiOperation({ summary: 'Get document verification status' })
  async getDocumentStatus(@Param('documentId') documentId: string) {
    return this.identityVerificationService.getDocumentStatus(documentId);
  }

  @Get('documents')
  @ApiOperation({ summary: 'Get all user documents' })
  async getUserDocuments(@CurrentUser() user: any) {
    return this.identityVerificationService.getUserDocuments(user.id);
  }

  @Get('kyc-status')
  @ApiOperation({ summary: 'Get KYC verification status' })
  async getKYCStatus(@CurrentUser() user: any) {
    return this.identityVerificationService.getKYCStatus(user.id);
  }
}
