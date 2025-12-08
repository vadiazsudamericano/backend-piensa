import { ForbiddenException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { PrismaService } from '../prisma/prisma.service';
import { AuthDto } from './dto/auth.dto';
import { CreateUserDto } from './dto/create-user.dto';
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
   * REGISTRO DE NUEVO USUARIO
   * @param dto Datos del nuevo usuario (email, pass, nombre, rol)
   */
  async signup(dto: CreateUserDto) {
    // Encriptar la contraseña
    const hash = await bcrypt.hash(dto.password, 10);

    try {
      // Guardar el nuevo usuario en la DB
      const user = await this.prisma.user.create({
        data: {
          email: dto.email,
          password: hash,
          fullName: dto.fullName,
          role: dto.role || 'STUDENT', // Por defecto 'STUDENT'
        },
      });

      // Devolvuelve token de sesion
      return this.signToken(user.id, user.email, user.role);
    } catch (error) {
      // Maneja error si el email ya existe
      if (error instanceof PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ForbiddenException('Este email ya está en uso');
        }
      }
      throw error;
    }
  }

  /**
   * INICIO DE SESIÓN
   * @param dto Credenciales (email, password)
   */
  async signin(dto: AuthDto) {
    // Encontrar al usuario por email
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    // Si no existe, lanzar error
    if (!user) {
      throw new ForbiddenException('Credenciales incorrectas');
    }

    // Comparar contraseñas
    const pwMatches = await bcrypt.compare(dto.password, user.password);

    // Si no coinciden, lanzar error
    if (!pwMatches) {
      throw new ForbiddenException('Credenciales incorrectas');
    }

    // Devolver un token de sesión
    return this.signToken(user.id, user.email, user.role);
  }

 // Función auxiliar para firmar el token JWT
  private async signToken(
    userId: string,
    email: string,
    role: Role,
  ): Promise<{ access_token: string }> {
    const payload = {
      sub: userId,
      email,
      role,
    };
    const secret = this.config.get('JWT_SECRET');

    const token = await this.jwt.signAsync(payload, {
      expiresIn: '7d', // Token válido por 7 días
      secret: secret,
    });

    return {
      access_token: token,
    };
  }
}