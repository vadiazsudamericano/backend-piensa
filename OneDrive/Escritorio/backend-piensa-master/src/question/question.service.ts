import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateQuestionDto } from './dto/create-question.dto';

@Injectable()
export class QuestionService {
  constructor(private prisma: PrismaService) {}

  //Profesor Crea una nueva pregunta con sus opciones
  async createQuestion(teacherId: string, dto: CreateQuestionDto) {
    // 1. Verificar que el profesor es dueño de la materia
    const subject = await this.prisma.subject.findFirst({
      where: {
        id: dto.subjectId,
        teacherId: teacherId, // El profesor que llama debe ser el dueño
      },
    });

    if (!subject) {
      throw new ForbiddenException(
        'No tienes permiso para añadir preguntas a esta materia',
      );
    }

    // 2. Crear la pregunta y sus opciones anidadas en una transacción
    const question = await this.prisma.question.create({
      data: {
        text: dto.text,
        subjectId: dto.subjectId,
        options: {
          // "create" anidado crea las 4 opciones ligadas a esta pregunta
          create: dto.options.map((opt) => ({
            text: opt.text,
            isCorrect: opt.isCorrect,
          })),
        },
      },
      include: {
        options: true, // Devuelve la pregunta con las opciones creadas
      },
    });

    return question;
  }

  //App Móvil Obtiene las preguntas para una batalla

  async getQuestionsForSubject(subjectId: string) {
    return this.prisma.question.findMany({
      where: { subjectId },
      include: {
        options: {
          select: {
            id: true,
            text: true,
          },
        },
      },
    });
  }
}