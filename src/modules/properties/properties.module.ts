import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PropertiesService } from './properties.service';
import { PropertiesController } from './properties.controller';
import { Property } from '../../database/entities/property.entity';
import { DeveloperBrand } from '../../database/entities/developer-brand.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Property, DeveloperBrand])],
  controllers: [PropertiesController],
  providers: [PropertiesService],
  exports: [PropertiesService],
})
export class PropertiesModule {}
















