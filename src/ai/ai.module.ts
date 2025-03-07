import { Module } from '@nestjs/common';
import { AiController } from './ai.controller';
import { LlamaService } from './llama.service';

@Module({
  controllers: [AiController],
  providers: [LlamaService],
  exports: [LlamaService],
})
export class AiModule {} 