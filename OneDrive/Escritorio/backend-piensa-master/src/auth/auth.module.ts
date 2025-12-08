import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './strategy/jwt.strategy';

@Module({
  imports: [
    // Importamos ConfigModule para poder usar variables de entorno
    ConfigModule,
    
    // Importamos Passport (necesario para la estrategia JWT)
    PassportModule.register({ defaultStrategy: 'jwt' }),

    // Registramos el módulo JWT
    JwtModule.registerAsync({
      imports: [ConfigModule], // Importamos ConfigModule para usarlo aquí
      inject: [ConfigService], // Inyectamos ConfigService
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get('JWT_SECRET'), // Lee el secreto desde .env
        signOptions: {
          expiresIn: '7d', // Configura la expiración del token
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy], // Proveemos el servicio y la estrategia
})
export class AuthModule {}