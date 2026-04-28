import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import { TablesService } from './tables.service';
import {
  CreateTableDto,
  UpdateTableDto,
  CreateTableGroupDto,
  UpdateTableGroupDto,
  ShiftTableDto,
  MergeTablesDto,
} from './dto/tables.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';
import type { User } from '../../generated/prisma';
import { TableStatus, Floor } from '../../generated/prisma';

@Controller('tables')
@UseGuards(JwtAuthGuard)
export class TablesController {
  constructor(private readonly tablesService: TablesService) {}

  // Table Groups
  @Post('groups')
  createGroup(@GetUser() user: User, @Body() dto: CreateTableGroupDto) {
    return this.tablesService.createGroup(user.restaurantId, dto);
  }

  @Get('groups')
  findAllGroups(@GetUser() user: User) {
    return this.tablesService.findAllGroups(user.restaurantId);
  }

  @Patch('groups/:id')
  updateGroup(
    @GetUser() user: User,
    @Param('id') id: string,
    @Body() dto: UpdateTableGroupDto,
  ) {
    return this.tablesService.updateGroup(user.restaurantId, id, dto);
  }

  @Delete('groups/:id')
  deleteGroup(@GetUser() user: User, @Param('id') id: string) {
    return this.tablesService.deleteGroup(user.restaurantId, id);
  }

  // Tables
  @Post()
  createTable(@GetUser() user: User, @Body() dto: CreateTableDto) {
    return this.tablesService.createTable(user.restaurantId, dto);
  }

  @Get()
  findAllTables(
    @GetUser() user: User,
    @Query('floor') floor?: Floor,
    @Query('status') status?: TableStatus,
  ) {
    return this.tablesService.findAllTables(user.restaurantId, floor, status);
  }

  @Get(':id')
  findOneTable(@GetUser() user: User, @Param('id') id: string) {
    return this.tablesService.findOneTable(user.restaurantId, id);
  }

  @Patch(':id')
  updateTable(
    @GetUser() user: User,
    @Param('id') id: string,
    @Body() dto: UpdateTableDto,
  ) {
    return this.tablesService.updateTable(user.restaurantId, id, dto);
  }

  @Patch(':id/status')
  updateStatus(
    @GetUser() user: User,
    @Param('id') id: string,
    @Body('status') status: TableStatus,
    @Body('currentOrderId') currentOrderId?: string,
  ) {
    return this.tablesService.updateTableStatus(
      user.restaurantId,
      id,
      status,
      currentOrderId,
    );
  }

  @Post(':id/shift')
  shift(
    @GetUser() user: User,
    @Param('id') id: string,
    @Body() dto: ShiftTableDto,
  ) {
    return this.tablesService.shiftTable(
      user.restaurantId,
      id,
      dto.targetTableId,
    );
  }

  @Post('merge')
  merge(@GetUser() user: User, @Body() dto: MergeTablesDto) {
    return this.tablesService.mergeTables(user.restaurantId, dto);
  }

  @Post(':id/clear')
  clear(@GetUser() user: User, @Param('id') id: string) {
    return this.tablesService.clearTable(user.restaurantId, id);
  }

  @Delete(':id')
  deleteTable(@GetUser() user: User, @Param('id') id: string) {
    return this.tablesService.deleteTable(user.restaurantId, id);
  }
}
