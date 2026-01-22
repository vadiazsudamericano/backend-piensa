import { Body, Controller, Get, Post, Delete, Param, UseGuards } from '@nestjs/common';
import { User } from '@prisma/client';
import { GetUser } from '../auth/decorator/get-user.decorator';
import { JwtGuard } from '../auth/guard/jwt.guard';
import { JoinSubjectDto } from './dto/join-subject.dto';
import { EnrollmentService } from './enrollment.service';

@UseGuards(JwtGuard)
@Controller('enrollments')
export class EnrollmentController {
  constructor(private enrollmentService: EnrollmentService) {}

  // Estudiante se une a materia
  @Post('join')
  joinSubject(@GetUser('id') studentId: string, @Body() dto: JoinSubjectDto) {
    return this.enrollmentService.joinSubject(studentId, dto.joinCode);
  }

  // Estudiante ve sus materias
  @Get('my-subjects')
  getMyEnrolledSubjects(@GetUser('id') studentId: string) {
    return this.enrollmentService.getMyEnrolledSubjects(studentId);
  }

  // Profesor ve estudiantes de una materia
  @Get('subject/:subjectId')
  getStudentsBySubject(@Param('subjectId') subjectId: string) {
    return this.enrollmentService.getStudentsBySubject(subjectId);
  }

  // 🔥 NUEVO ENDPOINT: Estudiante sale de una materia
  @Delete('leave/:subjectId')
  leaveSubject(@GetUser('id') studentId: string, @Param('subjectId') subjectId: string) {
    return this.enrollmentService.leaveSubject(studentId, subjectId);
  }
}