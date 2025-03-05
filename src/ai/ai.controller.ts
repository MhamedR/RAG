import { Controller, Get, Query, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { OpenAIService } from '../../../src/ai/openai.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('api/ai')
export class AiController {
  constructor(private readonly openAIService: OpenAIService) {}

  @Get()
  @UseGuards(AuthGuard(['jwt', 'api-key']))
  async getAiResponse(
    @Query('prompt') prompt: string,
    @Res() res: Response,
  ): Promise<void> {
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    await this.openAIService.streamCompletion(prompt, res);
  }
} 