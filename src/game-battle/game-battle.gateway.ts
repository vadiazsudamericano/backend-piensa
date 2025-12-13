import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';

interface WinBroadcastPayload {
  winnerId: string;
  winnerName: string;   // ← agregado
  points: number;
  subjectId: string;
}

@WebSocketGateway({
  cors: { origin: '*' },
  namespace: '/battle', // namespace PRO para evitar conflictos
})
export class GameBattleGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(GameBattleGateway.name);
  private connectedStudents = new Map<string, string>();

  handleConnection(client: Socket) {
    this.logger.log(`🔌 Cliente conectado → ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    const studentId = this.connectedStudents.get(client.id);
    this.connectedStudents.delete(client.id);
    this.logger.warn(
      `❌ Cliente desconectado → ${client.id} (${studentId || 'sin identificar'})`,
    );
  }

  @SubscribeMessage('register-student')
  handleRegisterStudent(
    @MessageBody() data: { studentId: string },
    @ConnectedSocket() client: Socket,
  ) {
    if (!data?.studentId) {
      this.logger.error('⚠ Evento register-student sin studentId');
      return;
    }

    this.connectedStudents.set(client.id, data.studentId);

    this.logger.log(
      `🎮 Estudiante registrado en batalla → ${data.studentId} (socket: ${client.id})`,
    );

    client.emit('register-confirmed', {
      ok: true,
      studentId: data.studentId,
    });
  }

  /**
   * Broadcast global de victoria
   */
  broadcastWin(payload: WinBroadcastPayload) {
    this.logger.verbose(
      `📣 Broadcast → Ganador ${payload.winnerName} (+${payload.points} pts)`,
    );
    this.server.emit('battle-win', payload);
  }

  /**
   * Enviar mensaje solo a un estudiante
   */
  sendToStudent(studentId: string, event: string, data: any) {
    for (const [socketId, sid] of this.connectedStudents.entries()) {
      if (sid === studentId) {
        this.server.to(socketId).emit(event, data);
        this.logger.log(
          `🎯 Mensaje enviado a estudiante → ${studentId} (evento: ${event})`,
        );
      }
    }
  }

  @SubscribeMessage('ping')
  handlePing(@ConnectedSocket() client: Socket) {
    client.emit('pong', { timestamp: Date.now() });
  }
}
