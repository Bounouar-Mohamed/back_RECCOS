import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, Between, LessThanOrEqual, MoreThanOrEqual } from 'typeorm';
import { Property, PropertyStatus } from '../../database/entities/property.entity';
import { UserRole } from '../../common/enums/user-role.enum';
import { CreatePropertyDto } from './dto/create-property.dto';
import { UpdatePropertyDto } from './dto/update-property.dto';
import { FilterPropertyDto } from './dto/filter-property.dto';
import { toPropertyResponseDto, PropertyResponseDto } from './dto/property-response.dto';

@Injectable()
export class PropertiesService {
  constructor(
    @InjectRepository(Property)
    private propertiesRepository: Repository<Property>,
  ) {}

  /**
   * Créer une nouvelle annonce (DEVELOPER ou ADMIN)
   */
  async create(
    createPropertyDto: CreatePropertyDto,
    creatorId: string,
    creatorRole: UserRole,
  ): Promise<Property> {
    // Si ADMIN crée, il peut définir un DEVELOPER différent
    // Sinon, le créateur devient le DEVELOPER
    const { developerId: dtoDeveloperId, status: dtoStatus, ...propertyData } = createPropertyDto;
    const developerId = dtoDeveloperId || creatorId;

    const property = this.propertiesRepository.create({
      ...propertyData,
      developerId,
      // ADMIN peut créer directement en PENDING si souhaité
      status:
        creatorRole === UserRole.ADMIN && dtoStatus
          ? dtoStatus
          : PropertyStatus.DRAFT,
    });

    return this.propertiesRepository.save(property);
  }

  /**
   * Lister les annonces avec filtres
   * - CLIENT : voit uniquement les annonces PUBLISHED
   * - DEVELOPER : voit ses propres annonces
   * - ADMIN : voit toutes les annonces
   */
  async findAll(
    filters: FilterPropertyDto,
    userRole: UserRole,
    userId?: string,
  ): Promise<{ properties: PropertyResponseDto[]; total: number; page: number; limit: number }> {
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const skip = (page - 1) * limit;

    const where: FindOptionsWhere<Property> = {};

    // Filtres selon le rôle
    if (userRole === UserRole.CLIENT) {
      // CLIENT voit uniquement les annonces publiées
      where.status = PropertyStatus.PUBLISHED;
    } else if (userRole === UserRole.DEVELOPER && userId) {
      // DEVELOPER voit ses propres annonces
      where.developerId = userId;
    }
    // ADMIN voit tout (pas de filtre)

    // Appliquer les filtres de recherche
    if (filters.propertyType) {
      where.propertyType = filters.propertyType;
    }

    if (filters.emirate) {
      where.emirate = filters.emirate;
    }

    if (filters.status && userRole !== UserRole.CLIENT) {
      // CLIENT ne peut pas filtrer par status
      where.status = filters.status;
    }

    if (filters.zone) {
      where.zone = filters.zone;
    }

    const queryBuilder = this.propertiesRepository.createQueryBuilder('property');

    // Appliquer les conditions where
    Object.keys(where).forEach((key) => {
      if (where[key] !== undefined) {
        queryBuilder.andWhere(`property.${key} = :${key}`, { [key]: where[key] });
      }
    });

    // Filtres de prix
    if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
      if (filters.minPrice !== undefined && filters.maxPrice !== undefined) {
        queryBuilder.andWhere('property.pricePerShare BETWEEN :minPrice AND :maxPrice', {
          minPrice: filters.minPrice,
          maxPrice: filters.maxPrice,
        });
      } else if (filters.minPrice !== undefined) {
        queryBuilder.andWhere('property.pricePerShare >= :minPrice', {
          minPrice: filters.minPrice,
        });
      } else if (filters.maxPrice !== undefined) {
        queryBuilder.andWhere('property.pricePerShare <= :maxPrice', {
          maxPrice: filters.maxPrice,
        });
      }
    }

    // Filtres de superficie
    if (filters.minArea !== undefined || filters.maxArea !== undefined) {
      if (filters.minArea !== undefined && filters.maxArea !== undefined) {
        queryBuilder.andWhere('property.totalArea BETWEEN :minArea AND :maxArea', {
          minArea: filters.minArea,
          maxArea: filters.maxArea,
        });
      } else if (filters.minArea !== undefined) {
        queryBuilder.andWhere('property.totalArea >= :minArea', {
          minArea: filters.minArea,
        });
      } else if (filters.maxArea !== undefined) {
        queryBuilder.andWhere('property.totalArea <= :maxArea', {
          maxArea: filters.maxArea,
        });
      }
    }

