import { 
  WebSocketGateway, 
  SubscribeMessage, 
  WebSocketServer, 
  OnGatewayConnection, 
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { GameBattleService } from './game-battle.service';

// --- Definiciones de Tipos de Sala y Jugador ---

interface Player {
    studentId: string;
    playerName: string;
    isMaster: boolean;
    clientId: string; // ID del socket
}

interface Press {
    studentId: string;
    playerName: string;
    timestamp: number;
    order: number;
}

interface Room {
    roomId: string;
    players: Player[];
    pressOrder: Press[];
    currentQuestion: string | null;
    isRoundOpen: boolean; // Indica si los jugadores pueden pulsar el botón
}

// --- Gateway ---

@WebSocketGateway({
    cors: {
        origin: '*', // Permitir conexiones desde cualquier origen para desarrollo
    },
})
export class GameBattleGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer() server: Server;
    private readonly logger = new Logger(GameBattleGateway.name);
    // Almacenamiento del estado de todas las salas activas
    private rooms: Map<string, Room> = new Map();

    constructor(private readonly gameBattleService: GameBattleService) {}

    // --- Lógica de Conexión y Desconexión ---

    handleConnection(client: Socket, ...args: any[]) {
        this.logger.log(`Cliente conectado: ${client.id}`);
    }

    handleDisconnect(client: Socket) {
        this.logger.log(`Cliente desconectado: ${client.id}`);
        
        // Recorrer todas las salas para encontrar y eliminar al jugador
        this.rooms.forEach((room, roomId) => {
            const initialCount = room.players.length;
            room.players = room.players.filter(p => p.clientId !== client.id);
            
            if (room.players.length < initialCount) {
                this.logger.log(`Jugador ${client.id} removido de la sala ${roomId}.`);
                // Notificar a los demás jugadores en la sala
                this.server.to(roomId).emit('playersUpdate', { players: room.players });
                
                // Si la sala se queda vacía (solo queda el maestro o nadie), se podría cerrar
                if (room.players.length === 0) {
                    this.rooms.delete(roomId);
                    this.logger.warn(`Sala ${roomId} cerrada por estar vacía.`);
                }
            }
        });
    }

    // --- Manejador de la Unión a la Sala ('joinGame') ---

    @SubscribeMessage('joinGame')
    async handleJoinGame(@ConnectedSocket() client: Socket, @MessageBody() data: { roomId: string, studentId: string, playerName: string, isMaster: boolean }) {
        const { roomId, studentId, playerName, isMaster } = data;
        
        // Unir el socket a la sala de Socket.IO
        await client.join(roomId);

        // Inicializar la sala si no existe
        if (!this.rooms.has(roomId)) {
            this.rooms.set(roomId, {
                roomId,
                players: [],
                pressOrder: [],
                currentQuestion: null,
                isRoundOpen: false, // La ronda comienza cerrada
            });
            this.logger.log(`Sala ${roomId} creada.`);
        }

        const room = this.rooms.get(roomId);
        
        // Evitar duplicados. Si ya está, se elimina el antiguo (por si se reconecta)
        room.players = room.players.filter(p => p.studentId !== studentId);

        // Añadir el nuevo jugador
        room.players.push({ studentId, playerName, isMaster, clientId: client.id });

        this.logger.log(`${playerName} (${studentId}) se ha unido a la sala ${roomId}. Es Maestro: ${isMaster}`);
        
        // Notificar a todos en la sala la lista actualizada de jugadores
        this.server.to(roomId).emit('playersUpdate', { players: room.players.map(p => ({ name: p.playerName, id: p.studentId, isMaster: p.isMaster })) });
        
        // Si hay una pregunta activa, enviarla al nuevo cliente
        if (room.currentQuestion && room.isRoundOpen) {
             client.emit('newQuestion', { question: room.currentQuestion });
        }
    }

    // --- NUEVO: Manejador para Enviar Pregunta e Iniciar Ronda ('sendQuestion') ---

    @SubscribeMessage('sendQuestion')
    async handleSendQuestion(@ConnectedSocket() client: Socket, @MessageBody() data: { roomId: string, question: string }) {
        const room = this.rooms.get(data.roomId);
        
        if (!room) {
            this.logger.error(`[ERROR] Sala ${data.roomId} no encontrada al enviar pregunta.`);
            client.emit('statusUpdate', { message: 'Error: Sala no encontrada.', type: 'error' });
            return;
        }
        
        // 1. Limpiar el estado de la ronda anterior
        room.pressOrder = [];
        room.currentQuestion = data.question;
        room.isRoundOpen = true; // Abrir el juego para pulsaciones
        
        // 2. Notificar al maestro que se ha enviado (para actualizar su UI)
        client.emit('statusUpdate', { message: 'Pregunta enviada. Ronda ABIERTA.', type: 'question_sent' });
        
        // 3. Notificar a todos los estudiantes la nueva pregunta y que la ronda está abierta
        this.server.to(data.roomId).emit('newQuestion', { question: data.question });
        
        // --- NUEVA DEPURACIÓN DE CONTEO DE SOCKETS ---
        try {
            const socketsInRoom = await this.server.in(data.roomId).fetchSockets();
            const numClients = socketsInRoom.length;
            const clientIds = socketsInRoom.map(s => s.id);
            this.logger.log(`[DEPURACIÓN DE EMISIÓN] Sala ${data.roomId} tiene ${numClients} sockets conectados (IDs: ${clientIds.join(', ')}).`);
            if (numClients <= 1) { // Solo el maestro o nadie
                this.logger.warn(`ADVERTENCIA: Solo hay ${numClients} sockets en la sala. ¿Hay estudiantes conectados?`);
            }
        } catch (e) {
             this.logger.error(`Error al obtener sockets para la sala ${data.roomId}: ${e.message}`);
        }
        // ---------------------------------------------
        
        this.logger.log(`[EVENTO DEPURACIÓN CLAVE] Pregunta enviada a ${data.roomId}. Ronda ABIERTA. Emitiendo 'newQuestion' a ${data.roomId}`);
        
        // 4. Asegurarse de que el maestro vea que la ronda está libre para pulsar
        this.server.to(data.roomId).emit('statusUpdate', { message: '¡Ronda ABIERTA! Esperando pulsación.', type: 'open' });
    }

    // --- Manejador de la Pulsación del Botón ('buttonPress') ---

    @SubscribeMessage('buttonPress')
    handleButtonPress(@ConnectedSocket() client: Socket, @MessageBody() data: { roomId: string, studentId: string, playerName: string, subjectId: string }) {
        const room = this.rooms.get(data.roomId);

        if (!room || !room.isRoundOpen) {
            client.emit('statusUpdate', { message: 'Ronda BLOQUEADA o no ha comenzado.', type: 'BLOCKED' });
            return;
        }

        // Verificar si el jugador ya pulsó en esta ronda
        const alreadyPressed = room.pressOrder.some(p => p.studentId === data.studentId);
        if (alreadyPressed) {
            client.emit('statusUpdate', { message: 'Ya presionaste en esta ronda.', type: 'BLOCKED_SELF' });
            return;
        }

        // 1. Registrar la pulsación
        const newPress: Press = {
            studentId: data.studentId,
            playerName: data.playerName,
            timestamp: Date.now(),
            order: room.pressOrder.length + 1,
        };
        room.pressOrder.push(newPress);
        
        // 2. Determinar si fue el primero
        const isFirst = newPress.order === 1;

        // 3. Notificar a todos (incluido el maestro)
        this.server.to(data.roomId).emit('playerPressed', {
            studentId: newPress.studentId,
            playerName: newPress.playerName,
            timestamp: newPress.timestamp,
            order: newPress.order,
            isFirst: isFirst
        });

        this.logger.log(`Pulsación registrada en ${data.roomId}: ${data.playerName}. Orden: ${newPress.order}`);
        
        // 4. Bloquear la ronda si fue el primero para evitar spam
        if (isFirst) {
            room.isRoundOpen = false;
            // Notificar que la ronda está bloqueada
            this.server.to(data.roomId).emit('statusUpdate', { message: 'Ronda BLOQUEADA (Alguien ha pulsado primero).', type: 'BLOCKED' });
        }
    }

    // --- NUEVO: Manejador para Declarar Ganador ('selectWinner') ---

    @SubscribeMessage('selectWinner')
    async handleSelectWinner(@ConnectedSocket() client: Socket, @MessageBody() data: { roomId: string, subjectId: string }) {
        const room = this.rooms.get(data.roomId);
        
        if (!room) {
            client.emit('statusUpdate', { message: 'Error: Sala no encontrada.', type: 'error' });
            return;
        }

        const winnerPress = room.pressOrder[0];
        
        if (!winnerPress) {
            client.emit('statusUpdate', { message: 'Error: Nadie ha pulsado todavía.', type: 'error' });
            return;
        }

        // 1. Registrar la victoria y los puntos en la base de datos
        try {
            await this.gameBattleService.registerWin(winnerPress.studentId, data.subjectId);
        } catch (error) {
            this.logger.error(`Fallo DB al registrar ganador: ${error.message}`);
            client.emit('statusUpdate', { message: 'Error en DB al registrar ganador.', type: 'error' });
            return;
        }

        // 2. Finalizar la ronda
        room.isRoundOpen = false;
        room.currentQuestion = null; // Limpiar pregunta actual
        room.pressOrder = []; // Limpiar orden de pulsaciones

        // 3. Notificar a toda la sala
        this.server.to(data.roomId).emit('gameWinner', { 
            winnerId: winnerPress.studentId, 
            winnerName: winnerPress.playerName,
            points: 10 // Puntos ganados (del service)
        });
        
        this.logger.log(`Ganador de la ronda en ${data.roomId}: ${winnerPress.playerName}. Puntos registrados.`);
    }
    
    // --- NUEVO: Manejador para Reiniciar el Juego ('resetGame') ---

    @SubscribeMessage('resetGame')
    handleResetGame(@ConnectedSocket() client: Socket, @MessageBody() data: { roomId: string }) {
        const room = this.rooms.get(data.roomId);
        
        if (!room) {
            client.emit('statusUpdate', { message: 'Error: Sala no encontrada.', type: 'error' });
            return;
        }

        // Limpiar completamente el estado de la ronda
        room.pressOrder = [];
        room.currentQuestion = null;
        room.isRoundOpen = false; // Se abre de nuevo con 'sendQuestion'

        this.logger.log(`Ronda reiniciada en ${data.roomId}.`);

        // Notificar a toda la sala que se ha reiniciado
        this.server.to(data.roomId).emit('statusUpdate', { 
            message: 'El Maestro ha reiniciado la ronda. Esperando nueva pregunta.', 
            type: 'reset' 
        });
    }
}