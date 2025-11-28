import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { TasksService } from './tasks.service';
import { Task } from './entities/task.entity';
import { Repository } from 'typeorm';
import { NotFoundException } from '@nestjs/common';

type MockRepository<T = any> = Partial<Record<keyof Repository<T>, jest.Mock>>;

const createMockRepository = <T = any>(): MockRepository<T> => ({
  create: jest.fn().mockImplementation((dto) => dto),
  save: jest.fn().mockImplementation((task) => Promise.resolve({ id: 'uuid', ...task })),
  find: jest.fn(),
  findOne: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
});

describe('TasksService', () => {
  let service: TasksService;
  let repository: MockRepository<Task>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TasksService,
        {
          provide: getRepositoryToken(Task),
          useValue: createMockRepository(),
        },
      ],
    }).compile();

    service = module.get<TasksService>(TasksService);
    repository = module.get<MockRepository<Task>>(getRepositoryToken(Task));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new task', async () => {
      const createTaskDto = { title: 'Test Task', icon: 'book', color: 'blue' };
      const userId = 'user1';

      const result = await service.create(userId, createTaskDto);

      expect(repository.create).toHaveBeenCalledWith({
        ...createTaskDto,
        user: { id: userId },
      });
      expect(repository.save).toHaveBeenCalled();
      expect(result).toEqual(expect.objectContaining(createTaskDto));
    });
  });

  describe('findAll', () => {
    it('should return an array of tasks', async () => {
      const userId = 'user1';
      const tasks = [{ title: 'Task 1' }, { title: 'Task 2' }];
      repository.find.mockResolvedValue(tasks);

      const result = await service.findAll(userId);

      expect(result).toEqual(tasks);
      expect(repository.find).toHaveBeenCalledWith({
        where: { user: { id: userId } },
        order: { createdAt: 'DESC' },
      });
    });
  });

  describe('findOne', () => {
    it('should return a task if found', async () => {
      const task = { id: '1', title: 'Task 1' };
      repository.findOne.mockResolvedValue(task);

      const result = await service.findOne('1', 'user1');
      expect(result).toEqual(task);
    });

    it('should throw NotFoundException if not found', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.findOne('1', 'user1')).rejects.toThrow(NotFoundException);
    });
  });
});