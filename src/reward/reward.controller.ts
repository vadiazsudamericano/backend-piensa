import { Body, Controller, Delete, Get, Patch, Param, Post, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client'; 
import { GetUser } from '../auth/decorator/get-user.decorator';
import { Roles } from '../auth/decorator/roles.decorator'; 
import { JwtGuard } from '../auth/guard/jwt.guard';
import { RolesGuard } from '../auth/guard/roles.guard'; 
import { CreateRewardDto } from './dto/create-reward.dto';
import { RedeemRewardDto } from './dto/redeem-reward.dto';
import { RewardService } from './reward.service';

@UseGuards(JwtGuard, RolesGuard)
@Controller('rewards')
export class RewardController {
  constructor(private rewardService: RewardService) {}

  @Post()
  @Roles(Role.TEACHER)
  create(@GetUser('id') teacherId: string, @Body() dto: CreateRewardDto) {
    return this.rewardService.createReward(teacherId, dto);
  }

  // OJO: Esta ruta es para que el profesor vea SUS premios en el dashboard
  @Get('teacher') 
  @Roles(Role.TEACHER)
  getMyRewards(@GetUser('id') teacherId: string) {
    return this.rewardService.getRewardsByTeacher(teacherId);
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
}