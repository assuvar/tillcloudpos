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
import { OutletsService } from './outlets.service';
import { CreateOutletDto, UpdateOutletDto } from './dto/create-outlet.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';
import type { User } from '../../generated/prisma';

@Controller('outlets')
@UseGuards(JwtAuthGuard)
export class OutletsController {
  constructor(private readonly outletsService: OutletsService) {}

  @Get()
  findAll(@GetUser() user: User) {
    return this.outletsService.list(user.restaurantId);
  }

  @Get(':id')
  findOne(@GetUser() user: User, @Param('id') id: string) {
    return this.outletsService.findOne(user.restaurantId, id);
  }

  @Post()
  create(@GetUser() user: User, @Body() dto: CreateOutletDto) {
    return this.outletsService.create(user.restaurantId, dto);
  }

  @Patch(':id')
  update(
    @GetUser() user: User,
    @Param('id') id: string,
    @Body() dto: UpdateOutletDto,
  ) {
    return this.outletsService.update(user.restaurantId, id, dto);
  }

  @Patch(':id/service-models')
  updateServiceModels(
    @GetUser() user: User,
    @Param('id') id: string,
    @Body('serviceModels') serviceModels: string[],
  ) {
    return this.outletsService.updateServiceModels(
      user.restaurantId,
      id,
      serviceModels,
    );
  }

  @Delete(':id')
  delete(@GetUser() user: User, @Param('id') id: string) {
    return this.outletsService.delete(user.restaurantId, id);
  }
}
