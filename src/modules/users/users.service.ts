import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../database/entities/user.entity';
import { DEFAULT_USER_ROLE } from '../../common/enums/user-role.enum';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async create(userData: Partial<User>): Promise<User> {
    const user = this.usersRepository.create({
      ...userData,
      isActive: false,
      emailVerified: false,
      role: userData.role || DEFAULT_USER_ROLE,
    });
    return this.usersRepository.save(user);
  }

  async findAll(): Promise<User[]> {
    return this.usersRepository.find({
      where: { deletedAt: null },
      select: ['id', 'email', 'firstName', 'lastName', 'isActive', 'role', 'createdAt'],
    });
  }

  async findOne(id: string): Promise<User> {
    const user = await this.usersRepository.findOne({
      where: { id, deletedAt: null },
    });
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({
      where: { email, deletedAt: null },
    });
  }

  async findByUsername(username: string): Promise<User | null> {
    return this.usersRepository.findOne({
      where: { username, deletedAt: null },
    });
  }

  async update(id: string, updateData: Partial<User>): Promise<User> {
    const user = await this.findOne(id);
    Object.assign(user, updateData);
    return this.usersRepository.save(user);
  }

  async remove(id: string): Promise<void> {
    const user = await this.findOne(id);
    await this.usersRepository.softDelete(user.id);
  }

  async updateLastLogin(id: string): Promise<void> {
    await this.usersRepository.update(id, {
      lastLoginAt: new Date(),
    });
  }

  async updateHeartbeat(id: string): Promise<void> {
    await this.usersRepository.update(id, {
      lastHeartbeatAt: new Date(),
    });
  }

  async setRefreshToken(id: string, refreshTokenHash: string, expiresAt: Date): Promise<void> {
    await this.usersRepository.update(id, {
      refreshTokenHash,
      refreshTokenExpiresAt: expiresAt,
      lastHeartbeatAt: new Date(),
    });
  }

  async clearRefreshToken(id: string): Promise<void> {
    await this.usersRepository.update(id, {
      refreshTokenHash: null,
      refreshTokenExpiresAt: null,
      lastHeartbeatAt: null,
    });
  }

  async findByRefreshTokenHash(hash: string): Promise<User | null> {
    return this.usersRepository.findOne({
      where: { refreshTokenHash: hash, deletedAt: null },
    });
  }

  async findByEmailVerificationToken(token: string): Promise<User | null> {
    return this.usersRepository.findOne({
      where: { emailVerificationToken: token },
    });
  }

  async findByPasswordResetToken(token: string): Promise<User | null> {
    return this.usersRepository.findOne({
      where: { passwordResetToken: token },
    });
  }

  async findByUaePassId(uaePassId: string): Promise<User | null> {
    return this.usersRepository.findOne({
      where: { uaePassId, deletedAt: null },
    });
  }

  async findByGoogleId(googleId: string): Promise<User | null> {
    return this.usersRepository.findOne({
      where: { googleId, deletedAt: null },
    });
  }

  async findByFacebookId(facebookId: string): Promise<User | null> {
    return this.usersRepository.findOne({
      where: { facebookId, deletedAt: null },
    });
  }

  async findByAppleId(appleId: string): Promise<User | null> {
    return this.usersRepository.findOne({
      where: { appleId, deletedAt: null },
    });
  }

  async save(user: User): Promise<User> {
    return this.usersRepository.save(user);
  }
}
