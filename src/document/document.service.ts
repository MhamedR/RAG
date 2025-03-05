import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';
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
    this.ensureUploadDirectoryExists();
  }

  private ensureUploadDirectoryExists() {
    if (!fs.existsSync(this.uploadPath)) {
      fs.mkdirSync(this.uploadPath, { recursive: true });
    }
  }

  async processFile(file: Express.Multer.File, metadata: any): Promise<string> {
    try {
      const filePath = path.join(this.uploadPath, file.originalname);
      
      // Save the file
      fs.writeFileSync(filePath, file.buffer);
      
      // Extract text based on file type
      let content: string;
      if (file.mimetype === 'application/pdf') {
        content = await this.extractTextFromPdf(filePath);
      } else if (file.mimetype === 'text/plain') {
        content = fs.readFileSync(filePath, 'utf8');
      } else {
        throw new Error(`Unsupported file type: ${file.mimetype}`);
      }
      
      // Chunk the content if it's too large (simplified implementation)
      const chunks = this.chunkContent(content);
      
      // Index each chunk
      const chunkIds: string[] = [];
      for (let i = 0; i < chunks.length; i++) {
        const chunkMetadata = {
          ...metadata,
          source: file.originalname,
          chunkIndex: i,
          totalChunks: chunks.length,
        };
        
        const chunkId = await this.ragService.indexDocument(chunks[i], chunkMetadata);
        chunkIds.push(chunkId);
      }
      
      this.logger.log(`Successfully processed document: ${file.originalname}`);
      return chunkIds.join(',');
    } catch (error) {
      this.logger.error(`Failed to process document: ${error.message}`, error.stack);
      throw error;
    }
  }

  private async extractTextFromPdf(filePath: string): Promise<string> {
    try {
      const dataBuffer = fs.readFileSync(filePath);
      const result = await pdfParse(dataBuffer);
      return result.text;
    } catch (error) {
      this.logger.error(`Failed to extract text from PDF: ${error.message}`, error.stack);
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