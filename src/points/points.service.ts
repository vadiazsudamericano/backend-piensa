import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AssignPointsDto } from './dto/assign-points.dto';
import { TransactionType } from '@prisma/client';

@Injectable()
export class PointsService {
  constructor(private prisma: PrismaService) {}

  async assignPoints(teacherId: string, dto: AssignPointsDto) {
    const amountToAssign = dto.amount || 100;

    const subject = await this.prisma.subject.findFirst({
      where: {
        id: dto.subjectId,
        teacherId: teacherId, 
      },
    });

    if (!subject) {
      throw new ForbiddenException(
        'Materia no encontrada o no tienes permiso para asignar puntos en ella',
      );
    }

    const student = await this.prisma.user.findUnique({
      where: { studentCode: dto.studentCode }
    });

    if (!student) {
      throw new NotFoundException('Student not found');
    }

    const enrollment = await this.prisma.enrollment.findFirst({
      where: {
        studentId: student.id, 
        subjectId: dto.subjectId,
      },
    });

    if (!enrollment) {
      throw new NotFoundException('Student not enrolled');
    }

    try {
      const transaction = await this.prisma.$transaction(async (prisma) => {
        // A. Actualizar el saldo (PointBalance)
        const balance = await prisma.pointBalance.findUnique({
             where: {
                studentId_subjectId: {
                    studentId: student.id,
                    subjectId: dto.subjectId,
                }
             }
        });

        let updatedBalance;
        
        if (balance) {
            updatedBalance = await prisma.pointBalance.update({
                where: { id: balance.id },
                data: { amount: { increment: amountToAssign } }
            });
        } else {
            updatedBalance = await prisma.pointBalance.create({
                data: {
                    studentId: student.id,
                    subjectId: dto.subjectId,
                    amount: amountToAssign
                }
            });
        }

        // B. Crear registro en el historial (PointTransaction)
        await prisma.pointTransaction.create({
          data: {
            amount: amountToAssign,
            type: TransactionType.EARNED,
            reason: dto.reason || 'Puntos asignados por profesor',
            studentId: student.id,
            subjectId: dto.subjectId,
          },
        });

        return updatedBalance; 
      });

      return transaction;

    } catch (error) {
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