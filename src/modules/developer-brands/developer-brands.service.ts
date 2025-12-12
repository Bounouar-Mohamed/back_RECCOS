import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DeveloperBrand } from '../../database/entities/developer-brand.entity';
import { CreateDeveloperBrandDto } from './dto/create-developer-brand.dto';
import { UpdateDeveloperBrandDto } from './dto/update-developer-brand.dto';

@Injectable()
export class DeveloperBrandsService {
  constructor(
    @InjectRepository(DeveloperBrand)
    private readonly developerBrandsRepository: Repository<DeveloperBrand>,
  ) {}

  findAll(): Promise<DeveloperBrand[]> {
    return this.developerBrandsRepository.find({
      order: { name: 'ASC' },
    });
  }

  async create(dto: CreateDeveloperBrandDto): Promise<DeveloperBrand> {
    const name = dto.name.trim();
    if (!name) {
      throw new BadRequestException('Developer name is required');
    }

    const existing = await this.developerBrandsRepository.findOne({
      where: { name },
      withDeleted: true,
    });

    if (existing) {
      if (existing.deletedAt) {
        await this.developerBrandsRepository.restore(existing.id);
        existing.logoUrl = dto.logoUrl ?? existing.logoUrl;
        existing.name = name;
        return this.developerBrandsRepository.save(existing);
      }
      throw new BadRequestException('A developer with this name already exists');
    }

    const developer = this.developerBrandsRepository.create({
      name,
      logoUrl: dto.logoUrl ?? null,
    });
    return this.developerBrandsRepository.save(developer);
  }

  async update(id: string, dto: UpdateDeveloperBrandDto): Promise<DeveloperBrand> {
    const brand = await this.developerBrandsRepository.findOne({ where: { id } });
    if (!brand) {
      throw new BadRequestException('Developer brand not found');
    }

    if (dto.name !== undefined) {
      const trimmed = dto.name.trim();
      if (!trimmed) {
        throw new BadRequestException('Developer name is required');
      }

      const existing = await this.developerBrandsRepository.findOne({
        where: { name: trimmed },
      });

      if (existing && existing.id !== id) {
        throw new BadRequestException('A developer with this name already exists');
      }
      brand.name = trimmed;
    }

    if (dto.logoUrl !== undefined) {
      brand.logoUrl = dto.logoUrl ?? null;
    }

    return this.developerBrandsRepository.save(brand);
  }
}


