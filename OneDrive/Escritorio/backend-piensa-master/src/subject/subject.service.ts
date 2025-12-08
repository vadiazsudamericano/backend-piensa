import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSubjectDto } from './dto/create-subject.dto';

@Injectable()
export class SubjectService {
  constructor(private prisma: PrismaService) {}

  async createSubject(userId: string, dto: CreateSubjectDto) {
    // 1. Generar un código único de 4 caracteres
    const joinCode = this.generateUniqueCode(4);

    // 2. Guardar la materia en la base de datos
    const subject = await this.prisma.subject.create({
      data: {
        name: dto.name,
        cycle: dto.cycle,
        year: dto.year,
        joinCode: joinCode,
        teacherId: userId, // Asignamos al usuario que hizo la petición como profesor
      },
    });

    return subject;
  }

  async getSubjectsForTeacher(teacherId: string) {
    return this.prisma.subject.findMany({
      where: {
        teacherId: teacherId,
      },
    });
  }

  // --- Función Auxiliar para generar códigos ---
  private generateUniqueCode(length: number): string {
    const characters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Sin I, O, 0, 1 para evitar confusiones
    let result = '';
    for (let i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
  }
}