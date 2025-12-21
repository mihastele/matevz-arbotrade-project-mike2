import { Injectable, NotFoundException, ConflictException, OnModuleInit, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { User, UserRole } from './entities/user.entity';
import { Address } from './entities/address.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { CreateAddressDto } from './dto/create-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';

@Injectable()
export class UsersService implements OnModuleInit {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(Address)
    private addressesRepository: Repository<Address>,
    private configService: ConfigService,
  ) {}

  async onModuleInit() {
    await this.createAdminIfNotExists();
  }

  private async createAdminIfNotExists() {
    const adminSetupKey = this.configService.get<string>('ADMIN_SETUP_KEY');
    const adminEmail = this.configService.get<string>('ADMIN_EMAIL');
    const adminPassword = this.configService.get<string>('ADMIN_PASSWORD');
    const adminFirstName = this.configService.get<string>('ADMIN_FIRST_NAME', 'Admin');
    const adminLastName = this.configService.get<string>('ADMIN_LAST_NAME', 'User');

    // Only create admin if setup key is provided and valid
    if (!adminSetupKey || adminSetupKey === 'your-secure-admin-setup-key-change-this') {
      this.logger.warn('Admin setup key not configured or using default value. Skipping admin user creation.');
      return;
    }

    if (!adminEmail || !adminPassword) {
      this.logger.warn('Admin email or password not configured. Skipping admin user creation.');
      return;
    }

    try {
      // Check if admin user already exists
      const existingAdmin = await this.usersRepository.findOne({
        where: { email: adminEmail },
      });

      if (existingAdmin) {
        this.logger.log(`Admin user already exists: ${adminEmail}`);
        
        // Update role to admin if it's not already
        if (existingAdmin.role !== UserRole.ADMIN) {
          existingAdmin.role = UserRole.ADMIN;
          await this.usersRepository.save(existingAdmin);
          this.logger.log(`Updated user ${adminEmail} to admin role`);
        }
        return;
      }

      // Create admin user
      const hashedPassword = await bcrypt.hash(adminPassword, 10);
      const adminUser = this.usersRepository.create({
        email: adminEmail,
        password: hashedPassword,
        firstName: adminFirstName,
        lastName: adminLastName,
        role: UserRole.ADMIN,
      });

      await this.usersRepository.save(adminUser);
      this.logger.log(`✅ Admin user created successfully: ${adminEmail}`);
      this.logger.warn('⚠️  IMPORTANT: Please change the default admin password immediately!');
    } catch (error) {
      this.logger.error('Failed to create admin user:', error.message);
    }
  }

  async create(createUserDto: CreateUserDto): Promise<User> {
    const existingUser = await this.usersRepository.findOne({
      where: { email: createUserDto.email },
    });
    if (existingUser) {
      throw new ConflictException('Email already in use');
    }

    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
    const user = this.usersRepository.create({
      ...createUserDto,
      password: hashedPassword,
    });
    return this.usersRepository.save(user);
  }

  async findAll(): Promise<User[]> {
    return this.usersRepository.find({
      relations: ['addresses'],
    });
  }

  async findOne(id: string): Promise<User> {
    const user = await this.usersRepository.findOne({
      where: { id },
      relations: ['addresses'],
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({
      where: { email },
      relations: ['addresses'],
    });
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.findOne(id);
    
    if (updateUserDto.password) {
      updateUserDto.password = await bcrypt.hash(updateUserDto.password, 10);
    }
    
    Object.assign(user, updateUserDto);
    return this.usersRepository.save(user);
  }

  async remove(id: string): Promise<void> {
    const user = await this.findOne(id);
    await this.usersRepository.remove(user);
  }

  // Address methods
  async createAddress(userId: string, createAddressDto: CreateAddressDto): Promise<Address> {
    const user = await this.findOne(userId);
    
    // If this is the first address or marked as default, update others
    if (createAddressDto.isDefault) {
      await this.addressesRepository.update(
        { userId, type: createAddressDto.type },
        { isDefault: false },
      );
    }

    const address = this.addressesRepository.create({
      ...createAddressDto,
      userId: user.id,
    });
    return this.addressesRepository.save(address);
  }

  async findAllAddresses(userId: string): Promise<Address[]> {
    return this.addressesRepository.find({
      where: { userId },
      order: { isDefault: 'DESC', createdAt: 'DESC' },
    });
  }

  async findAddress(userId: string, addressId: string): Promise<Address> {
    const address = await this.addressesRepository.findOne({
      where: { id: addressId, userId },
    });
    if (!address) {
      throw new NotFoundException('Address not found');
    }
    return address;
  }

  async updateAddress(
    userId: string,
    addressId: string,
    updateAddressDto: UpdateAddressDto,
  ): Promise<Address> {
    const address = await this.findAddress(userId, addressId);
    
    if (updateAddressDto.isDefault) {
      await this.addressesRepository.update(
        { userId, type: address.type },
        { isDefault: false },
      );
    }
    
    Object.assign(address, updateAddressDto);
    return this.addressesRepository.save(address);
  }

  async removeAddress(userId: string, addressId: string): Promise<void> {
    const address = await this.findAddress(userId, addressId);
    await this.addressesRepository.remove(address);
  }

  async validatePassword(user: User, password: string): Promise<boolean> {
    return bcrypt.compare(password, user.password);
  }
}
