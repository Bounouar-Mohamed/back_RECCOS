import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, Between, LessThanOrEqual, MoreThanOrEqual } from 'typeorm';
import { Property, PropertyStatus } from '../../database/entities/property.entity';
import { DeveloperBrand } from '../../database/entities/developer-brand.entity';
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
    @InjectRepository(DeveloperBrand)
    private developerBrandsRepository: Repository<DeveloperBrand>,
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
    const {
      developerId: dtoDeveloperId,
      status: dtoStatus,
      brandDeveloperId,
      availableAt: availableAtString,
      ...propertyData
    } = createPropertyDto;
    const developerId = dtoDeveloperId || creatorId;
    let brandDeveloperIdValue: string | null = null;

    if (brandDeveloperId) {
      brandDeveloperIdValue = await this.assertBrandExists(brandDeveloperId);
    }

    // Convertir availableAt de string à Date
    let availableAtDate: Date | null = null;
    if (availableAtString && availableAtString !== '') {
      const parsedDate = new Date(availableAtString);
      if (!isNaN(parsedDate.getTime())) {
        availableAtDate = parsedDate;
      }
    }

    const canOverrideStatus =
      (creatorRole === UserRole.ADMIN || creatorRole === UserRole.SUPERADMIN) && dtoStatus;

    const property = this.propertiesRepository.create({
      ...propertyData,
      developerId,
      brandDeveloperId: brandDeveloperIdValue,
      availableAt: availableAtDate,
      // ADMIN ou SUPERADMIN peuvent choisir le statut initial sinon DRAFT
      status: canOverrideStatus ? dtoStatus : PropertyStatus.DRAFT,
    });

    this.ensureAvailabilityStatus(property);

    return this.propertiesRepository.save(property);
  }

  /**
   * Lister les annonces avec filtres
   * - CLIENT : voit uniquement les annonces PUBLISHED
   * - ADMIN : voit ses propres annonces
   * - SUPERADMIN : voit toutes les annonces
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
    if (userRole === UserRole.ADMIN && userId) {
      // ADMIN voit ses propres annonces
      where.developerId = userId;
    }
    // SUPERADMIN voit tout (pas de filtre)

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

    const queryBuilder = this.propertiesRepository.createQueryBuilder('property');

    if (userRole === UserRole.CLIENT) {
      const clientVisibleStatuses = [PropertyStatus.PUBLISHED, PropertyStatus.UPCOMING];
      if (filters.status && clientVisibleStatuses.includes(filters.status)) {
        queryBuilder.andWhere('property.status = :clientStatus', {
          clientStatus: filters.status,
        });
      } else {
        queryBuilder.andWhere('property.status IN (:...clientStatuses)', {
          clientStatuses: clientVisibleStatuses,
        });
      }
    }

    // Appliquer les conditions where
    Object.keys(where).forEach((key) => {
      if (where[key] !== undefined) {
        queryBuilder.andWhere(`property.${key} = :${key}`, { [key]: where[key] });
      }
    });

    if (filters.zone) {
      const zoneValue = filters.zone.trim().toLowerCase();
      if (zoneValue.length > 0) {
        queryBuilder.andWhere('LOWER(property.zone) LIKE :zoneFilter', {
          zoneFilter: `%${zoneValue}%`,
        });
      }
    }

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

    // Recherche textuelle (titre / zone)
    if (filters.search) {
      const likeValue = `%${filters.search.toLowerCase()}%`;
      queryBuilder.andWhere(
        '(LOWER(property.title) LIKE :search OR LOWER(property.zone) LIKE :search)',
        { search: likeValue },
      );
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
      .leftJoinAndSelect('property.brandDeveloper', 'brandDeveloper')
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
      relations: ['developer', 'publishedBy', 'brandDeveloper'],
    });

    if (!property) {
      throw new NotFoundException(`Property with ID ${id} not found`);
    }

    // Vérifier les permissions
    if (userRole === UserRole.CLIENT) {
      if (property.status === PropertyStatus.UPCOMING) {
        throw new ForbiddenException(
          'This property is not yet available for investment. Please wait until the countdown ends.',
        );
      }
      if (property.status !== PropertyStatus.PUBLISHED) {
        throw new ForbiddenException('This property is not available');
      }
      if (!this.isAvailableNow(property.availableAt)) {
        throw new ForbiddenException(
          'This property is not yet available for investment. Please wait until the countdown ends.',
        );
      }
    }

    // Pour ADMIN, la restriction de visibilité détaillée est gérée au niveau des listes

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
      relations: ['developer', 'publishedBy', 'brandDeveloper'],
    });

    if (!propertyRaw) {
      throw new NotFoundException(`Property with ID ${id} not found`);
    }

    // ADMIN ne peut modifier que ses propres annonces en DRAFT, PENDING ou REJECTED
    if (userRole === UserRole.ADMIN) {
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
      // ADMIN ne peut pas changer le status sur ses propres annonces
      delete updatePropertyDto.status;
      delete updatePropertyDto.rejectionReason;
    }

    // SUPERADMIN peut tout modifier, y compris le status
    if (userRole === UserRole.SUPERADMIN && updatePropertyDto.status) {
      if (updatePropertyDto.status === PropertyStatus.PUBLISHED) {
        propertyRaw.publishedAt = new Date();
        propertyRaw.publishedById = userId;
      }
    }

    let brandDeveloperIdValue: string | null | undefined;
    if (updatePropertyDto.brandDeveloperId !== undefined) {
      brandDeveloperIdValue = await this.assertBrandExists(updatePropertyDto.brandDeveloperId);
      delete updatePropertyDto.brandDeveloperId;
    }

    // Gérer explicitement availableAt pour la conversion string -> Date
    if (updatePropertyDto.availableAt !== undefined) {
      if (updatePropertyDto.availableAt === null || updatePropertyDto.availableAt === '') {
        propertyRaw.availableAt = null;
      } else {
        const parsedDate = new Date(updatePropertyDto.availableAt);
        if (!isNaN(parsedDate.getTime())) {
          propertyRaw.availableAt = parsedDate;
        }
      }
      delete updatePropertyDto.availableAt;
    }

    Object.assign(propertyRaw, updatePropertyDto);

    if (brandDeveloperIdValue !== undefined) {
      propertyRaw.brandDeveloperId = brandDeveloperIdValue;
    }

    this.ensureAvailabilityStatus(propertyRaw);

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

    if (property.status === PropertyStatus.PUBLISHED || property.status === PropertyStatus.UPCOMING) {
      throw new BadRequestException('Property is already published');
    }

    if (property.status === PropertyStatus.SOLD) {
      throw new BadRequestException('Cannot publish a sold property');
    }

    property.status = PropertyStatus.PUBLISHED;
    property.publishedById = adminId;
    this.ensureAvailabilityStatus(property);

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

    // ADMIN ne peut supprimer que ses propres annonces non publiées
    if (userRole === UserRole.ADMIN) {
      if (propertyRaw.developerId !== userId) {
        throw new ForbiddenException('You can only delete your own properties');
      }
      if (
        propertyRaw.status === PropertyStatus.PUBLISHED ||
        propertyRaw.status === PropertyStatus.UPCOMING ||
        propertyRaw.status === PropertyStatus.SOLD
      ) {
        throw new ForbiddenException('Cannot delete published or sold properties');
      }
    }

    await this.propertiesRepository.softDelete(propertyRaw.id);
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async releaseUpcomingProperties(): Promise<void> {
    const now = new Date();
    const propertiesToPublish = await this.propertiesRepository
      .createQueryBuilder('property')
      .where('property.status = :status', { status: PropertyStatus.UPCOMING })
      .andWhere('property.availableAt IS NOT NULL')
      .andWhere('property.availableAt <= :now', { now })
      .getMany();

    if (!propertiesToPublish.length) {
      return;
    }

    for (const property of propertiesToPublish) {
      property.status = PropertyStatus.PUBLISHED;
      property.publishedAt = property.availableAt ?? new Date();
      this.ensureAvailabilityStatus(property);
    }

    await this.propertiesRepository.save(propertiesToPublish);
  }

  private async assertBrandExists(brandDeveloperId: string): Promise<string> {
    const brand = await this.developerBrandsRepository.findOne({
      where: { id: brandDeveloperId },
    });
    if (!brand) {
      throw new BadRequestException('Developer brand not found');
    }
    return brand.id;
  }

  private isAvailableNow(availableAt?: Date | null): boolean {
    if (!availableAt) {
      return true;
    }
    return availableAt.getTime() <= Date.now();
  }

  private ensureAvailabilityStatus(property: Property): void {
    if (!property) {
      return;
    }

    if (
      property.status === PropertyStatus.PUBLISHED ||
      property.status === PropertyStatus.UPCOMING
    ) {
      const isLive = this.isAvailableNow(property.availableAt);
      if (isLive) {
        property.status = PropertyStatus.PUBLISHED;
        if (!property.publishedAt) {
          property.publishedAt = new Date();
        }
      } else {
        property.status = PropertyStatus.UPCOMING;
        if (!property.publishedAt && property.availableAt) {
          property.publishedAt = property.availableAt;
        }
      }
    }
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

