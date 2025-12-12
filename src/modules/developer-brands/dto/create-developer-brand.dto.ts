import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateDeveloperBrandDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @IsString()
  @IsOptional()
  logoUrl?: string;
}


