import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class GameBattleService {
  constructor(private prisma: PrismaService) {}

  // Obtener todos los bancos de un maestro
  async getTeacherSubjects(teacherId: string) {
    return await this.prisma.subject.findMany({
      where: { teacherId },
      include: {
        _count: {
          select: { questions: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  // Crear un banco simple (Método antiguo/simple)
  async createSubject(name: string, teacherId: string) {
    return await this.prisma.subject.create({
      data: {
        name,
        teacher: { connect: { id: teacherId } }, 
        cycle: 'Ciclo Actual',
        year: new Date().getFullYear(),
        joinCode: Math.random().toString(36).substring(2, 6).toUpperCase(),
      }
    });
  }

  // 🔥 ESTE ES EL MÉTODO QUE TE FALTA Y QUE SOLUCIONA LA CARGA INFINITA 🔥
  async createFullSubject(data: { 
    name: string; 
    teacherId: string; 
    questions: { 
      question_text: string; 
      answers: string[]; 
      correct_answer_index: number 
    }[] 
  }) {
    // Usamos transacción: Se guarda todo (banco + preguntas + opciones) o nada
    return await this.prisma.$transaction(async (tx) => {
      
      // 1. Crear el Banco
      const newSubject = await tx.subject.create({
        data: {
          name: data.name,
          teacher: { connect: { id: data.teacherId } },
          cycle: 'Ciclo Actual', 
          year: new Date().getFullYear(),
          joinCode: Math.random().toString(36).substring(2, 8).toUpperCase(),
        }
      });

      // 2. Crear preguntas y opciones
      for (const q of data.questions) {
        await tx.question.create({
          data: {
            text: q.question_text,
            subjectId: newSubject.id,
            options: {
              create: q.answers.map((ansText, index) => ({
                text: ansText,
                isCorrect: index === q.correct_answer_index
              }))
            }
          }
        });
      }

      return newSubject;
    });
  }

  // Obtener pregunta aleatoria
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

  // Validar respuesta y sumar puntos
  async validateAndAssignPoints(studentName: string, optionId: string, subjectId: string, points: number) {
    const option = await this.prisma.option.findUnique({
      where: { id: optionId },
      include: { question: true }
    });

    if (!option || !option.isCorrect) return { success: false };
 
    const student = await this.prisma.user.findFirst({ where: { fullName: studentName } });
    if (!student) return { success: false };
 
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