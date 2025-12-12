import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateDeveloperBrandDto {
  @IsString()
  @IsOptional()
  @MaxLength(255)
  name?: string;

  @IsString()
  @IsOptional()
  logoUrl?: string | null;
}



