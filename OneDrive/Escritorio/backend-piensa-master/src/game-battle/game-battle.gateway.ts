// src/game-battle/game-battle.gateway.ts
import { 
  WebSocketGateway, 
  SubscribeMessage, 
  MessageBody, 
  WebSocketServer, 
  ConnectedSocket 
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { GameBattleService } from './game-battle.service'; 

@WebSocketGateway({
  cors: {
    origin: '*', 
  },
})
export class GameBattleGateway {
  @WebSocketServer() 
  server: Server;

  private pressOrder: string[] = []; 
  private pressLocked: boolean = false; 

  constructor(private readonly gameBattleService: GameBattleService) {}

  handleConnection(client: Socket) {
    console.log(`Cliente conectado: ${client.id}`);
    client.emit('statusUpdate', { message: 'Conectado al campo de batalla.' });
  }

  handleDisconnect(client: Socket) {
    console.log(`Cliente desconectado: ${client.id}`);
  }

  @SubscribeMessage('buttonPress')
  async handleButtonPress(
    @MessageBody() data: { studentId: string; subjectId: string; playerName: string },
    @ConnectedSocket() client: Socket,
  ) {
    const { studentId, playerName, subjectId } = data;

    if (!studentId || !playerName || typeof playerName !== 'string' || !subjectId) {
        client.emit('statusUpdate', { message: 'Error: Datos incompletos.', type: 'error' });
        return; 
    }

    if (this.pressLocked) {
      client.emit('statusUpdate', { message: 'Ronda finalizada. Espera el reinicio.' });
      return;
    }

    if (this.pressOrder.includes(studentId)) {
      client.emit('statusUpdate', { message: 'Ya presionaste el botón esta ronda.' });
      return;
    }

    this.pressOrder.push(studentId);
    const order = this.pressOrder.length;
    const isFirst = order === 1;

    this.server.emit('playerPressed', {
      order: order,
      playerName: playerName,
      studentId: studentId,
      isFirst: isFirst,
    });

    if (isFirst) {
      this.pressLocked = true;
      
      await this.gameBattleService.registerWin(studentId, subjectId);
      
      this.server.emit('gameWinner', { 
          winnerName: playerName.trim(), 
          message: `${playerName.trim()} presionó primero y ganó la ronda!` 
      });
    }
  }

  @SubscribeMessage('resetGame')
  handleResetGame() {
    this.pressOrder = []; 
    this.pressLocked = false; 
    
    this.server.emit('statusUpdate', { message: '¡El juego ha sido reiniciado! Presiona el botón para comenzar la nueva ronda.' });
  }
}