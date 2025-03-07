import { Controller, Get, Query, Res, UseGuards, Logger } from '@nestjs/common';
import { Response } from 'express';
import { LlamaService } from './llama.service';
import { ApiKeyGuard } from '../auth/api-key.guard';

@Controller('api/ai')
export class AiController {
  private readonly logger = new Logger(AiController.name);

  constructor(private readonly llamaService: LlamaService) {
    this.logger.log('AI Controller initialized with LlamaService');
  }

  @Get()
  @UseGuards(ApiKeyGuard)
  async getAiResponse(
    @Query('prompt') prompt: string,
    @Res() res: Response,
  ): Promise<any> {
    this.logger.log(
      `Processing AI request with prompt: ${prompt?.substring(0, 30)}...`,
    );

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    try {
      this.logger.log('Calling LlamaService streamCompletion');
      await this.llamaService.streamCompletion(prompt, res);
    } catch (error: any) {
      this.logger.error(
        `Error processing AI request: ${error.message}`,
        error.stack,
      );
      return res.status(500).json({ error: 'Failed to process AI request' });
    }
  }
} 