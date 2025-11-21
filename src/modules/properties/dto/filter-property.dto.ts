import { IsEnum, IsOptional, IsNumber, Min, Max, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { PropertyType, Emirates, PropertyStatus } from '../../../database/entities/property.entity';

export class FilterPropertyDto {
  @IsEnum(PropertyType)
  @IsOptional()
  propertyType?: PropertyType;

  @IsEnum(Emirates)
  @IsOptional()
  emirate?: Emirates;

  @IsEnum(PropertyStatus)
  @IsOptional()
  status?: PropertyStatus;

  @IsString()
  @IsOptional()
  zone?: string;

  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  @Min(0)
  minPrice?: number;

  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  @Min(0)
  maxPrice?: number;

  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  @Min(0)
  minArea?: number;

  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  @Min(0)
  maxArea?: number;

  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  @Min(0)
  bedrooms?: number;

  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  @Min(1)
  @Max(100)
  page?: number = 1;

  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  // Filtres additionnels
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  @Min(0)
  minRentalYield?: number;

  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  @Min(0)
  maxRentalYield?: number;

  @IsString()
  @IsOptional()
  completionStatus?: string;

  @IsString()
  @IsOptional()
  listingType?: string;

  @IsString()
  @IsOptional()
  furnishingStatus?: string;

  @IsString()
  @IsOptional()
  view?: string;

  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  @Min(0)
  maxDistanceToMetro?: number;

  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  @Min(0)
  maxDistanceToBeach?: number;
}

