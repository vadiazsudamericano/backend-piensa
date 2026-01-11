import { Controller, Get, UseGuards } from '@nestjs/common';
import { User } from '@prisma/client';
import { GetUser } from '../auth/decorator/get-user.decorator';
import { JwtGuard } from '../auth/guard/jwt.guard';
import { AchievementsService } from './achievements.service';

@UseGuards(JwtGuard)
@Controller('achievements')
export class AchievementsController {
  constructor(private achievementsService: AchievementsService) {}

  @Get()
  getMyAchievements(@GetUser() user: User) {
    return this.achievementsService.getMyAchievements(user.id);
  }
}