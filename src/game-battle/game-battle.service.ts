import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class GameBattleService {
  constructor(private prisma: PrismaService) {}

  // Obtener todos los bancos de un maestro con conteo de preguntas
  async getTeacherSubjects(teacherId: string) {
    return await this.prisma.subject.findMany({
      where: { teacherId },
      include: {
        _count: {
          select: { questions: true }
        }
      }
    });
  }

  // Crear un nuevo banco desde el panel
  async createSubject(name: string, teacherId: string) {
    return await this.prisma.subject.create({
      data: {
        name,
        teacher: { connect: { id: teacherId } },
        // Ajusta estos campos según tu esquema de Prisma
        cycle: 'Ciclo Actual',
        year: new Date().getFullYear(),
        joinCode: Math.random().toString(36).substring(2, 6).toUpperCase(),
      }
    });
  }

  // Obtener una pregunta aleatoria de un banco específico
  async getRandomQuestion(subjectId: string) {
    const questions = await this.prisma.question.findMany({
      where: { subjectId },
      include: { options: true }
    });

    if (questions.length === 0) {
      throw new BadRequestException('El banco seleccionado no tiene preguntas.');
    }

    return questions[Math.floor(Math.random() * questions.length)];
  }

  // Validar respuesta y sumar puntos en la DB
  async validateAndAssignPoints(studentName: string, optionId: string, subjectId: string, points: number) {
    const option = await this.prisma.option.findUnique({
      where: { id: optionId },
      include: { question: true }
    });

    if (!option || !option.isCorrect) return { success: false };

    // Buscamos al estudiante por nombre (asegúrate de que el nombre sea único o usa ID)
    const student = await this.prisma.user.findFirst({ where: { fullName: studentName } });
    if (!student) return { success: false };

    // Actualizamos o creamos el balance de puntos
    const updatedBalance = await this.prisma.pointBalance.upsert({
      where: {
        studentId_subjectId: { studentId: student.id, subjectId }
      },
      update: { amount: { increment: points } },
      create: { studentId: student.id, subjectId, amount: points }
    });

    return { success: true, totalPoints: updatedBalance.amount };
  }
}