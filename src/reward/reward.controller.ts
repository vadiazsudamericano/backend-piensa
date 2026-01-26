import { Body, Controller, Delete, Get, Patch, Param, Post, UseGuards } from '@nestjs/common';
import { Role, RedemptionStatus } from '@prisma/client'; 
import { GetUser } from '../auth/decorator/get-user.decorator';
import { Roles } from '../auth/decorator/roles.decorator'; 
import { JwtGuard } from '../auth/guard/jwt.guard';
import { RolesGuard } from '../auth/guard/roles.guard'; 
import { CreateRewardDto } from './dto/create-reward.dto';
import { RedeemRewardDto } from './dto/redeem-reward.dto';
import { RewardService } from './reward.service';
// Importa el UpdateRewardDto si lo creaste en un archivo aparte, 
// o usa "any" temporalmente si quieres probar rápido.
import { UpdateRewardDto } from './dto/update-reward.dto'; 

@UseGuards(JwtGuard, RolesGuard)
@Controller('rewards')
export class RewardController {
  constructor(private rewardService: RewardService) {}

  @Post()
  @Roles(Role.TEACHER)
  create(@GetUser('id') teacherId: string, @Body() dto: CreateRewardDto) {
    return this.rewardService.createReward(teacherId, dto);
  }

  @Get('teacher') 
  @Roles(Role.TEACHER)
  getMyRewards(@GetUser('id') teacherId: string) {
    return this.rewardService.getRewardsByTeacher(teacherId);
  }

  // 🔥 NUEVO ENDPOINT: Para que el profesor vea canjes pendientes (CAMPANA)
  @Get('teacher/pending')
  @Roles(Role.TEACHER)
  getPendingRedemptions(@GetUser('id') teacherId: string) {
    return this.rewardService.getPendingRedemptions(teacherId);
  }

  // 🔥 NUEVO ENDPOINT: Para dar el Visto (Aprobar) o X (Rechazar)
  @Patch('teacher/handle-request/:id')
  @Roles(Role.TEACHER)
  handleRequest(
    @GetUser('id') teacherId: string,
    @Param('id') requestId: string,
    @Body('status') status: RedemptionStatus,
  ) {
    return this.rewardService.handleRedemption(teacherId, requestId, status);
  }

  // 🔥 NUEVO ENDPOINT: Edición completa de la recompensa (Nombre, Costo, Stock)
  @Patch('update/:id')
  @Roles(Role.TEACHER)
  editReward(
    @GetUser('id') teacherId: string,
    @Param('id') id: string,
    @Body() dto: UpdateRewardDto,
  ) {
    return this.rewardService.updateReward(teacherId, id, dto);
  }

  @Patch(':id')
  @Roles(Role.TEACHER)
  updateStatus(
    @GetUser('id') teacherId: string, 
    @Param('id') id: string, 
    @Body('isActive') isActive: boolean
  ) {
    return this.rewardService.toggleRewardStatus(teacherId, id, isActive);
  }

  @Delete(':id')
  @Roles(Role.TEACHER)
  delete(@GetUser('id') teacherId: string, @Param('id') id: string) {
    return this.rewardService.deleteReward(teacherId, id);
  }

  @Post('redeem')
  @Roles(Role.STUDENT)
  redeem(@GetUser('id') studentId: string, @Body() dto: RedeemRewardDto) {
    return this.rewardService.redeemReward(studentId, dto);
  }

  // 🔥 NUEVO ENDPOINT: Para la campana del estudiante (Notificaciones)
  @Get('student/my-requests')
  @Roles(Role.STUDENT)
  getMyRequests(@GetUser('id') studentId: string) {
    return this.rewardService.getStudentRedemptions(studentId);
  }

  @Get('subject/:subjectId')
  getRewardsBySubject(@Param('subjectId') subjectId: string) {
    return this.rewardService.findAllBySubject(subjectId);
  }
}