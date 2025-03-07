import { Module } from '@nestjs/common';
import { LlamaController } from './llama.controller';
import { LlamaService } from './llama.service';
import { AiService } from './ai.service';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [ConfigModule],
  controllers: [LlamaController],
  providers: [LlamaService, AiService],
  exports: [LlamaService, AiService],
})
export class AiModule {} 