    // Filtre nombre de chambres
    if (filters.bedrooms !== undefined) {
      queryBuilder.andWhere('property.bedrooms = :bedrooms', {
        bedrooms: filters.bedrooms,
      });
    }

    // Filtres additionnels
    if (filters.minRentalYield !== undefined || filters.maxRentalYield !== undefined) {
      if (filters.minRentalYield !== undefined && filters.maxRentalYield !== undefined) {
        queryBuilder.andWhere('property.rentalYield BETWEEN :minRentalYield AND :maxRentalYield', {
          minRentalYield: filters.minRentalYield,
          maxRentalYield: filters.maxRentalYield,
        });
      } else if (filters.minRentalYield !== undefined) {
        queryBuilder.andWhere('property.rentalYield >= :minRentalYield', {
          minRentalYield: filters.minRentalYield,
        });
      } else if (filters.maxRentalYield !== undefined) {
        queryBuilder.andWhere('property.rentalYield <= :maxRentalYield', {
          maxRentalYield: filters.maxRentalYield,
        });
      }
    }

    if (filters.completionStatus) {
      queryBuilder.andWhere('property.completionStatus = :completionStatus', {
        completionStatus: filters.completionStatus,
      });
    }

    if (filters.listingType) {
      queryBuilder.andWhere('property.listingType = :listingType', {
        listingType: filters.listingType,
      });
    }

    if (filters.furnishingStatus) {
      queryBuilder.andWhere('property.furnishingStatus = :furnishingStatus', {
        furnishingStatus: filters.furnishingStatus,
      });
    }

    if (filters.view) {
      queryBuilder.andWhere('property.view = :view', {
        view: filters.view,
      });
    }

    if (filters.maxDistanceToMetro !== undefined) {
      queryBuilder.andWhere('property.distanceToMetro <= :maxDistanceToMetro', {
        maxDistanceToMetro: filters.maxDistanceToMetro,
      });
    }

    if (filters.maxDistanceToBeach !== undefined) {
      queryBuilder.andWhere('property.distanceToBeach <= :maxDistanceToBeach', {
        maxDistanceToBeach: filters.maxDistanceToBeach,
      });
    }

    // Compter le total
    const total = await queryBuilder.getCount();

    // Récupérer les résultats avec pagination
    const properties = await queryBuilder
      .leftJoinAndSelect('property.developer', 'developer')
      .leftJoinAndSelect('property.publishedBy', 'publishedBy')
      .orderBy('property.createdAt', 'DESC')
      .skip(skip)
      .take(limit)
      .getMany();

    // Transformer pour exclure les informations de contact du DEVELOPER
    const propertiesResponse = properties.map(toPropertyResponseDto);

