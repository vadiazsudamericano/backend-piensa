import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { User } from '@prisma/client';
import { GetUser } from '../auth/decorator/get-user.decorator';
import { JwtGuard } from '../auth/guard/jwt.guard';
import { JoinSubjectDto } from './dto/join-subject.dto';
import { EnrollmentService } from './enrollment.service';

@UseGuards(JwtGuard)
@Controller('enrollments')
export class EnrollmentController {
  constructor(private enrollmentService: EnrollmentService) {}

  // Endpoint para que un estudiante se una a una materia 
  @Post('join')
  joinSubject(@GetUser('id') studentId: string, @Body() dto: JoinSubjectDto) {
    return this.enrollmentService.joinSubject(studentId, dto.joinCode);
  }

  // Endpoint para que un estudiante vea las materias a las que se unió
  @Get('my-subjects')
  getMyEnrolledSubjects(@GetUser('id') studentId: string) {
    return this.enrollmentService.getMyEnrolledSubjects(studentId);
  }

  // --- NUEVO ENDPOINT: Obtener estudiantes de una materia (Para Docentes) ---
  @Get('subject/:subjectId')
  getStudentsBySubject(
    @GetUser('id') teacherId: string,
    @Param('subjectId') subjectId: string,
  ) {
    return this.enrollmentService.getStudentsBySubject(teacherId, subjectId);
  }
}