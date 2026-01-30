import {
  Body,
  Controller,
  Post,
  HttpCode,
  HttpStatus,
  UseGuards,
  Get,
  Patch,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer'; 
import { extname } from 'path'; 
import { AuthService } from './auth.service';
import { AuthDto } from './dto/auth.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { EditUserDto } from './dto/edit-user.dto';
import { JwtGuard } from './guard/jwt.guard';
import { GetUser } from './decorator/get-user.decorator';
import { User } from '@prisma/client';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('signup')
  signup(@Body() dto: CreateUserDto) {
    return this.authService.signup(dto);
  }

  @HttpCode(HttpStatus.OK)
  @Post('signin')
  signin(@Body() dto: AuthDto) {
    return this.authService.signin(dto);
  }

  @UseGuards(JwtGuard)
  @Get('me')
  getMe(@GetUser() user: User) {
    return user;
  }

  /**
   * 🔥 CORRECCIÓN FINAL: 
   * Se procesa el archivo y se asegura que el DTO reciba la información del FormData.
   */
  @UseGuards(JwtGuard)
  @Patch('me')
  @UseInterceptors(
    FileInterceptor('avatar', {
      storage: diskStorage({
        destination: './uploads', 
        filename: (req, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, `${file.fieldname}-${uniqueSuffix}${extname(file.originalname)}`);
        },
      }),
    }),
  )
  async editUser(
    @GetUser('id') userId: string, 
    @Body() dto: EditUserDto,
    @UploadedFile() file?: any
  ) {
    // 🔍 LOG DE DEPURACIÓN PARA RAILWAY
    console.log('--- Datos recibidos en el Controller ---');
    console.log('UserId:', userId);
    console.log('DTO Cuerpo:', dto);
    console.log('Archivo:', file ? file.filename : 'Ninguno');

    /**
     * 📸 CONSTRUCCIÓN DE LA URL REAL:
     * Transformamos la ruta del disco en un link HTTP accesible desde la APK.
     */
    if (file) {
      // Asegúrate de tener configurado SERVER_URL en Railway con https://
      const serverUrl = process.env.SERVER_URL || 'http://localhost:3000';
      dto.avatarUrl = `${serverUrl}/uploads/${file.filename}`;
    }
    
    return this.authService.editUser(userId, dto);
  }
}