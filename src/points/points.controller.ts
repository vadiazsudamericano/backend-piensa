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

  // --- RUTAS EXISTENTES (NO TOCAR) ---

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

  // --- NUEVA RUTA PARA LA BATALLA (RESUELVE EL 404) ---

  @Post('assign-battle-points')
  @Roles(Role.TEACHER) // Solo Teachers pueden finalizar y dar premios
  async assignBattlePoints(@GetUser('id') teacherId: string, @Body() dto: any) {
    /**
     * Esta ruta recibe la llamada del frontend del docente al finalizar la batalla.
     * Reutiliza la lógica de assignPoints del servicio pero mapeando los datos 
     * que envía el sistema de batalla automáticamente.
     */
    return this.pointsService.assignPoints(teacherId, {
      studentCode: dto.studentCode,
      subjectId: dto.subjectId,
      amount: dto.amount,
      reason: dto.reason || 'Premio de Batalla'
    });
  }
}