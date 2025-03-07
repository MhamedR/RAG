import { Controller, Post, Body, Get, Query, UseGuards, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { RagService } from './rag.service';
import { AuthGuard } from '@nestjs/passport';
import { ApiKeyGuard } from '../auth/api-key.guard';

@Controller('api/rag')
@UseGuards(ApiKeyGuard)
export class RagController {
  private readonly logger = new Logger(RagController.name);

  constructor(private readonly ragService: RagService) {
    this.logger.log('RagController initialized');
  }

  @Post('index')
  async indexDocument(
    @Body() body: { documentId: string; content: string; metadata?: Record<string, any> },
  ) {
    try {
      this.logger.log(`Indexing document with ID: ${body.documentId}`);
      await this.ragService.indexDocument(
        body.documentId,
        body.content,
        body.metadata || {},
      );
      return { success: true, message: 'Document indexed successfully' };
    } catch (error) {
      this.logger.error(`Failed to index document: ${error.message}`);
      return { success: false, message: error.message };
    }
  }

  @Get('query')
  async queryRag(@Query('query') query: string) {
    try {
      this.logger.log(`Processing RAG query: ${query}`);
      if (!query) {
        return { answer: 'No query provided.' };
      }
      
      const result = await this.ragService.queryDocuments(query);
      return result;
    } catch (error) {
      this.logger.error(`Error processing query: ${error.message}`);
      return { answer: `Error: ${error.message}` };
    }
  }
} 