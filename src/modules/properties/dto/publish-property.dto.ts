import { IsOptional, IsString } from 'class-validator';

export class PublishPropertyDto {
  @IsString()
  @IsOptional()
  notes?: string;
}
















