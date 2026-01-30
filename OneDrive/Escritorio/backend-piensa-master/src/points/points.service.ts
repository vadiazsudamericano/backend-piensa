import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AssignPointsDto } from './dto/assign-points.dto';
import { TransactionType } from '@prisma/client';

@Injectable()
export class PointsService {
  constructor(private prisma: PrismaService) {}

  async assignPoints(teacherId: string, dto: AssignPointsDto) {
    const amountToAssign = dto.amount || 100; // Default 100 puntos

    // Verificaciones de Seguridad

    // 1. Verificar que la materia existe y que el profesor SÍ es dueño de esa materia
    const subject = await this.prisma.subject.findFirst({
      where: {
        id: dto.subjectId,
        teacherId: teacherId, //  Solo el profesor dueño puede dar puntos
      },
    });

    if (!subject) {
      throw new ForbiddenException(
        'Materia no encontrada o no tienes permiso para asignar puntos en ella',
      );
    }

    // 2. Verificar que el estudiante esté inscrito en esa materia
    const enrollment = await this.prisma.enrollment.findFirst({
      where: {
        studentId: dto.studentId,
        subjectId: dto.subjectId,
      },
    });

    if (!enrollment) {
      throw new NotFoundException(
        'El estudiante no está inscrito en esta materia',
      );
    }

    // Lógica de Asignación 
    // Usamos una transacción de Prisma para asegurar que ambas operaciones (actualizar saldo y crear historial)
    // ocurran correctamente, o ninguna ocurra.

    try {
      const transaction = await this.prisma.$transaction(async (prisma) => {
        // 1. Actualizar el saldo del estudiante incrementar
        const pointBalance = await prisma.pointBalance.update({
          where: {
            studentId_subjectId: {
              studentId: dto.studentId,
              subjectId: dto.subjectId,
            },
          },
          data: {
            amount: {
              increment: amountToAssign,
            },
          },
        });

        // 2. Crear un registro en el historial de transacciones
        await prisma.pointTransaction.create({
          data: {
            amount: amountToAssign, // Positivo porque es ganado
            type: TransactionType.EARNED,
            reason: dto.reason || 'Puntos asignados por profesor',
            studentId: dto.studentId,
            subjectId: dto.subjectId,
          },
        });

        return pointBalance; // Devolvemos el saldo actualizado
      });

      return transaction;
    } catch (error) {
      // Manejar el caso donde el PointBalance no existe (aunque no debería pasar si 'join' funcionó)
      if (error.code === 'P2025') { 
        throw new NotFoundException('No se encontró el saldo de puntos para este estudiante en esta materia');
      }
      throw error;
    }
  }

  async getStudentBalanceForSubject(studentId: string, subjectId: string) {
    return this.prisma.pointBalance.findUnique({
      where: {
        studentId_subjectId: {
          studentId,
          subjectId,
        },
      },
    });
  }
}