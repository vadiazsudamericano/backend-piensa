import { 
  WebSocketGateway, 
  WebSocketServer, 
  SubscribeMessage, 
  MessageBody, 
  ConnectedSocket 
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { GameBattleService } from './game-battle.service';
 
interface GameRoom {
  roomId: string;
  teacherId: string;
  subjectId: string;
  status: 'waiting' | 'active' | 'results' | 'finished';
  students: any[];
  currentQuestion?: any;
  totalAnswers: number;
  name?: string;
  usedQuestionIds: Set<string>; // NUEVO: Rastreo de preguntas usadas
}

@WebSocketGateway({ cors: { origin: '*' }, namespace: 'battle' })
export class GameBattleGateway {
  @WebSocketServer() server: Server;
  
  private rooms = new Map<string, GameRoom>();

  constructor(private readonly gameService: GameBattleService) {}

  // ... (MÉTODOS DE BANCOS Y RECONEXIÓN IGUALES - OMITIDOS PARA BREVEDAD, DEJARLOS COMO ESTABAN) ...
  // Si necesitas que los repita, avísame, pero asumo que ya los tienes bien.
  // Aquí solo modifico la lógica de juego.

  // ... (handleReconnectControl, handleGetSubjects, handleCreateFullSubject IGUALES) ...
  @SubscribeMessage('reconnect-control')
  async handleReconnectControl(@MessageBody() data: { roomId: string; teacherId: string }, @ConnectedSocket() client: Socket) {
      // ... (código previo) ...
      // Asegúrate de enviar también 'usedQuestionIds' o el conteo si quieres mostrar progreso al reconectar
      // Por ahora lo dejamos simple.
      const room = this.rooms.get(data.roomId);
      if (!room || room.teacherId !== data.teacherId) return client.emit('error', 'Error de acceso');
      client.join(room.roomId);
      const subjects = await this.gameService.getTeacherSubjects(data.teacherId);
      
      // Enviamos estado de reconexión
      client.emit('reconnect-success', {
          roomId: room.roomId,
          code: room.roomId,
          name: room.name,
          status: room.status,
          students: room.students,
          currentQuestion: room.currentQuestion,
          mySubjects: subjects,
          // Enviamos cuántas llevamos
          questionsPlayed: room.usedQuestionIds.size
      });
  }
  
  @SubscribeMessage('get-my-subjects')
  async handleGetSubjects(@MessageBody() data: { teacherId: string }, @ConnectedSocket() client: Socket) {
    try {
      const subjects = await this.gameService.getTeacherSubjects(data.teacherId);
      client.emit('subjects-list', subjects);
      client.emit('subjects-updated', { mySubjects: subjects });
    } catch (e) { console.error(e); }
  }

  @SubscribeMessage('create-full-subject')
  async handleCreateFullSubject(@MessageBody() data: any, @ConnectedSocket() client: Socket) {
    try {
      const newSubject = await this.gameService.createFullSubject(data); 
      client.emit('subject-created-success', { newSubjectId: newSubject.id }); 
      const subjects = await this.gameService.getTeacherSubjects(data.teacherId);
      client.emit('subjects-updated', { mySubjects: subjects });
      client.emit('subjects-list', subjects); 
    } catch (e) { client.emit('error', 'Error: ' + e.message); }
  }


  // --- JUEGO CORE MODIFICADO ---

  @SubscribeMessage('create-room')
  async handleCreateRoom(
    @MessageBody() data: { teacherId: string; name?: string }, 
    @ConnectedSocket() client: Socket
  ) {
    const roomId = Math.random().toString(36).substring(2, 6).toUpperCase();
    const subjects = await this.gameService.getTeacherSubjects(data.teacherId);
    
    const roomName = data.name || `Sala ${roomId}`; 

    this.rooms.set(roomId, {
      roomId,
      teacherId: data.teacherId,
      subjectId: '',
      status: 'waiting',
      students: [],
      totalAnswers: 0,
      name: roomName,
      usedQuestionIds: new Set() // Inicializamos vacío
    });

    client.join(roomId);
    
    client.emit('room-created', { 
      roomId, 
      code: roomId, 
      name: roomName, 
      mySubjects: subjects 
    });
  }

  @SubscribeMessage('join-room')
  handleJoinRoom(@MessageBody() data: { roomId: string, studentName: string }, @ConnectedSocket() client: Socket) {
    const room = this.rooms.get(data.roomId.toUpperCase());
    if (!room) return client.emit('error', 'Sala no encontrada');

    let student = room.students.find(s => s.name === data.studentName);
    if (!student) {
      student = { 
        id: client.id,
        name: data.studentName, 
        socketId: client.id, 
        score: 0, 
        lastAnswerCorrect: false,
        lastPointsEarned: 0
      };
      room.students.push(student);
    } else {
      student.socketId = client.id;
    }
    
    client.join(room.roomId);
    this.server.to(room.roomId).emit('room-update', { 
      students: room.students,
      status: room.status 
    });
  }

  @SubscribeMessage('start-question')
  async handleStartQuestion(@MessageBody() data: { roomId: string, subjectId?: string }) {
    const room = this.rooms.get(data.roomId.toUpperCase());
    if (!room) return;

    // Si viene subjectId (primera vez o cambio), lo seteamos
    if (data.subjectId) {
        room.subjectId = data.subjectId;
        room.usedQuestionIds.clear(); // Reiniciamos historial si cambia de banco
    }

    try {
      // 1. Obtener TODAS las preguntas del banco (necesitas un método en service para esto, 
      //    o usar getRandomQuestion pero filtrando. Asumiré que getRandomQuestion puede devolver una que no esté en la lista negra
      //    o mejor aún, obtengamos todas y filtremos aquí).
      
      // OPCIÓN A: Pedir al servicio una pregunta aleatoria EXCLUYENDO las usadas
      // Necesitas modificar tu GameBattleService para aceptar 'excludeIds'.
      // Como no tengo tu service, haré una lógica simulada asumiendo que puedes obtener todas las preguntas del subject.
      
      // Supongamos que tienes un método 'getQuestionsBySubject(subjectId)'
      // Si no lo tienes, usa getRandomQuestion y reza para que no se repita, pero para hacerlo bien:
      
      const allQuestions = await this.gameService.getAllQuestions(room.subjectId); // <--- NECESITAS ESTE MÉTODO EN TU SERVICE
      // Si no tienes getAllQuestions, tendrás que implementar una lógica de "intentos" con getRandomQuestion, pero es sucio.
      // ASUMIREMOS QUE TIENES (O CREARÁS) getAllQuestions.
      
      // Filtramos las disponibles
      const availableQuestions = allQuestions.filter((q: any) => !room.usedQuestionIds.has(q.id));

      if (availableQuestions.length === 0) {
          // YA NO HAY PREGUNTAS -> FIN DEL JUEGO O AVISO
          this.server.to(room.roomId).emit('no-more-questions');
          return;
      }

      // Elegimos una al azar de las disponibles
      const question = availableQuestions[Math.floor(Math.random() * availableQuestions.length)];
      
      // Marcamos como usada
      room.usedQuestionIds.add(question.id);

      room.status = 'active';
      room.currentQuestion = question;
      room.totalAnswers = 0;
      room.students.forEach(s => { 
        s.hasAnswered = false; 
        s.lastAnswerCorrect = false;
        s.lastPointsEarned = 0;
      });

      // Enviamos la pregunta + info de progreso
      this.server.to(room.roomId).emit('new-question', {
        text: question.text,
        options: question.options.map((o: any) => ({ id: o.id, text: o.text })),
        duration: 20,
        questionNumber: room.usedQuestionIds.size, // Cuál vamos
        totalQuestions: allQuestions.length // Total del banco
      });
      
      this.server.to(room.roomId).emit('room-update', { status: 'active', totalAnswers: 0 });

    } catch (e) {
      this.server.to(room.roomId).emit('error', e.message);
    }
  }

  // ... (submit-answer, time-up, finishRound, end-battle IGUALES) ...
  @SubscribeMessage('submit-answer')
  async handleSubmitAnswer(@MessageBody() data: { roomId: string, studentName: string, optionId: string }, @ConnectedSocket() client: Socket) {
      // (Mismo código de antes)
      const room = this.rooms.get(data.roomId.toUpperCase());
      if (!room || room.status !== 'active') return;
      const student = room.students.find(s => s.name === data.studentName);
      if (!student || student.hasAnswered) return;
      student.hasAnswered = true;
      room.totalAnswers++;
      const result = await this.gameService.validateAndAssignPoints(data.studentName, data.optionId, room.subjectId, 100);
      if (result.success) {
          student.score = result.totalPoints;
          student.lastAnswerCorrect = true;
          student.lastPointsEarned = 100;
      } else {
          student.lastAnswerCorrect = false;
          student.lastPointsEarned = 0;
      }
      client.emit('answer-received');
      this.server.to(room.roomId).emit('room-update', { totalAnswers: room.totalAnswers, studentsCount: room.students.length });
      if (room.totalAnswers >= room.students.length) {
          this.finishRound(room);
      }
  }

  @SubscribeMessage('time-up')
  handleTimeUp(@MessageBody() data: { roomId: string }) {
      const room = this.rooms.get(data.roomId.toUpperCase());
      if (room && room.status === 'active') this.finishRound(room);
  }

  private finishRound(room: GameRoom) {
      room.status = 'results';
      const sortedStudents = [...room.students].sort((a, b) => b.score - a.score);
      room.students.forEach(student => {
          const rank = sortedStudents.findIndex(s => s.name === student.name) + 1;
          this.server.to(student.socketId).emit('round-result', {
              correct: student.lastAnswerCorrect,
              pointsEarned: student.lastPointsEarned,
              totalScore: student.score,
              rank: rank
          });
      });
      this.server.to(room.roomId).emit('round-finished', {
          ranking: sortedStudents.slice(0, 5),
          correctCount: room.students.filter(s => s.lastAnswerCorrect).length,
          incorrectCount: room.students.filter(s => !s.lastAnswerCorrect).length
      });
  }

  @SubscribeMessage('end-battle')
  handleEndBattle(@MessageBody() data: { roomId: string }) {
      const room = this.rooms.get(data.roomId.toUpperCase());
      if (!room) return;
      room.status = 'finished';
      this.server.to(room.roomId).emit('game-over', { 
          winners: [...room.students].sort((a, b) => b.score - a.score).slice(0, 3) 
      });
      this.rooms.delete(room.roomId);
  }
}