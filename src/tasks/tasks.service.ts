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

// TaskStats 인터페이스를 export하여 다른 파일에서 import 할 수 있도록 합니다.
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
      // userId 대신 user 관계 객체로 생성합니다.
      user: { id: userId },
    });

    return await this.taskRepository.save(task);
  }

  async findAll(userId: string): Promise<Task[]> {
    const orderOptions: FindOptionsOrder<Task> = {
      lastUsed: 'DESC',
      createdAt: 'DESC',
    };

    return await this.taskRepository.find({
      // where 조건절을 관계 객체 형태로 변경합니다.
      where: { user: { id: userId } },
      order: orderOptions,
    });
  }

  async findAllActive(userId: string): Promise<Task[]> {
    const orderOptions: FindOptionsOrder<Task> = {
      lastUsed: 'DESC',
      createdAt: 'DESC',
    };

    return await this.taskRepository.find({
      // where 조건절을 관계 객체 형태로 변경합니다.
      where: { user: { id: userId }, isActive: true },
      order: orderOptions,
    });
  }

  async findOne(id: string, userId: string): Promise<Task> {
    if (!id) {
      throw new BadRequestException('Task ID is required');
    }

    // where 조건에 user.id를 포함시켜 소유권을 한번에 검증합니다.
    const task = await this.taskRepository.findOne({
      where: { id, user: { id: userId } },
      // user 관계를 명시적으로 로드하려면 relations 옵션을 사용할 수 있습니다.
      // relations: ['user'],
    });

    if (!task) {
      throw new NotFoundException(
        `Task with ID ${id} not found or access denied`,
      );
    }

    return task;
  }

  async update(
    id: string,
    userId: string,
    updateTaskDto: UpdateTaskDto,
  ): Promise<Task> {
    // findOne에서 소유권 검증이 이미 이루어집니다.
    const task = await this.findOne(id, userId);
    Object.assign(task, updateTaskDto);
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
      active: tasks.filter((t) => t.isActive).length,
      inactive: tasks.filter((t) => !t.isActive).length,
      totalTime: tasks.reduce((sum, t) => sum + Number(t.totalTime), 0),
    };
  }
}
