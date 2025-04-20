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
import { LlamaService } from '../ai/llama.service';
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
    private readonly llamaService: LlamaService,
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
      // Check if payload exists before accessing its properties
      if (!payload) {
        this.logger.error('Received undefined payload from client');
        client.emit('error', {
          message: 'Invalid request: payload is missing',
        });
        return;
      }

      // Log the message in a safe way
      try {
        const promptPreview = typeof payload.prompt === 'string' ? 
          (payload.prompt.length > 50 ? `${payload.prompt.slice(0, 50)}...` : payload.prompt) : 
          'undefined';
        this.logger.log(`Received message from client ${client.id}: ${promptPreview}`);
      } catch (logError) {
        this.logger.warn(`Failed to log client message: ${logError.message}`);
      }
      
      // Check if prompt is provided
      if (!payload.prompt) {
        this.logger.warn(`Client ${client.id} sent a message without a prompt`);
        client.emit('error', {
          message: 'Invalid request: prompt is required',
        });
        return;
      }
      
      let response: string;
      
      // Use RAG if requested
      if (payload.useRag) {
        response = await this.ragService.query(typeof payload.prompt === 'string' ? payload.prompt : '');
      } else {
        response = await this.llamaService.getCompletion(typeof payload.prompt === 'string' ? payload.prompt : '');
      }
      
      // Send the response back to the client
      client.emit('chat-response', {
        content: response,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      const errorMessage = error && typeof error === 'object' && 'message' in error 
        ? String(error.message) 
        : 'Unknown error';
      
      const errorStack = error && typeof error === 'object' && 'stack' in error 
        ? String(error.stack) 
        : '';
      
      this.logger.error(`Error processing WebSocket message: ${errorMessage}`, errorStack);
      client.emit('error', {
        message: 'Failed to process your request',
        error: errorMessage,
      });
    }
  }
} 