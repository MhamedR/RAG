import { Module } from '@nestjs/common';
import { ConfigModule } from './config/config.module';
import { AiModule } from './ai/ai.module';
import { AuthModule } from './auth/auth.module';
import { QueueModule } from './queue/queue.module';
import { RagModule } from './rag/rag.module';
import { DocumentModule } from './document/document.module';
import { WebsocketModule } from './websocket/websocket.module';

@Module({
  imports: [
    ConfigModule,
    AuthModule,
    AiModule,
    QueueModule,
    RagModule,
    DocumentModule,
    WebsocketModule,
  ],
})
export class AppModule {} 