import { 
  WebSocketGateway, 
  WebSocketServer, 
  SubscribeMessage, 
  MessageBody, 
  ConnectedSocket 
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { GameBattleService } from './game-battle.service';

@WebSocketGateway({ cors: { origin: '*' }, namespace: 'battle' })
export class GameBattleGateway {
  @WebSocketServer() server: Server;

  private rooms = new Map<string, {
    roomId: string;
    teacherId: string;
    subjectId: string;
    roundActive: boolean;
    students: any[];
  }>();

  constructor(private readonly gameService: GameBattleService) {}

  @SubscribeMessage('create-room')
  async handleCreateRoom(@MessageBody() data: { teacherId: string }, @ConnectedSocket() client: Socket) {
    const roomId = Math.random().toString(36).substring(2, 6).toUpperCase();
    const subjects = await this.gameService.getTeacherSubjects(data.teacherId);
    
    this.rooms.set(roomId, {
      roomId,
      teacherId: data.teacherId,
      subjectId: '',
      roundActive: false,
      students: []
    });

    client.join(roomId);
    client.emit('room-created', { roomId, mySubjects: subjects });
  }

  @SubscribeMessage('create-new-subject')
  async handleNewSubject(@MessageBody() data: { name: string, teacherId: string }, @ConnectedSocket() client: Socket) {
    try {
      await this.gameService.createSubject(data.name, data.teacherId);
      const subjects = await this.gameService.getTeacherSubjects(data.teacherId);
      client.emit('subjects-updated', { mySubjects: subjects });
    } catch (e) {
      client.emit('error', 'No se pudo crear el banco.');
    }
  }

  @SubscribeMessage('join-room')
  handleJoinRoom(@MessageBody() data: { roomId: string, studentName: string }, @ConnectedSocket() client: Socket) {
    const room = this.rooms.get(data.roomId.toUpperCase());
    if (!room) return client.emit('error', 'Sala no encontrada');

    const newStudent = { name: data.studentName, socketId: client.id, points: 0, hasAnswered: false };
    room.students.push(newStudent);
    
    client.join(room.roomId);
    this.server.to(room.roomId).emit('room-update', { students: room.students });
  }

  @SubscribeMessage('start-question')
  async handleStartQuestion(@MessageBody() data: { roomId: string, subjectId: string }) {
    const room = this.rooms.get(data.roomId.toUpperCase());
    if (!room) return;

    try {
      const question = await this.gameService.getRandomQuestion(data.subjectId);
      room.roundActive = true;
      room.subjectId = data.subjectId;
      room.students.forEach(s => s.hasAnswered = false);

      this.server.to(room.roomId).emit('new-question', {
        text: question.text,
        options: question.options.map(o => ({ id: o.id, text: o.text }))
      });
      this.server.to(room.roomId).emit('room-update', { students: room.students });
    } catch (e) {
      this.server.to(room.roomId).emit('error', e.message);
    }
  }

  @SubscribeMessage('submit-answer')
  async handleSubmitAnswer(
    @MessageBody() data: { roomId: string, studentName: string, optionId: string },
    @ConnectedSocket() client: Socket
  ) {
    const room = this.rooms.get(data.roomId.toUpperCase());
    if (!room || !room.roundActive) return;

    const student = room.students.find(s => s.name === data.studentName);
    if (!student || student.hasAnswered) return;

    student.hasAnswered = true;
    const result = await this.gameService.validateAndAssignPoints(data.studentName, data.optionId, room.subjectId, 10);

    if (result.success) {
      room.roundActive = false;
      student.points = result.totalPoints;
      this.server.to(room.roomId).emit('round-result', { 
        winnerName: student.name, 
        students: room.students 
      });
    } else {
      this.server.to(room.roomId).emit('room-update', { students: room.students });
    }
  }
}