import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Task } from './entities/task.entity';
import { CreateTaskDto, UpdateTaskDto } from './dto';

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
    return await this.taskRepository.find({
      where: { userId },
      order: { lastUsed: 'DESC', createdAt: 'DESC' },
    });
  }

  async findAllActive(userId: string): Promise<Task[]> {
    return await this.taskRepository.find({
      where: { userId, isActive: true },
      order: { lastUsed: 'DESC', createdAt: 'DESC' },
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

  async getTaskStats(userId: string): Promise<any> {
    const tasks = await this.findAll(userId);

    return {
      total: tasks.length,
      active: tasks.filter((t) => t.isActive).length,
      inactive: tasks.filter((t) => !t.isActive).length,
      totalTime: tasks.reduce((sum, t) => sum + Number(t.totalTime), 0),
    };
  }
}
