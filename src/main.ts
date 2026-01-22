import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { ServerOptions } from 'socket.io';

/**
 * Extends IoAdapter to configure CORS directamente en el servidor WebSocket.
 */
class SocketIoAdapter extends IoAdapter {
  createIOServer(port: number, options?: ServerOptions): any {
    const server = super.createIOServer(port, {
      ...options,
      cors: {
        origin: '*', // Permitir todos los orígenes para la conexión desde la APK
        methods: ['GET', 'POST'],
        credentials: true
      },
    });
    return server;
  }
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 1. Activar validación global
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // 2. Activar CORS para peticiones HTTP
  // 🔥 Ajustado para mayor compatibilidad con dispositivos móviles
  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  }); 
  
  // 3. Usar el adaptador Socket.IO configurado
  app.useWebSocketAdapter(new SocketIoAdapter(app)); 

  // 🔥 Railway requiere escuchar en 0.0.0.0 para ser accesible externamente
  const PORT = process.env.PORT || 3000;
  await app.listen(PORT, '0.0.0.0');
  
  // Modificamos el log para que no falle al intentar obtener URL interna en Railway
  console.log(`🚀 Servidor corriendo en el puerto: ${PORT}`);
}

bootstrap();