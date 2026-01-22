import { Body, Controller, Get, Post, Param, Delete, UseGuards } from '@nestjs/common';
import { Role, User } from '@prisma/client';
import { GetUser } from '../auth/decorator/get-user.decorator';
import { Roles } from '../auth/decorator/roles.decorator';
import { JwtGuard } from '../auth/guard/jwt.guard';
import { RolesGuard } from '../auth/guard/roles.guard';
import { CreateSubjectDto } from './dto/create-subject.dto';
import { SubjectService } from './subject.service';

@UseGuards(JwtGuard, RolesGuard)
@Controller('subjects')
export class SubjectController {
  constructor(private subjectService: SubjectService) {}

  @Post()
  @Roles(Role.TEACHER)
  createSubject(@GetUser() user: User, @Body() dto: CreateSubjectDto) {
    return this.subjectService.createSubject(user.id, dto);
  }
 
  @Get()
  getMySubjects(@GetUser() user: User) { 
    if (user.role === Role.TEACHER) {
      return this.subjectService.getSubjectsForTeacher(user.id);
    } 
    return [];
  }

  // 🔥 NUEVO ENDPOINT
  @Delete(':id')
  @Roles(Role.TEACHER)
  deleteSubject(@Param('id') subjectId: string, @GetUser() user: User) {
    return this.subjectService.deleteSubject(subjectId, user.id);
  }
}