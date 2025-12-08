import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
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

  // --- NUEVO MÉTODO: Obtener estudiantes de una materia específica (Para Docentes) ---
  async getStudentsBySubject(teacherId: string, subjectId: string) {
    // 1. Validar que la materia existe
    const subject = await this.prisma.subject.findUnique({
      where: { id: subjectId },
    });

    if (!subject) {
      throw new NotFoundException('Materia no encontrada');
    }

    // 2. Seguridad: Validar que el profesor sea el dueño de la materia
    if (subject.teacherId !== teacherId) {
      throw new ForbiddenException('No tienes permiso para ver los estudiantes de esta materia');
    }

    // 3. Obtener inscripciones con datos del estudiante
    const enrollments = await this.prisma.enrollment.findMany({
      where: {
        subjectId: subjectId,
      },
      include: {
        student: {
          select: {
            id: true,
            fullName: true,
            email: true,
            avatarUrl: true, // Importante para la UI
          },
        },
      },
      orderBy: {
        student: {
          fullName: 'asc', // Orden alfabético
        },
      },
    });

    // 4. Aplanar la respuesta para que el Frontend la consuma fácil
    return enrollments.map((e) => ({
      id: e.student.id,
      fullName: e.student.fullName,
      email: e.student.email,
      avatarUrl: e.student.avatarUrl,
      joinedAt: e.joinedAt, // Fecha de inscripción
    }));
  }
}