import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EditUserDto } from './dto/edit-user.dto';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  // Obtener mi perfil
  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) throw new NotFoundException('Usuario no encontrado');

    // Retornamos el usuario sin la contraseña
    const { password, ...result } = user;
    return result;
  }

  // Editar perfil
  async editUser(userId: string, dto: EditUserDto) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        ...dto,
      },
    });

    const { password, ...result } = user;
    return result;
  }
}