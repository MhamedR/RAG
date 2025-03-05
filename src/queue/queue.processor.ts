import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { OpenAIService } from '../ai/openai.service';
import { AiTaskData } from './queue.service';

@Processor('ai-tasks')
export class QueueProcessor {
  private readonly logger = new Logger(QueueProcessor.name);

  constructor(private readonly openAiService: OpenAIService) {}

  @Process('process-ai-request')
  async handleAiRequest(job: Job<AiTaskData>): Promise<string> {
    try {
      this.logger.log(`Processing AI request job ${job.id}`);
      const { prompt } = job.data;

      // Process the AI request
      const result = await this.openAiService.getCompletion(prompt);
      
      this.logger.log(`Successfully processed job ${job.id}`);
      return result;
    } catch (error) {
      this.logger.error(
        `Failed to process AI request job ${job.id}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }
} 