import { 
  WebSocketGateway, 
  WebSocketServer, 
  SubscribeMessage, 
  MessageBody, 
  ConnectedSocket 
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { GameBattleService } from './game-battle.service';

// 1. CORRECCIÓN AQUÍ: Agregamos 'name' a la interfaz
interface GameRoom {
  roomId: string;
  teacherId: string;
  subjectId: string;
  status: 'waiting' | 'active' | 'results' | 'finished';
  students: any[];
  currentQuestion?: any;
  totalAnswers: number;
  name?: string; // <--- ESTO FALTABA PARA QUE NO DE ERROR
}

@WebSocketGateway({ cors: { origin: '*' }, namespace: 'battle' })
export class GameBattleGateway {
  @WebSocketServer() server: Server;
  
  private rooms = new Map<string, GameRoom>();

  constructor(private readonly gameService: GameBattleService) {}

  // =================================================================
  // 🔥 AGREGADO: MANEJO DE BANCOS DE PREGUNTAS
  // =================================================================

  @SubscribeMessage('get-my-subjects')
  async handleGetSubjects(@MessageBody() data: { teacherId: string }, @ConnectedSocket() client: Socket) {
    try {
      const subjects = await this.gameService.getTeacherSubjects(data.teacherId);
      client.emit('subjects-list', subjects);
      client.emit('subjects-updated', { mySubjects: subjects });
    } catch (e) {
      console.error(e);
    }
  }

  @SubscribeMessage('create-full-subject')
  async handleCreateFullSubject(
    @MessageBody() data: { name: string; teacherId: string; questions: any[] }, 
    @ConnectedSocket() client: Socket
  ) {
    console.log("📝 Creando banco:", data.name);
    try {
      const newSubject = await this.gameService.createFullSubject(data); 
      client.emit('subject-created-success', { newSubjectId: newSubject.id }); 
      
      const subjects = await this.gameService.getTeacherSubjects(data.teacherId);
      client.emit('subjects-updated', { mySubjects: subjects });
      client.emit('subjects-list', subjects); 

    } catch (e) {
      console.error("Error creando banco:", e);
      client.emit('error', 'No se pudo guardar el banco: ' + e.message);
    }
  }

  // =================================================================
  // JUEGO (CORE)
  // =================================================================

  // 2. CORRECCIÓN AQUÍ: Recibimos y manejamos el 'name'
  @SubscribeMessage('create-room')
  async handleCreateRoom(
    @MessageBody() data: { teacherId: string; name?: string }, // Recibimos nombre opcional
    @ConnectedSocket() client: Socket
  ) {
    const roomId = Math.random().toString(36).substring(2, 6).toUpperCase();
    const subjects = await this.gameService.getTeacherSubjects(data.teacherId);
    
    // Si viene nombre úsalo, si no usa el código
    const roomName = data.name || `Sala ${roomId}`; 

    this.rooms.set(roomId, {
      roomId,
      teacherId: data.teacherId,
      subjectId: '',
      status: 'waiting',
      students: [],
      totalAnswers: 0,
      name: roomName // Ahora TypeScript lo permite porque actualizamos la interface arriba
    });

    client.join(roomId);
    
    // Devolvemos el nombre al frontend para el título
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

    if (data.subjectId) room.subjectId = data.subjectId;

    try {
      const question = await this.gameService.getRandomQuestion(room.subjectId);
      
      room.status = 'active';
      room.currentQuestion = question;
      room.totalAnswers = 0;
      room.students.forEach(s => { 
        s.hasAnswered = false; 
        s.lastAnswerCorrect = false;
        s.lastPointsEarned = 0;
      });

      this.server.to(room.roomId).emit('new-question', {
        text: question.text,
        options: question.options.map((o: any) => ({ id: o.id, text: o.text })),
        duration: 20
      });
      
      this.server.to(room.roomId).emit('room-update', { status: 'active', totalAnswers: 0 });

    } catch (e) {
      this.server.to(room.roomId).emit('error', e.message);
    }
  }

  @SubscribeMessage('submit-answer')
  async handleSubmitAnswer(@MessageBody() data: { roomId: string, studentName: string, optionId: string }, @ConnectedSocket() client: Socket) {
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

    this.server.to(room.roomId).emit('room-update', { 
      totalAnswers: room.totalAnswers,
      studentsCount: room.students.length 
    });

    if (room.totalAnswers >= room.students.length) {
      this.finishRound(room);
    }
  }

  @SubscribeMessage('time-up')
  handleTimeUp(@MessageBody() data: { roomId: string }) {
    const room = this.rooms.get(data.roomId.toUpperCase());
    if (room && room.status === 'active') {
      this.finishRound(room);
    }
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