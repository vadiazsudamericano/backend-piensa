import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class EnrollmentService {
  constructor(private prisma: PrismaService) {}

  // --- UNIRSE A UNA MATERIA ---
  async joinSubject(studentId: string, joinCode: string) {
    const subject = await this.prisma.subject.findUnique({
      where: { joinCode },
    });

    if (!subject) {
      throw new NotFoundException('Materia no encontrada con ese código');
    }

    const existingEnrollment = await this.prisma.enrollment.findFirst({
      where: { studentId, subjectId: subject.id },
    });

    if (existingEnrollment) {
      return this.prisma.enrollment.findUnique({
        where: { id: existingEnrollment.id },
        include: {
          subject: { include: { teacher: true } } 
        }
      });
    }

    const enrollment = await this.prisma.enrollment.create({
      data: { studentId, subjectId: subject.id },
      include: { 
        subject: { include: { teacher: true } }
      }
    });

    // Saldo inicial
    await this.prisma.pointBalance.create({
      data: { studentId, subjectId: subject.id, amount: 0 },
    });

    return enrollment;
  }

  // --- VER MIS MATERIAS (DASHBOARD ESTUDIANTE) ---
  // 🔥 MODIFICADO: Ahora inyectamos el saldo real de PointBalance en el objeto enrollment
  async getMyEnrolledSubjects(studentId: string) {
    const enrollments = await this.prisma.enrollment.findMany({
      where: { studentId },
      orderBy: { joinedAt: 'desc' }, 
      include: {
        subject: {
          include: {
            teacher: {
              select: { id: true, fullName: true, avatarUrl: true }
            }
          }
        }, 
      },
    });

    // Buscamos los balances de puntos de este estudiante
    const balances = await this.prisma.pointBalance.findMany({
      where: { studentId }
    });

    // Combinamos los datos: reemplazamos accumulatedPoints (de enrollment) por amount (de PointBalance)
    return enrollments.map(e => {
      const balance = balances.find(b => b.subjectId === e.subjectId);
      return {
        ...e,
        accumulatedPoints: balance ? balance.amount : 0 // Esto es lo que lee el frontend
      };
    });
  }

  // --- VER ESTUDIANTES (PARA PROFESOR) ---
  async getStudentsBySubject(subjectId: string) {
    const enrollments = await this.prisma.enrollment.findMany({
      where: { subjectId },
      include: {
        student: {
          select: { id: true, fullName: true, email: true, avatarUrl: true, studentCode: true }
        }
      },
      orderBy: { joinedAt: 'desc' }
    });

    const studentIds = enrollments.map(e => e.studentId);
    const balances = await this.prisma.pointBalance.findMany({
      where: {
        subjectId: subjectId,
        studentId: { in: studentIds }
      }
    });

    return enrollments.map(e => {
      const balance = balances.find(b => b.studentId === e.studentId);
      return { 
        ...e.student, 
        joinedAt: e.joinedAt,
        accumulatedPoints: balance ? balance.amount : 0 
      };
    });
  }

  // --- SALIR DE LA CLASE ---
  async leaveSubject(studentId: string, subjectId: string) {
    const enrollment = await this.prisma.enrollment.findFirst({
      where: { 
        studentId: studentId,
        subjectId: subjectId
      }
    });

    if (!enrollment) {
      throw new NotFoundException('No estás inscrito en esta materia o ya saliste de ella.');
    }

    return this.prisma.enrollment.delete({
      where: { id: enrollment.id }
    });
  }
}