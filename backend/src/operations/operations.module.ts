import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AttendanceService } from './attendance.service';
import { AttendanceController } from './attendance.controller';
import { RegisterService } from './register.service';
import { RegisterController } from './register.controller';
import { AuditService } from './audit.service';
import { AuditController } from './audit.controller';

@Module({
  imports: [PrismaModule],
  controllers: [AttendanceController, RegisterController, AuditController],
  providers: [AttendanceService, RegisterService, AuditService],
  exports: [AttendanceService, RegisterService, AuditService],
})
export class OperationsModule {}
