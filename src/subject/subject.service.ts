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

  /**
   * 🔥 MÉTODO ACTUALIZADO: Borrado seguro en cascada manual
   * Elimina todas las dependencias de la materia antes de borrarla para evitar errores 500.
   * Filtra estrictamente por subjectId para no afectar a otras clases.
   */
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

    // 3. Transacción para borrar todo lo asociado en el orden correcto
    return await this.prisma.$transaction(async (tx) => {
      
      // --- A. LIMPIEZA DE GAMIFICACIÓN ---
      
      // Buscar IDs de recompensas de ESTA materia para borrar sus solicitudes de canje
      const rewards = await tx.reward.findMany({ 
        where: { subjectId }, 
        select: { id: true } 
      });
      const rewardIds = rewards.map(r => r.id);

      if (rewardIds.length > 0) {
          // Borrar solicitudes de canje (RedemptionRequest) vinculadas solo a estas recompensas
          await tx.redemptionRequest.deleteMany({ 
            where: { rewardId: { in: rewardIds } } 
          });
      }

      // Borrar las recompensas (Reward) de ESTA materia
      await tx.reward.deleteMany({ where: { subjectId } });

      // Borrar historial de transacciones de puntos (PointTransaction) de ESTA materia
      await tx.pointTransaction.deleteMany({ where: { subjectId } });

      // Borrar saldos de puntos actuales (PointBalance) de ESTA materia
      await tx.pointBalance.deleteMany({ where: { subjectId } });
      
      // --- B. LIMPIEZA DE INSCRIPCIONES Y ALUMNOS ---
      
      // Borrar inscripciones (Enrollment) solo de ESTA materia
      await tx.enrollment.deleteMany({ where: { subjectId } });

      // --- C. LIMPIEZA DEL BANCO DE PREGUNTAS (BATALLAS) ---

      // Buscar IDs de preguntas de ESTA materia para borrar sus opciones primero
      const questions = await tx.question.findMany({ 
        where: { subjectId }, 
        select: { id: true } 
      });
      const questionIds = questions.map(q => q.id);
      
      if (questionIds.length > 0) {
          // Borrar opciones de respuesta (Option) vinculadas a estas preguntas
          await tx.option.deleteMany({ 
            where: { questionId: { in: questionIds } } 
          });
      }
      
      // Borrar las preguntas (Question) de ESTA materia
      await tx.question.deleteMany({ where: { subjectId } });

      // --- D. ELIMINACIÓN FINAL ---

      // Finalmente, borrar la materia principal (Subject)
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