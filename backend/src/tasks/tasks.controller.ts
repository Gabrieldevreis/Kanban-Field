import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { MoveTaskDto } from './dto/move-task.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('columns')
@UseGuards(JwtAuthGuard)
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Post(':columnId/tasks')
  create(
    @Param('columnId') columnId: string,
    @CurrentUser() user: any,
    @Body() createTaskDto: CreateTaskDto,
  ) {
    return this.tasksService.create(columnId, user.id, createTaskDto);
  }

  @Get(':columnId/tasks')
  findAll(@Param('columnId') columnId: string, @CurrentUser() user: any) {
    return this.tasksService.findAll(columnId, user.id);
  }

  @Get(':columnId/tasks/:id')
  findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.tasksService.findOne(id, user.id);
  }

  @Patch(':columnId/tasks/:id')
  update(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Body() updateTaskDto: UpdateTaskDto,
  ) {
    return this.tasksService.update(id, user.id, updateTaskDto);
  }

  @Patch(':columnId/tasks/:id/move')
  move(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Body() moveTaskDto: MoveTaskDto,
  ) {
    return this.tasksService.move(id, user.id, moveTaskDto);
  }

  @Delete(':columnId/tasks/:id')
  remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.tasksService.remove(id, user.id);
  }
}
