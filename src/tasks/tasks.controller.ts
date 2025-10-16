import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { TasksService } from './tasks.service';
import { CreateTaskDto, UpdateTaskDto, TaskResponseDto } from './dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Tasks')
@ApiBearerAuth()
@Controller('tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new task' })
  @ApiResponse({
    status: 201,
    description: 'Task successfully created',
    type: TaskResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async create(
    @CurrentUser('id') userId: string,
    @Body() createTaskDto: CreateTaskDto,
  ) {
    return this.tasksService.create(userId, createTaskDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all tasks for current user' })
  @ApiResponse({
    status: 200,
    description: 'List of all tasks',
    type: [TaskResponseDto],
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async findAll(@CurrentUser('id') userId: string) {
    return this.tasksService.findAll(userId);
  }

  @Get('active')
  @ApiOperation({ summary: 'Get all active tasks for current user' })
  @ApiResponse({
    status: 200,
    description: 'List of active tasks',
    type: [TaskResponseDto],
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async findAllActive(@CurrentUser('id') userId: string) {
    return this.tasksService.findAllActive(userId);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get task statistics for current user' })
  @ApiResponse({ status: 200, description: 'Task statistics' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getStats(@CurrentUser('id') userId: string) {
    return this.tasksService.getTaskStats(userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific task' })
  @ApiResponse({
    status: 200,
    description: 'Task found',
    type: TaskResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Task not found' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async findOne(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.tasksService.findOne(id, userId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a task' })
  @ApiResponse({
    status: 200,
    description: 'Task successfully updated',
    type: TaskResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Task not found' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async update(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Body() updateTaskDto: UpdateTaskDto,
  ) {
    return this.tasksService.update(id, userId, updateTaskDto);
  }

  @Patch(':id/toggle')
  @ApiOperation({ summary: 'Toggle task active status' })
  @ApiResponse({
    status: 200,
    description: 'Task status toggled',
    type: TaskResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Task not found' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async toggleActive(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.tasksService.toggleActive(id, userId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a task' })
  @ApiResponse({ status: 204, description: 'Task successfully deleted' })
  @ApiResponse({ status: 404, description: 'Task not found' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async remove(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.tasksService.remove(id, userId);
  }
}