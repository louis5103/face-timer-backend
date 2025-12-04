import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UsersService } from './users.service';
import { User, UserStatus } from './entities/user.entity';
import * as bcrypt from 'bcrypt';
import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

// Mock bcrypt functions used in UsersService
jest.mock('bcrypt', () => ({
  __esModule: true, // This is important for default exports
  ...jest.requireActual('bcrypt'), // Keep actual bcrypt functions that are not mocked
  hash: jest.fn((password) => Promise.resolve(`hashed_${password}`)),
  compare: jest.fn((plain, hashed) => Promise.resolve(`hashed_${plain}` === hashed)),
}));

describe('UsersService', () => {
  let service: UsersService;
  let userRepository: Repository<User>;

  const mockUser: User = {
    id: 'test-user-id',
    email: 'test@example.com',
    password: 'hashed_password123',
    name: 'Test User',
    avatar: null,
    timezone: 'UTC',
    settings: {},
    status: UserStatus.ACTIVE,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: {
            create: jest.fn().mockImplementation((dto) => dto),
            save: jest.fn().mockImplementation((user: User) => Promise.resolve({ ...mockUser, ...user, id: user.id || 'new-id', createdAt: user.createdAt || new Date(), updatedAt: new Date() })),
            find: jest.fn().mockResolvedValue([mockUser]),
            findOne: jest.fn().mockResolvedValue(mockUser), // Default mock for findOne
            findOneBy: jest.fn().mockResolvedValue(mockUser), // For findByEmailWithPassword
            count: jest.fn().mockResolvedValue(1),
            softRemove: jest.fn().mockResolvedValue(undefined),
            createQueryBuilder: jest.fn().mockReturnValue({
              where: jest.fn().mockReturnThis(),
              addSelect: jest.fn().mockReturnThis(),
              getOne: jest.fn().mockResolvedValue(mockUser),
            }),
          },
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const createUserDto: CreateUserDto = {
      email: 'newuser@example.com',
      password: 'newpassword123',
      name: 'New User',
    };

    it('should create a new user', async () => {
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(null); // No existing user
      jest.spyOn(userRepository, 'save').mockImplementation((user) => Promise.resolve({ ...mockUser, id: 'new-id', ...user }));
      
      const result = await service.create(createUserDto);

      expect(bcrypt.hash).toHaveBeenCalledWith(createUserDto.password, service['saltRounds']);
      expect(userRepository.create).toHaveBeenCalledWith(expect.objectContaining({
        email: createUserDto.email,
        name: createUserDto.name,
        password: `hashed_${createUserDto.password}`,
      }));
      expect(userRepository.save).toHaveBeenCalled();
      expect(result).toHaveProperty('id');
      expect(result.email).toBe(createUserDto.email);
    });

    it('should throw ConflictException if email already exists', async () => {
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(mockUser); // Existing user found

      await expect(service.create(createUserDto)).rejects.toThrow(ConflictException);
      expect(userRepository.create).not.toHaveBeenCalled();
      expect(userRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should return an array of users', async () => {
      const users = [mockUser, { ...mockUser, id: 'user2', email: 'user2@example.com' }];
      jest.spyOn(userRepository, 'find').mockResolvedValue(users);

      const result = await service.findAll();
      expect(result).toEqual(users);
      expect(userRepository.find).toHaveBeenCalledWith({ order: { createdAt: 'DESC' } });
    });
  });

  describe('findOne', () => {
    it('should return a user if found', async () => {
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(mockUser);

      const result = await service.findOne(mockUser.id);
      expect(result).toEqual(mockUser);
      expect(userRepository.findOne).toHaveBeenCalledWith({ where: { id: mockUser.id } });
    });

    it('should throw NotFoundException if user not found', async () => {
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(null);

      await expect(service.findOne('non-existent-id')).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if id is null or undefined', async () => {
        await expect(service.findOne(null)).rejects.toThrow(BadRequestException);
        await expect(service.findOne(undefined)).rejects.toThrow(BadRequestException);
    });
  });

  describe('findByEmail', () => {
    it('should return a user if found by email', async () => {
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(mockUser);
      const result = await service.findByEmail(mockUser.email);
      expect(result).toEqual(mockUser);
      expect(userRepository.findOne).toHaveBeenCalledWith({ where: { email: mockUser.email } });
    });

    it('should return null if user not found by email', async () => {
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(null);
      const result = await service.findByEmail('nonexistent@example.com');
      expect(result).toBeNull();
    });

    it('should return null if email is null or undefined', async () => {
        const resultNull = await service.findByEmail(null);
        expect(resultNull).toBeNull();
        const resultUndefined = await service.findByEmail(undefined);
        expect(resultUndefined).toBeNull();
    });
  });

  describe('findByEmailWithPassword', () => {
    it('should return a user with password if found by email', async () => {
        const mockUserWithPassword = { ...mockUser, password: 'hashed_original_password' };
        jest.spyOn(userRepository, 'createQueryBuilder').mockReturnValue({
            where: jest.fn().mockReturnThis(),
            addSelect: jest.fn().mockReturnThis(),
            getOne: jest.fn().mockResolvedValue(mockUserWithPassword),
        } as any);

        const result = await service.findByEmailWithPassword(mockUser.email);
        expect(result).toEqual(mockUserWithPassword);
        expect(userRepository.createQueryBuilder).toHaveBeenCalledWith('user');
    });

    it('should return null if user not found by email with password', async () => {
        jest.spyOn(userRepository, 'createQueryBuilder').mockReturnValue({
            where: jest.fn().mockReturnThis(),
            addSelect: jest.fn().mockReturnThis(),
            getOne: jest.fn().mockResolvedValue(null),
        } as any);
        const result = await service.findByEmailWithPassword('nonexistent@example.com');
        expect(result).toBeNull();
    });

    it('should return null if email is null or undefined', async () => {
        const resultNull = await service.findByEmailWithPassword(null);
        expect(resultNull).toBeNull();
        const resultUndefined = await service.findByEmailWithPassword(undefined);
        expect(resultUndefined).toBeNull();
    });
  });


  describe('update', () => {
    const updateUserDto: UpdateUserDto = { name: 'Updated Name' };

    it('should update an existing user', async () => {
      jest.spyOn(service, 'findOne').mockResolvedValue(mockUser);
      jest.spyOn(userRepository, 'save').mockResolvedValue({ ...mockUser, ...updateUserDto });

      const result = await service.update(mockUser.id, updateUserDto);
      expect(service.findOne).toHaveBeenCalledWith(mockUser.id);
      expect(userRepository.save).toHaveBeenCalledWith(expect.objectContaining({ ...mockUser, ...updateUserDto }));
      expect(result.name).toBe(updateUserDto.name);
    });

    it('should update password if provided', async () => {
        const updatePasswordDto: UpdateUserDto = { password: 'newSecurePassword' };
        jest.spyOn(service, 'findOne').mockResolvedValue(mockUser);
        jest.spyOn(userRepository, 'save').mockResolvedValue({ ...mockUser, password: 'hashed_newSecurePassword' });

        const result = await service.update(mockUser.id, updatePasswordDto);
        expect(bcrypt.hash).toHaveBeenCalledWith(updatePasswordDto.password, service['saltRounds']);
        expect(result.password).toBe('hashed_newSecurePassword');
    });

    it('should throw ConflictException if updated email already exists for another user', async () => {
      const existingUserWithNewEmail = { ...mockUser, id: 'other-user-id', email: 'other@example.com' };
      const updateUserEmailDto: UpdateUserDto = { email: 'other@example.com' };

      jest.spyOn(service, 'findOne').mockResolvedValue(mockUser); // Original user
      jest.spyOn(service, 'findByEmail').mockResolvedValue(existingUserWithNewEmail); // Email already taken

      await expect(service.update(mockUser.id, updateUserEmailDto)).rejects.toThrow(ConflictException);
      expect(userRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('should soft remove a user', async () => {
      jest.spyOn(service, 'findOne').mockResolvedValue(mockUser);
      jest.spyOn(userRepository, 'softRemove').mockResolvedValue(mockUser);

      await service.remove(mockUser.id);
      expect(service.findOne).toHaveBeenCalledWith(mockUser.id);
      expect(userRepository.softRemove).toHaveBeenCalledWith(mockUser);
    });
  });

  describe('count', () => {
    it('should return the count of users', async () => {
      jest.spyOn(userRepository, 'count').mockResolvedValue(5);

      const result = await service.count();
      expect(result).toBe(5);
      expect(userRepository.count).toHaveBeenCalled();
    });
  });

  describe('hashPassword', () => {
    it('should hash the password', async () => {
      const password = 'plainPassword';
      const hashedPassword = await service.hashPassword(password);
      expect(bcrypt.hash).toHaveBeenCalledWith(password, service['saltRounds']);
      expect(hashedPassword).toBe(`hashed_${password}`);
    });
  });

  describe('validatePassword', () => {
    it('should validate the password successfully', async () => {
      const plainPassword = 'plainPassword';
      const hashedPassword = 'hashed_plainPassword';
      const isValid = await service.validatePassword(plainPassword, hashedPassword);
      expect(bcrypt.compare).toHaveBeenCalledWith(plainPassword, hashedPassword);
      expect(isValid).toBe(true);
    });

    it('should invalidate the password', async () => {
      const plainPassword = 'wrongPassword';
      const hashedPassword = 'hashed_correctPassword';
      // Mock bcrypt.compare to return false for this case
      jest.mocked(bcrypt.compare).mockResolvedValue(false);
      const isValid = await service.validatePassword(plainPassword, hashedPassword);
      expect(bcrypt.compare).toHaveBeenCalledWith(plainPassword, hashedPassword);
      expect(isValid).toBe(false);
    });
  });
});