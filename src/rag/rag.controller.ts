import { Controller, Post, Body, Get, Query, UseGuards } from '@nestjs/common';
import { RagService } from './rag.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('api/rag')
export class RagController {
  constructor(private readonly ragService: RagService) {}

  @Post('index')
  @UseGuards(AuthGuard(['jwt', 'api-key']))
  async indexContent(
    @Body() data: { content: string; metadata: any },
  ) {
    const { content, metadata } = data;
    const documentId = await this.ragService.indexDocument(content, metadata);
    return { success: true, documentId };
  }

  @Get('query')
  @UseGuards(AuthGuard(['jwt', 'api-key']))
  async queryRag(@Query('query') query: string) {
    if (!query) {
      return { error: 'Query parameter is required' };
    }
    
    const answer = await this.ragService.query(query);
    return { answer };
  }
} 