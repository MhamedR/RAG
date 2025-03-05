import { Module } from '@nestjs/common';
import { WebsocketGateway } from './websocket.gateway';
import { AiModule } from '../ai/ai.module';
import { RagModule } from '../rag/rag.module';

@Module({
  imports: [AiModule, RagModule],
  providers: [WebsocketGateway],
  exports: [WebsocketGateway],
})
export class WebsocketModule {} 