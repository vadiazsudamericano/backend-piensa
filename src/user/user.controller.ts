import { Body, Controller, Patch, Get, UseGuards } from '@nestjs/common'; // Agregué Get
import { User } from '@prisma/client';
import { GetUser } from '../auth/decorator/get-user.decorator';
import { JwtGuard } from '../auth/guard/jwt.guard';
import { EditUserDto } from './dto/edit-user.dto';
import { UserService } from './user.service';

@UseGuards(JwtGuard)
@Controller('users')
export class UserController {
  constructor(private userService: UserService) {}

  // 🔥 NUEVO: Obtener perfil (necesario para cargar los datos en el frontend)
  @Get('me')
  getMe(@GetUser() user: User) {
      return user;
  }

  // 🔥 Guardar cambios
  @Patch('me') 
  editUser(@GetUser('id') userId: string, @Body() dto: EditUserDto) {
    return this.userService.editUser(userId, dto);
  }
}