import {ForbiddenException,Injectable,NotFoundException,} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class EnrollmentService {
  constructor(private prisma: PrismaService) {}

  async joinSubject(studentId: string, joinCode: string) {
    // Busca la materia usando el codigo
    const subject = await this.prisma.subject.findUnique({
      where: { joinCode },
    });

    if (!subject) {
      throw new NotFoundException('Materia no encontrada con ese código');
    }

    // Verifica que el estudiante no esté ya inscrito
    const existingEnrollment = await this.prisma.enrollment.findFirst({
      where: {
        studentId: studentId,
        subjectId: subject.id,
      },
    });

    if (existingEnrollment) {
      throw new ForbiddenException('Ya estás inscrito en esta materia');
    }

    // Crea la inscripción 
    const enrollment = await this.prisma.enrollment.create({
      data: {
        studentId: studentId,
        subjectId: subject.id,
      },
    });

    // Crea el saldo de puntos inicial para esa materia
    await this.prisma.pointBalance.create({
      data: {
        studentId: studentId,
        subjectId: subject.id,
        amount: 0, // Inicia con 0 puntos
      },
    });

    return enrollment;
  }

  async getMyEnrolledSubjects(studentId: string) {
    // Devuelve las materias en las que el estudiante está inscrito
    return this.prisma.enrollment.findMany({
      where: {
        studentId: studentId,
      },
      include: {
        subject: true, // Incluye los detalles de la materia
      },
    });
  }
}