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
import { Logger } from '@nestjs/common';
import { AiService } from '../ai/ai.service';
import { RagService } from '../rag/rag.service';

enum MessageType {
  AI_COMPLETION = 'ai_completion',
  RAG_QUERY = 'rag_query',
}

interface MessagePayload {
  type: MessageType;
  prompt: string;
}

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class WebsocketGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;
  private readonly logger = new Logger(WebsocketGateway.name);

  constructor(
    private readonly aiService: AiService,
    private readonly ragService: RagService,
  ) {}

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('message')
  async handleMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: MessagePayload,
  ) {
    try {
      this.logger.log(`Received message from ${client.id}: ${JSON.stringify(payload)}`);
      
      let response;
      
      if (payload.type === MessageType.AI_COMPLETION) {
        this.logger.log('Processing AI completion request');
        response = await this.aiService.getCompletion(payload.prompt);
      } else if (payload.type === MessageType.RAG_QUERY) {
        this.logger.log('Processing RAG query request');
        response = await this.ragService.queryDocuments(payload.prompt);
      } else {
        response = { error: 'Invalid message type' };
      }
      
      client.emit('response', response);
    } catch (error) {
      this.logger.error(`Error processing message: ${error.message}`);
      client.emit('response', { error: `Error: ${error.message}` });
    }
  }
} 