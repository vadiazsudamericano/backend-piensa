import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '@prisma/client';
import { ROLES_KEY } from '../decorator/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // Obtiene los roles requeridos del decorador @Roles
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // Si no se especifican roles permite el acceso
    if (!requiredRoles) {
      return true;
    }

    // Obtiene el usuario que JwtGuard ya puso en el request
    const { user } = context.switchToHttp().getRequest();

    // Comprueba si el rol del usuario está en la lista de roles requeridos
    return requiredRoles.some((role) => user.role === role);
  }
}