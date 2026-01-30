import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const GetUser = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const request: Express.Request = ctx.switchToHttp().getRequest();
    if (data) {
      // Si pedimos un campo específico (ej: @GetUser('id'))
      return request.user[data];
    }
    // Si no, devolvemos todo el usuario
    return request.user;
  },
);