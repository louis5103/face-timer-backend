import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsOrder } from 'typeorm';
import { Task } from './entities/task.entity';
import { CreateTaskDto, UpdateTaskDto } from './dto';

export interface TaskStats {
  total: number;
  active: number;
  inactive: number;
  totalTime: number;
}

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Task)
    private readonly taskRepository: Repository<Task>,
  ) {}

  async create(userId: string, createTaskDto: CreateTaskDto): Promise<Task> {
    const task = this.taskRepository.create({
      ...createTaskDto,
      userId,
    });

    return await this.taskRepository.save(task);
  }

  async findAll(userId: string): Promise<Task[]> {
    const orderOptions: FindOptionsOrder<Task> = {
      lastUsed: 'DESC',
      createdAt: 'DESC',
    };

    return await this.taskRepository.find({
      where: { userId },
      order: orderOptions,
    });
  }

  async findAllActive(userId: string): Promise<Task[]> {
    const orderOptions: FindOptionsOrder<Task> = {
      lastUsed: 'DESC',
      createdAt: 'DESC',
    };

    return await this.taskRepository.find({
      where: { userId, isActive: true },
      order: orderOptions,
    });
  }

  async findOne(id: string, userId: string): Promise<Task> {
    if (!id) {
      throw new BadRequestException('Task ID is required');
    }

    const task = await this.taskRepository.findOne({
      where: { id },
    });

    if (!task) {
      throw new NotFoundException(`Task with ID ${id} not found`);
    }

    // Check ownership
    if (task.userId !== userId) {
      throw new ForbiddenException('You do not have access to this task');
    }

    return task;
  }

  async update(
    id: string,
    userId: string,
    updateTaskDto: UpdateTaskDto,
  ): Promise<Task> {
    const task = await this.findOne(id, userId);

    Object.assign(task, updateTaskDto);

    return await this.taskRepository.save(task);
  }

  async updateLastUsed(id: string, userId: string): Promise<Task> {
    const task = await this.findOne(id, userId);

    task.lastUsed = new Date();

    return await this.taskRepository.save(task);
  }

  async incrementTotalTime(
    id: string,
    userId: string,
    duration: number,
  ): Promise<Task> {
    const task = await this.findOne(id, userId);

    task.totalTime = Number(task.totalTime) + duration;
    task.lastUsed = new Date();

    return await this.taskRepository.save(task);
  }

  async remove(id: string, userId: string): Promise<void> {
    const task = await this.findOne(id, userId);
    await this.taskRepository.remove(task);
  }

  async toggleActive(id: string, userId: string): Promise<Task> {
    const task = await this.findOne(id, userId);

    task.isActive = !task.isActive;

    return await this.taskRepository.save(task);
  }

  async getTaskStats(userId: string): Promise<TaskStats> {
    const tasks = await this.findAll(userId);

    return {
      total: tasks.length,
      active: tasks.filter((t: Task) => t.isActive).length,
      inactive: tasks.filter((t: Task) => !t.isActive).length,
      totalTime: tasks.reduce((sum: number, t: Task) => sum + Number(t.totalTime), 0),
    };
  }
}ㅋ