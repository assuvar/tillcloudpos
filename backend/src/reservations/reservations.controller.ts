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
import { ReservationsService } from './reservations.service';
import { CreateReservationDto, UpdateReservationDto } from './dto/reservations.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';
import type { User } from '../../generated/prisma';
import { ReservationStatus } from '../../generated/prisma';

@Controller('reservations')
@UseGuards(JwtAuthGuard)
export class ReservationsController {
  constructor(private readonly reservationsService: ReservationsService) {}

  @Post()
  create(@GetUser() user: User, @Body() dto: CreateReservationDto) {
    return this.reservationsService.create(user.restaurantId, dto);
  }

  @Get()
  findAll(
    @GetUser() user: User,
    @Query('status') status?: ReservationStatus,
  ) {
    return this.reservationsService.findAll(user.restaurantId, status);
  }

  @Get('today')
  findToday(@GetUser() user: User) {
    return this.reservationsService.findToday(user.restaurantId);
  }

  @Get(':id')
  findOne(@GetUser() user: User, @Param('id') id: string) {
    return this.reservationsService.findOne(user.restaurantId, id);
  }

  @Patch(':id')
  update(
    @GetUser() user: User,
    @Param('id') id: string,
    @Body() dto: UpdateReservationDto,
  ) {
    return this.reservationsService.update(user.restaurantId, id, dto);
  }

  @Delete(':id')
  remove(@GetUser() user: User, @Param('id') id: string) {
    return this.reservationsService.remove(user.restaurantId, id);
  }
}
