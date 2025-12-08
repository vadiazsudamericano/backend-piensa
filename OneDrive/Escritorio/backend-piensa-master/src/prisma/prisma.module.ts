// src/prisma/prisma.module.ts
import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Global() // <-- ¡Importante! Hace que el módulo sea accesible desde toda la app
@Module({
  providers: [PrismaService],
  exports: [PrismaService], // Exportamos el servicio para que otros lo usen
})
export class PrismaModule {}