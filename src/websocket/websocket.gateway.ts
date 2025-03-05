import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Injectable, Logger } from '@nestjs/common';
import { OpenAIService } from '../ai/openai.service';
import { RagService } from '../rag/rag.service';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
@Injectable()
export class WebsocketGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;
  private readonly logger = new Logger(WebsocketGateway.name);

  constructor(
    private readonly openAiService: OpenAIService,
    private readonly ragService: RagService,
  ) {}

  async handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('chat-message')
  async handleChatMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { prompt: string; useRag: boolean },
  ) {
    try {
      this.logger.log(`Received message from client ${client.id}: ${payload.prompt.substring(0, 50)}...`);
      
      let response: string;
      
      // Use RAG if requested
      if (payload.useRag) {
        response = await this.ragService.query(payload.prompt);
      } else {
        response = await this.openAiService.getCompletion(payload.prompt);
      }
      
      // Send the response back to the client
      client.emit('chat-response', {
        content: response,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      this.logger.error(`Error processing WebSocket message: ${error.message}`, error.stack);
      client.emit('error', {
        message: 'Failed to process your request',
        error: error.message,
      });
    }
  }
} 