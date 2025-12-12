import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DeveloperBrand } from '../../database/entities/developer-brand.entity';
import { DeveloperBrandsService } from './developer-brands.service';
import { DeveloperBrandsController } from './developer-brands.controller';

@Module({
  imports: [TypeOrmModule.forFeature([DeveloperBrand])],
  controllers: [DeveloperBrandsController],
  providers: [DeveloperBrandsService],
  exports: [DeveloperBrandsService],
})
export class DeveloperBrandsModule {}


