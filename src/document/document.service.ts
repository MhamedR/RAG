import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as pdfParse from 'pdf-parse';
import { RagService } from '../rag/rag.service';

@Injectable()
export class DocumentService {
  private readonly logger = new Logger(DocumentService.name);
  private readonly uploadPath: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly ragService: RagService,
  ) {
    this.uploadPath = this.configService.get<string>('DOCUMENT_UPLOAD_PATH') || './uploads';
  }

  async processFile(
    file: Express.Multer.File,
    metadata: Record<string, unknown>,
  ): Promise<string[]> {
    try {
      this.logger.log('🔍 DEBUG: processFile method called');
      
      if (!file) {
        this.logger.error('File is undefined');
        throw new Error('File is undefined');
      }
      
      this.logger.log(`⚠️ DEBUG: File details - buffer: ${file.buffer ? 'exists' : 'missing'}, size: ${file.buffer?.length || 0}`);
      
      // Check if buffer exists
      if (!file.buffer || file.buffer.length === 0) {
        this.logger.error('File buffer is missing or empty');
        throw new Error('File buffer is missing or empty');
      }
      
      // Extract text from buffer directly
      let content: string = '';
      
      try {
        // Determine file type
        const isPdf = 
          file.mimetype === 'application/pdf' || 
          (file.originalname && file.originalname.toLowerCase().endsWith('.pdf'));
          
        if (isPdf) {
          this.logger.log(`Parsing PDF with buffer size: ${file.buffer.length}`);
          const pdfResult = await pdfParse(file.buffer);
          content = pdfResult.text;
        } else {
          // Default to text for any other file type
          content = file.buffer.toString('utf8');
        }
        
        this.logger.log(`Extracted ${content.length} characters from file`);
      } catch (extractionError) {
        this.logger.error(`Text extraction error: ${extractionError.message}`);
        content = `[Failed to extract content from ${file.originalname || 'unknown file'}]`;
      }
      
      // Chunk the content
      const chunks = this.chunkContent(content);
      
      // Index each chunk
      const chunkIds: string[] = [];
      for (let i = 0; i < chunks.length; i++) {
        const chunkId = `${(file.originalname || 'unnamed').replace(/\s+/g, '_')}_chunk_${i}`;
        const chunkMetadata = {
          ...metadata,
          source: file.originalname || 'unnamed',
          chunkIndex: i,
          totalChunks: chunks.length,
        };
        
        try {
          await this.ragService.indexDocument(chunkId, chunks[i], chunkMetadata);
          chunkIds.push(chunkId);
        } catch (indexError) {
          this.logger.error(`Error indexing chunk ${i}: ${indexError.message}`);
          // Continue with other chunks
        }
      }
      
      this.logger.log(`Successfully processed document: ${file.originalname || 'unnamed'}`);
      return chunkIds;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to process document: ${errorMessage}`);
      throw error;
    }
  }

  private chunkContent(content: string, chunkSize: number = 1000): string[] {
    const words = content.split(/\s+/);
    const chunks: string[] = [];
    
    for (let i = 0; i < words.length; i += chunkSize) {
      chunks.push(words.slice(i, i + chunkSize).join(' '));
    }
    
    return chunks;
  }
} 