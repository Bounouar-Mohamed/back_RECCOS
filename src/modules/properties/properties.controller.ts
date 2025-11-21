import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { PropertiesService } from './properties.service';
import { CreatePropertyDto } from './dto/create-property.dto';
import { UpdatePropertyDto } from './dto/update-property.dto';
import { FilterPropertyDto } from './dto/filter-property.dto';
import { PublishPropertyDto } from './dto/publish-property.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/guards/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '../../common/enums/user-role.enum';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';

@ApiTags('properties')
@Controller('properties')
export class PropertiesController {
  constructor(private readonly propertiesService: PropertiesService) {}

  /**
   * Créer une nouvelle annonce (DEVELOPER ou ADMIN)
   */
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.DEVELOPER, UserRole.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new property listing (DEVELOPER or ADMIN)' })
  @ApiResponse({ status: 201, description: 'Property created successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - Only developers or admins can create properties' })
  async create(
    @Body() createPropertyDto: CreatePropertyDto,
    @CurrentUser() user: any,
  ) {
    return this.propertiesService.create(createPropertyDto, user.id, user.role);
  }

  /**
   * Lister les annonces avec filtres
   * - CLIENT : voit uniquement les PUBLISHED
   * - DEVELOPER : voit ses propres annonces
   * - ADMIN : voit toutes les annonces
   */
  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List all properties with filters' })
  @ApiResponse({ status: 200, description: 'Properties retrieved successfully' })
  async findAll(
    @Query() filters: FilterPropertyDto,
    @CurrentUser() user: any,
  ) {
    return this.propertiesService.findAll(filters, user.role, user.id);
  }

  /**
   * Obtenir les détails d'une annonce
   */
  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get property details by ID' })
  @ApiResponse({ status: 200, description: 'Property retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Property not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - Property not available' })
  async findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.propertiesService.findOne(id, user.role, user.id);
  }

  /**
   * Mettre à jour une annonce
   * - DEVELOPER : peut modifier ses propres annonces (DRAFT, PENDING, REJECTED)
   * - ADMIN : peut modifier toutes les annonces
   */
  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.DEVELOPER, UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a property' })
  @ApiResponse({ status: 200, description: 'Property updated successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async update(
    @Param('id') id: string,
    @Body() updatePropertyDto: UpdatePropertyDto,
    @CurrentUser() user: any,
  ) {
    return this.propertiesService.update(id, updatePropertyDto, user.role, user.id);
  }

  /**
   * Publier une annonce (ADMIN uniquement)
   */
  @Post(':id/publish')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Publish a property (ADMIN only)' })
  @ApiResponse({ status: 200, description: 'Property published successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - Only admins can publish' })
  async publish(
    @Param('id') id: string,
    @Body() publishDto: PublishPropertyDto,
    @CurrentUser() user: any,
  ) {
    return this.propertiesService.publish(id, user.id);
  }

  /**
   * Rejeter une annonce (ADMIN uniquement)
   */
  @Post(':id/reject')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Reject a property (ADMIN only)' })
  @ApiResponse({ status: 200, description: 'Property rejected successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - Only admins can reject' })
  async reject(
    @Param('id') id: string,
    @Body('reason') reason: string,
    @CurrentUser() user: any,
  ) {
    return this.propertiesService.reject(id, user.id, reason);
  }

  /**
   * Supprimer une annonce (soft delete)
   */
  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.DEVELOPER, UserRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a property' })
  @ApiResponse({ status: 204, description: 'Property deleted successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async remove(@Param('id') id: string, @CurrentUser() user: any) {
    await this.propertiesService.remove(id, user.role, user.id);
  }

  /**
   * Obtenir les statistiques (ADMIN uniquement)
   */
  @Get('admin/stats')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get property statistics (ADMIN only)' })
  @ApiResponse({ status: 200, description: 'Statistics retrieved successfully' })
  async getStats() {
    return this.propertiesService.getStats();
  }
}

