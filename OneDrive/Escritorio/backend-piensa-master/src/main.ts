import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { ServerOptions } from 'socket.io';

/**
 * Extends IoAdapter to configure CORS directly on the WebSocket server.
 * This is necessary because app.enableCors() only applies to HTTP/REST, not to WS.
 */
class SocketIoAdapter extends IoAdapter {
  createIOServer(port: number, options?: ServerOptions): any {
    const server = super.createIOServer(port, {
      ...options,
      // CORS configuration for the WebSocket adapter
      cors: {
        origin: '*', // Allow any origin for testing purposes
        methods: ['GET', 'POST'],
        credentials: true
      },
    });
    return server;
  }
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 1. Activate global validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // 2. Activate CORS for HTTP requests
  app.enableCors(); 
  
  // 3. Use the Socket.IO adapter with CORS configured
  app.useWebSocketAdapter(new SocketIoAdapter(app)); 

  const PORT = process.env.PORT || 3000;
  await app.listen(PORT);
  
  console.log(`🚀 Application is running on: ${await app.getUrl()}`);
}

bootstrap();