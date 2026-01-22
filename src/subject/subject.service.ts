import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSubjectDto } from './dto/create-subject.dto';

@Injectable()
export class SubjectService {
  constructor(private prisma: PrismaService) {}

  async createSubject(userId: string, dto: CreateSubjectDto) {
    const joinCode = this.generateUniqueCode(4);
    const subject = await this.prisma.subject.create({
      data: {
        name: dto.name,
        cycle: dto.cycle,
        year: dto.year,
        joinCode: joinCode,
        teacherId: userId,
      },
    });
    return subject;
  }

  async getSubjectsForTeacher(teacherId: string) {
    return this.prisma.subject.findMany({
      where: { teacherId: teacherId },
    });
  }

  // 🔥 NUEVO MÉTODO: Borrado seguro en cascada
  async deleteSubject(subjectId: string, teacherId: string) {
    // 1. Verificar que la materia exista
    const subject = await this.prisma.subject.findUnique({
      where: { id: subjectId },
    });

    if (!subject) throw new NotFoundException('Materia no encontrada');
    
    // 2. Verificar que pertenezca al profesor que intenta borrarla
    if (subject.teacherId !== teacherId) {
        throw new ForbiddenException('No tienes permiso para eliminar esta materia');
    }

    // 3. Transacción para borrar todo lo asociado
    return await this.prisma.$transaction(async (tx) => {
      // a. Borrar saldos de puntos
      await tx.pointBalance.deleteMany({ where: { subjectId } });
      
      // b. Borrar inscripciones de alumnos
      await tx.enrollment.deleteMany({ where: { subjectId } });

      // c. Borrar opciones de preguntas (requiere buscar los IDs de preguntas primero)
      const questions = await tx.question.findMany({ where: { subjectId }, select: { id: true } });
      const questionIds = questions.map(q => q.id);
      
      if (questionIds.length > 0) {
          await tx.option.deleteMany({ where: { questionId: { in: questionIds } } });
      }
      
      // d. Borrar preguntas
      await tx.question.deleteMany({ where: { subjectId } });

      // e. Finalmente, borrar la materia
      return await tx.subject.delete({ where: { id: subjectId } });
    });
  }

  private generateUniqueCode(length: number): string {
    const characters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
  }
}