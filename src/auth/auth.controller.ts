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
import { diskStorage } from 'multer'; // 🔥 Agregado para persistencia en disco
import { extname } from 'path'; // 🔥 Agregado para manejar extensiones (.jpg, .png)
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
   * Configuración de almacenamiento para convertir archivos locales en URLs públicas.
   */
  @UseGuards(JwtGuard)
  @Patch('me')
  @UseInterceptors(
    FileInterceptor('avatar', {
      storage: diskStorage({
        destination: './uploads', // Carpeta física en Railway
        filename: (req, file, cb) => {
          // Generamos un nombre único para evitar colisiones
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
    /**
     * 📸 CONSTRUCCIÓN DE LA URL REAL:
     * Si el estudiante sube un archivo, transformamos la ruta del disco en un link HTTP.
     */
    if (file) {
      const serverUrl = process.env.SERVER_URL || 'http://localhost:3000';
      dto.avatarUrl = `${serverUrl}/uploads/${file.filename}`;
    }
    
    return this.authService.editUser(userId, dto);
  }
}