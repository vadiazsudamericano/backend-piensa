import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { Role, User } from '@prisma/client'; // <-- 1. Importa 'Role'
import { GetUser } from '../auth/decorator/get-user.decorator';
import { Roles } from '../auth/decorator/roles.decorator'; // <-- 2. Importa 'Roles'
import { JwtGuard } from '../auth/guard/jwt.guard';
import { RolesGuard } from '../auth/guard/roles.guard'; // <-- 3. Importa 'RolesGuard'
import { CreateSubjectDto } from './dto/create-subject.dto';
import { SubjectService } from './subject.service';

@UseGuards(JwtGuard, RolesGuard) // <-- 4. Añade 'RolesGuard' aquí
@Controller('subjects')
export class SubjectController {
  constructor(private subjectService: SubjectService) {}

  @Post()
  @Roles(Role.TEACHER) // <-- 5. ¡LA MAGIA! Solo Teachers pueden usar este
  createSubject(@GetUser() user: User, @Body() dto: CreateSubjectDto) {
    return this.subjectService.createSubject(user.id, dto);
  }

  @Get()
  getMySubjects(@GetUser() user: User) {
    // Modificamos esto para que funcione para ambos roles
    if (user.role === Role.TEACHER) {
      return this.subjectService.getSubjectsForTeacher(user.id);
    }
    // Si es estudiante, no debería estar aquí (lo manejaremos en enrollments)
    // Por ahora, simplemente no devolverá nada si no es profesor.
    return [];
  }
}