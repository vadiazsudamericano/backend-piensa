import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { GetUser } from '../auth/decorator/get-user.decorator';
import { Roles } from '../auth/decorator/roles.decorator';
import { JwtGuard } from '../auth/guard/jwt.guard';
import { RolesGuard } from '../auth/guard/roles.guard';
import { CreateQuestionDto } from './dto/create-question.dto';
import { QuestionService } from './question.service';

@UseGuards(JwtGuard, RolesGuard) // Protegemos todo el controlador
@Controller('questions')
export class QuestionController {
  constructor(private questionService: QuestionService) {}

  //(Profesor) Endpoint para crear una nueva pregunta POST /questions
  @Post()
  @Roles(Role.TEACHER) // Solo profesores
  createQuestion(
    @GetUser('id') teacherId: string,
    @Body() dto: CreateQuestionDto,
  ) {
    return this.questionService.createQuestion(teacherId, dto);
  }

  @Get()
  getQuestionsForSubject(@Query('subjectId') subjectId: string) {
    // Cualquier usuario logueado (estudiante o profe) puede ver las preguntas
    return this.questionService.getQuestionsForSubject(subjectId);
  }
}