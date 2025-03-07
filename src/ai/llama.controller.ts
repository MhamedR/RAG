import {
  Controller,
  Get,
  Query,
  Res,
  UseGuards,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { Response } from 'express';
import { LlamaService } from './llama.service';
import { ApiKeyGuard } from '../auth/api-key.guard';

@Controller('api/llama')
@UseGuards(ApiKeyGuard)
export class LlamaController {
  private readonly logger = new Logger(LlamaController.name);

  constructor(private readonly llamaService: LlamaService) {
    this.logger.log('LlamaController initialized');
  }

  @Get()
  async getAiResponse(@Query('prompt') prompt: string, @Res() res: Response) {
    this.logger.log(`Processing AI request with prompt: ${prompt?.substring(0, 50)}...`);
    
    if (!prompt) {
      this.logger.error('No prompt provided');
      throw new BadRequestException('No prompt provided');
    }
    
    try {
      // Set headers for streaming
      res.setHeader('Content-Type', 'text/plain');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      
      // Stream the response
      await this.llamaService.streamCompletion(prompt, (token) => {
        res.write(token);
      });
      
      // End the response
      res.end();
    } catch (error) {
      this.logger.error(
        `Error processing AI request: ${error?.message || 'Unknown error'}`,
        error?.stack || 'No stack trace',
      );
      
      // If headers not sent yet, return error response
      if (!res.headersSent) {
        res.status(500).json({
          error: 'Failed to process AI request',
          message: error?.message || 'Unknown error',
        });
      } else {
        // If headers already sent, just end the response
        res.end(`\n\nError: ${error?.message || 'Unknown error'}`);
      }
    }
  }
} 