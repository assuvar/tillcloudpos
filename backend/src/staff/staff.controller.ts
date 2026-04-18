import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { Roles } from '../auth/decorators/roles.decorator';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { PERMISSIONS } from '../auth/permissions/permissions.constants';
import {
  CreateStaffDto,
  PinAuditQueryDto,
  ResetStaffPinDto,
  StaffIdParamDto,
  UpdateStaffDto,
} from './dto/staff-common.dto';
import { StaffService } from './staff.service';

type AuthenticatedRequest = {
  user: {
    userId: string;
    role: 'ADMIN' | 'MANAGER' | 'CASHIER' | 'KITCHEN';
    restaurantId: string;
  };
};

@Controller('staff')
@UsePipes(
  new ValidationPipe({
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: true,
  }),
)
export class StaffController {
  constructor(private readonly staffService: StaffService) {}

  @Get('pin-audit-logs')
  @Roles('ADMIN')
  getPinAuditLogs(
    @Req() req: AuthenticatedRequest,
    @Query() query: PinAuditQueryDto,
  ) {
    return this.staffService.getPinAuditLogs(
      req.user.restaurantId,
      req.user,
      query.limit,
    );
  }

  @Get()
  @RequirePermissions(PERMISSIONS.STAFF_EDIT)
  findAll(@Req() req: AuthenticatedRequest) {
    return this.staffService.findAll(req.user.restaurantId);
  }

  @Post()
  @RequirePermissions(PERMISSIONS.STAFF_INVITE)
  create(@Req() req: AuthenticatedRequest, @Body() body: CreateStaffDto) {
    return this.staffService.create(req.user.restaurantId, body);
  }

  @Post('invite')
  @RequirePermissions(PERMISSIONS.STAFF_INVITE)
  invite(@Req() req: AuthenticatedRequest, @Body() body: CreateStaffDto) {
    return this.staffService.create(req.user.restaurantId, body);
  }

  @Patch(':id')
  @RequirePermissions(PERMISSIONS.STAFF_EDIT)
  update(
    @Req() req: AuthenticatedRequest,
    @Param() params: StaffIdParamDto,
    @Body() body: UpdateStaffDto,
  ) {
    return this.staffService.update(
      req.user.restaurantId,
      params.id,
      req.user,
      body,
    );
  }

  @Patch(':id/activate')
  @RequirePermissions(PERMISSIONS.STAFF_DEACTIVATE)
  activate(@Req() req: AuthenticatedRequest, @Param() params: StaffIdParamDto) {
    return this.staffService.activate(req.user.restaurantId, params.id);
  }

  @Patch(':id/deactivate')
  @RequirePermissions(PERMISSIONS.STAFF_DEACTIVATE)
  deactivate(
    @Req() req: AuthenticatedRequest,
    @Param() params: StaffIdParamDto,
  ) {
    return this.staffService.deactivate(
      req.user.restaurantId,
      params.id,
      req.user,
    );
  }

  @Patch(':id/pin')
  @Roles('ADMIN')
  resetPin(
    @Req() req: AuthenticatedRequest,
    @Param() params: StaffIdParamDto,
    @Body() body: ResetStaffPinDto,
  ) {
    return this.staffService.resetPin(
      req.user.restaurantId,
      params.id,
      req.user,
      body.adminPassword,
    );
  }

  @Post(':id/pin/reset')
  @Roles('ADMIN')
  resetPinPost(
    @Req() req: AuthenticatedRequest,
    @Param() params: StaffIdParamDto,
    @Body() body: ResetStaffPinDto,
  ) {
    return this.staffService.resetPin(
      req.user.restaurantId,
      params.id,
      req.user,
      body.adminPassword,
    );
  }

  @Post(':id/pin/reveal')
  @Roles('ADMIN')
  revealPin(
    @Req() req: AuthenticatedRequest,
    @Param() params: StaffIdParamDto,
    @Body() body: ResetStaffPinDto,
  ) {
    return this.staffService.revealPin(
      req.user.restaurantId,
      params.id,
      req.user,
      body.adminPassword,
    );
  }

  @Patch(':id/pin/reveal')
  @Roles('ADMIN')
  revealPinPatch(
    @Req() req: AuthenticatedRequest,
    @Param() params: StaffIdParamDto,
    @Body() body: ResetStaffPinDto,
  ) {
    return this.staffService.revealPin(
      req.user.restaurantId,
      params.id,
      req.user,
      body.adminPassword,
    );
  }

  @Delete(':id')
  @RequirePermissions(PERMISSIONS.STAFF_DELETE)
  remove(@Req() req: AuthenticatedRequest, @Param() params: StaffIdParamDto) {
    return this.staffService.remove(req.user.restaurantId, params.id, req.user);
  }
}
