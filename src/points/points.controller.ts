import { Body, Controller, Post, UseGuards, Get, Query } from '@nestjs/common';
import { Role } from '@prisma/client'; 
import { GetUser } from '../auth/decorator/get-user.decorator';
import { Roles } from '../auth/decorator/roles.decorator';
import { JwtGuard } from '../auth/guard/jwt.guard';
import { RolesGuard } from '../auth/guard/roles.guard'; 
import { PointsService } from './points.service';
import { AssignPointsDto } from './dto/assign-points.dto';

@UseGuards(JwtGuard, RolesGuard)
@Controller('points')
export class PointsController {
  constructor(private pointsService: PointsService) {}

  @Post('assign')
  @Roles(Role.TEACHER) // Solo Teachers
  assignPoints(@GetUser('id') teacherId: string, @Body() dto: AssignPointsDto) {
    return this.pointsService.assignPoints(teacherId, dto);
  }

  @Get('balance')
  getStudentBalance(
    @Query('studentId') studentId: string,
    @Query('subjectId') subjectId: string,
  ) {
    return this.pointsService.getStudentBalanceForSubject(
      studentId,
      subjectId,
    );
  }
}