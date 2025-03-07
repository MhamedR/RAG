import { Controller, Post, Body, Get, Query, UseGuards, HttpException, HttpStatus } from '@nestjs/common';
import { RagService } from './rag.service';
import { AuthGuard } from '@nestjs/passport';
import { ApiKeyGuard } from '../auth/api-key.guard';

@Controller('api/rag')
export class RagController {
  constructor(private readonly ragService: RagService) {}

  @Post('index')
  @UseGuards(ApiKeyGuard)
  async indexContent(
    @Body() body: { documentId: string; content: string; metadata?: Record<string, any> },
  ) {
    try {
      const { documentId, content, metadata = {} } = body;
      await this.ragService.indexDocument(documentId, content, metadata);
      return { success: true, message: 'Content indexed successfully' };
    } catch (error) {
      throw new HttpException(
        `Failed to index content: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('query')
  @UseGuards(ApiKeyGuard)
  async queryRag(@Query('query') query: string) {
    try {
      if (!query) {
        throw new HttpException('Query parameter is required', HttpStatus.BAD_REQUEST);
      }
      
      const result = await this.ragService.query(query);
      return result;
    } catch (error) {
      throw new HttpException(
        `Failed to query RAG: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
} 