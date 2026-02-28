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
import { ColumnsService } from './columns.service';
import { CreateColumnDto } from './dto/create-column.dto';
import { UpdateColumnDto } from './dto/update-column.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('projects/:projectId/columns')
@UseGuards(JwtAuthGuard)
export class ColumnsController {
  constructor(private readonly columnsService: ColumnsService) {}

  @Post()
  create(
    @Param('projectId') projectId: string,
    @CurrentUser() user: any,
    @Body() createColumnDto: CreateColumnDto,
  ) {
    return this.columnsService.create(projectId, user.id, createColumnDto);
  }

  @Get()
  findAll(@Param('projectId') projectId: string, @CurrentUser() user: any) {
    return this.columnsService.findAll(projectId, user.id);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.columnsService.findOne(id, user.id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Body() updateColumnDto: UpdateColumnDto,
  ) {
    return this.columnsService.update(id, user.id, updateColumnDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.columnsService.remove(id, user.id);
  }
}
