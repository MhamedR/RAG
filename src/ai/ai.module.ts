import { Module } from '@nestjs/common';
import { AiController } from './ai.controller';
import { OpenAIService } from './openai.service';

@Module({
  controllers: [AiController],
  providers: [OpenAIService],
  exports: [OpenAIService],
})
export class AiModule {} 