    return {
      properties: propertiesResponse,
      total,
      page,
      limit,
    };
  }

  /**
   * Trouver une annonce par ID
   * Retourne les informations du DEVELOPER mais SANS les contacts directs
   */
  async findOne(id: string, userRole: UserRole, userId?: string): Promise<PropertyResponseDto> {
    const property = await this.propertiesRepository.findOne({
      where: { id },
      relations: ['developer', 'publishedBy'],
    });

    if (!property) {
      throw new NotFoundException(`Property with ID ${id} not found`);
    }

    // Vérifier les permissions
    if (userRole === UserRole.CLIENT && property.status !== PropertyStatus.PUBLISHED) {
      throw new ForbiddenException('This property is not available');
    }

    if (
      userRole === UserRole.DEVELOPER &&
      property.developerId !== userId &&
      property.status !== PropertyStatus.PUBLISHED
    ) {
      throw new ForbiddenException('You can only view your own properties');
    }

    // Transformer pour exclure les informations de contact du DEVELOPER
    return toPropertyResponseDto(property);
  }

  /**
   * Mettre à jour une annonce (DEVELOPER pour ses propres annonces, ADMIN pour toutes)
   */
  async update(
    id: string,
    updatePropertyDto: UpdatePropertyDto,
    userRole: UserRole,
    userId: string,
  ): Promise<PropertyResponseDto> {
    // Récupérer la propriété brute pour vérifier les permissions
    const propertyRaw = await this.propertiesRepository.findOne({
      where: { id },
      relations: ['developer', 'publishedBy'],
    });

    if (!propertyRaw) {
      throw new NotFoundException(`Property with ID ${id} not found`);
    }

    // DEVELOPER ne peut modifier que ses propres annonces en DRAFT ou PENDING
    if (userRole === UserRole.DEVELOPER) {
      if (propertyRaw.developerId !== userId) {
        throw new ForbiddenException('You can only update your own properties');
      }
      if (
        propertyRaw.status !== PropertyStatus.DRAFT &&
        propertyRaw.status !== PropertyStatus.PENDING &&
        propertyRaw.status !== PropertyStatus.REJECTED
      ) {
        throw new ForbiddenException(
          'You can only update properties in DRAFT, PENDING, or REJECTED status',
        );
      }
      // DEVELOPER ne peut pas changer le status
      delete updatePropertyDto.status;
      delete updatePropertyDto.rejectionReason;
    }

    // ADMIN peut tout modifier
    if (userRole === UserRole.ADMIN && updatePropertyDto.status) {
      if (updatePropertyDto.status === PropertyStatus.PUBLISHED) {
        propertyRaw.publishedAt = new Date();
        propertyRaw.publishedById = userId;
      }
    }

    Object.assign(propertyRaw, updatePropertyDto);
    const updatedProperty = await this.propertiesRepository.save(propertyRaw);
    
    // Retourner la version transformée sans contacts
    return toPropertyResponseDto(updatedProperty);
  }

  /**
   * Publier une annonce (ADMIN uniquement)
   */
  async publish(id: string, adminId: string): Promise<Property> {
    const property = await this.propertiesRepository.findOne({ where: { id } });

    if (!property) {
      throw new NotFoundException(`Property with ID ${id} not found`);
    }

    if (property.status === PropertyStatus.PUBLISHED) {
      throw new BadRequestException('Property is already published');
    }

    if (property.status === PropertyStatus.SOLD) {
      throw new BadRequestException('Cannot publish a sold property');
    }

    property.status = PropertyStatus.PUBLISHED;
    property.publishedAt = new Date();
    property.publishedById = adminId;

    return this.propertiesRepository.save(property);
  }

  /**
   * Rejeter une annonce (ADMIN uniquement)
   */
  async reject(id: string, adminId: string, reason: string): Promise<Property> {
    const property = await this.propertiesRepository.findOne({ where: { id } });

    if (!property) {
      throw new NotFoundException(`Property with ID ${id} not found`);
    }

    property.status = PropertyStatus.REJECTED;
    property.rejectionReason = reason;

    return this.propertiesRepository.save(property);
  }

  /**
   * Supprimer une annonce (soft delete)
   */
  async remove(id: string, userRole: UserRole, userId: string): Promise<void> {
    // Récupérer la propriété brute pour vérifier les permissions
    const propertyRaw = await this.propertiesRepository.findOne({
      where: { id },
    });

    if (!propertyRaw) {
      throw new NotFoundException(`Property with ID ${id} not found`);
    }

    // DEVELOPER ne peut supprimer que ses propres annonces non publiées
    if (userRole === UserRole.DEVELOPER) {
      if (propertyRaw.developerId !== userId) {
        throw new ForbiddenException('You can only delete your own properties');
      }
      if (propertyRaw.status === PropertyStatus.PUBLISHED || propertyRaw.status === PropertyStatus.SOLD) {
        throw new ForbiddenException('Cannot delete published or sold properties');
      }
    }

    await this.propertiesRepository.softDelete(propertyRaw.id);
  }

  /**
   * Obtenir les statistiques (ADMIN uniquement)
   */
  async getStats() {
    const total = await this.propertiesRepository.count();
    const byStatus = await this.propertiesRepository
      .createQueryBuilder('property')
      .select('property.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .groupBy('property.status')
      .getRawMany();

    const byEmirate = await this.propertiesRepository
      .createQueryBuilder('property')
      .select('property.emirate', 'emirate')
      .addSelect('COUNT(*)', 'count')
      .groupBy('property.emirate')
      .getRawMany();

    return {
      total,
      byStatus: byStatus.reduce((acc, item) => {
        acc[item.status] = parseInt(item.count);
        return acc;
      }, {}),
      byEmirate: byEmirate.reduce((acc, item) => {
        acc[item.emirate] = parseInt(item.count);
        return acc;
      }, {}),
    };
  }
}

