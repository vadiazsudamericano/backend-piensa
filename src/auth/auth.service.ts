import { ForbiddenException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { PrismaService } from '../prisma/prisma.service';
import { AuthDto } from './dto/auth.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { EditUserDto } from './dto/edit-user.dto'; 
import * as bcrypt from 'bcrypt';
import { Role } from '@prisma/client';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private config: ConfigService,
  ) {}

  /**
   * REGISTRO
   */
  async signup(dto: CreateUserDto) {
    const hash = await bcrypt.hash(dto.password, 10);
    const studentCode = await this.generateUniqueCode(5);

    try {
      const user = await this.prisma.user.create({
        data: {
          email: dto.email,
          password: hash,
          fullName: dto.fullName,
          role: dto.role || 'STUDENT',
          studentCode: studentCode,
        },
      });

      return this.signToken(user.id, user.email, user.role, user.studentCode);
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ForbiddenException('Este email ya está en uso');
        }
      }
      throw error;
    }
  }

  /**
   * LOGIN
   */
  async signin(dto: AuthDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user) throw new ForbiddenException('Credenciales incorrectas');

    const pwMatches = await bcrypt.compare(dto.password, user.password);

    if (!pwMatches) throw new ForbiddenException('Credenciales incorrectas');

    return this.signToken(user.id, user.email, user.role, user.studentCode);
  }

  /**
   * 🔥 EDITAR USUARIO (CORREGIDO Y OPTIMIZADO) 🔥
   * Este método ahora es la base para que el estudiante tenga su ID y Foto
   * siempre listos para las batallas.
   */
  async editUser(userId: string, dto: EditUserDto) {
    try {
      const user = await this.prisma.user.update({
        where: {
          id: userId,
        },
        data: {
          ...dto,
        },
      });

      // Borramos el password por seguridad antes de enviar la respuesta
      delete user.password; 
      
      // 💡 Devolvemos el usuario completo para que el frontend actualice el localStorage
      return user;
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ForbiddenException('El email ya está ocupado por otro usuario');
        }
      }
      throw error;
    }
  }

  // --- TOKEN ---
  private async signToken(
    userId: string, 
    email: string, 
    role: Role,
    studentCode?: string 
  ): Promise<{ access_token: string }> {
    
    const payload = { 
      sub: userId, 
      email, 
      role,
      studentCode 
    };
    
    const secret = this.config.get('JWT_SECRET');

    const token = await this.jwt.signAsync(payload, {
      expiresIn: '7d',
      secret: secret,
    });

    return { access_token: token };
  }

  private async generateUniqueCode(length: number): Promise<string> {
    const characters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; 
    let isUnique = false;
    let code = '';

    while (!isUnique) {
      code = '';
      for (let i = 0; i < length; i++) {
        code += characters.charAt(Math.floor(Math.random() * characters.length));
      }
      const existingUser = await this.prisma.user.findUnique({
        where: { studentCode: code },
      });
      if (!existingUser) isUnique = true;
    }
    return code;
  }
}