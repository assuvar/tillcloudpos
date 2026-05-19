import { Controller, Get, Post, Req, Param } from '@nestjs/common';
import { AttendanceService } from './attendance.service';
import { GetUser } from '../auth/decorators/get-user.decorator';

@Controller('attendance')
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Post('clock-in')
  async clockIn(@GetUser() user: any) {
    return this.attendanceService.clockIn(user.userId, user.restaurantId);
  }

  @Post('clock-out')
  async clockOut(@GetUser() user: any) {
    return this.attendanceService.clockOut(user.userId, user.restaurantId);
  }

  @Get('current')
  async getCurrentSession(@GetUser() user: any) {
    const session = await this.attendanceService.getCurrentSession(
      user.userId,
      user.restaurantId,
    );
    return { session };
  }

  @Get()
  async findAll(@GetUser() user: any) {
    return this.attendanceService.findAll(user.restaurantId);
  }

  @Get(':employeeId')
  async findByEmployee(
    @GetUser() user: any,
    @Param('employeeId') employeeId: string,
  ) {
    return this.attendanceService.findByEmployee(employeeId, user.restaurantId);
  }
}
