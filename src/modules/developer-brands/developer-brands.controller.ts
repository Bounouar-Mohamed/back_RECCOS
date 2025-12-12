import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { DeveloperBrandsService } from './developer-brands.service';
import { CreateDeveloperBrandDto } from './dto/create-developer-brand.dto';
import { UpdateDeveloperBrandDto } from './dto/update-developer-brand.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/guards/roles.decorator';
import { UserRole } from '../../common/enums/user-role.enum';

@Controller('developer-brands')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
export class DeveloperBrandsController {
  constructor(private readonly developerBrandsService: DeveloperBrandsService) {}

  @Get()
  findAll() {
    return this.developerBrandsService.findAll();
  }

  @Post()
  create(@Body() dto: CreateDeveloperBrandDto) {
    return this.developerBrandsService.create(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateDeveloperBrandDto) {
    return this.developerBrandsService.update(id, dto);
  }
}


