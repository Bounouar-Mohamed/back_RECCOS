import { IsString, IsNumber, IsEmail, Min, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreatePurchaseDto {
  @ApiProperty({ description: 'Email of the buyer' })
  @IsEmail()
  email: string;

  @ApiProperty({ description: 'Property ID' })
  @IsString()
  propertyId: string;

  @ApiProperty({ description: 'Number of shares to purchase', minimum: 1 })
  @IsNumber()
  @Min(1)
  shares: number;

  @ApiProperty({ description: 'Total amount in currency', minimum: 0 })
  @IsNumber()
  @Min(0)
  totalAmount: number;

  @ApiProperty({ description: 'Currency code', default: 'AED' })
  @IsString()
  @IsOptional()
  currency?: string;

  @ApiProperty({ description: 'Property title for email' })
  @IsString()
  @IsOptional()
  propertyTitle?: string;

  @ApiProperty({ description: 'Property location for email' })
  @IsString()
  @IsOptional()
  propertyLocation?: string;

  @ApiProperty({ description: 'Property image URL for email' })
  @IsString()
  @IsOptional()
  propertyImage?: string;

  @ApiProperty({ description: 'Locale for email content', default: 'en' })
  @IsString()
  @IsOptional()
  locale?: string;
}

