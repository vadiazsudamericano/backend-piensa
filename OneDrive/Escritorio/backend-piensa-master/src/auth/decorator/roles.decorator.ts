import { SetMetadata } from '@nestjs/common';
import { Role } from '@prisma/client';

export const ROLES_KEY = 'roles';
// El decorador @Roles('TEACHER', 'ADMIN')
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);