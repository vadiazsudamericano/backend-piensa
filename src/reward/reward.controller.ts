import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { Role, User } from '@prisma/client'; 
import { GetUser } from '../auth/decorator/get-user.decorator';
import { Roles } from '../auth/decorator/roles.decorator'; 
import { JwtGuard } from '../auth/guard/jwt.guard';
import { RolesGuard } from '../auth/guard/roles.guard'; 
import { CreateRewardDto } from './dto/create-reward.dto';
import { RedeemRewardDto } from './dto/redeem-reward.dto';
import { RewardService } from './reward.service';

@UseGuards(JwtGuard, RolesGuard) // Añade 'RolesGuard' aquí
@Controller('rewards')
export class RewardController {
  constructor(private rewardService: RewardService) {}

  @Post()
  @Roles(Role.TEACHER) //  Solo Teachers
  createReward(@GetUser('id') teacherId: string, @Body() dto: CreateRewardDto) {
    return this.rewardService.createReward(teacherId, dto);
  }

  @Get()
  getRewards(@Query('subjectId') subjectId: string) {
    return this.rewardService.getRewardsForSubject(subjectId);
  }

  @Post('redeem')
  @Roles(Role.STUDENT) //  Solo Estudiantes pueden canjear
  redeemReward(@GetUser('id') studentId: string, @Body() dto: RedeemRewardDto) {
    return this.rewardService.redeemReward(studentId, dto);
  }
}