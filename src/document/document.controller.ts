import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  UseGuards,
  Logger,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { DocumentService } from './document.service';
import { ApiKeyGuard } from '../auth/api-key.guard';

@Controller('api/documents')
@UseGuards(ApiKeyGuard)
export class DocumentController {
  private readonly logger = new Logger(DocumentController.name);

  constructor(private readonly documentService: DocumentService) {
    this.logger.log('DocumentController initialized');
  }

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(@UploadedFile() file: Express.Multer.File) {
    this.logger.log(`Received file upload request: ${file?.originalname || 'No file name'}`);
    
    if (!file) {
      this.logger.error('No file uploaded');
      throw new BadRequestException('No file uploaded');
    }
    
    try {
      // Log file details for debugging
      this.logger.log(`File details: name=${file.originalname}, type=${file.mimetype}, size=${file.size} bytes`);
      
      // Check if buffer exists
      if (!file.buffer || file.buffer.length === 0) {
        this.logger.error('File buffer is empty or undefined');
        throw new BadRequestException('File buffer is empty or undefined');
      }
      
      // Process the file
      const result = await this.documentService.processFile(file);
      
      if (!result.success) {
        this.logger.error(`Failed to process file: ${result.message}`);
        throw new InternalServerErrorException(result.message);
      }
      
      return {
        success: true,
        message: result.message,
      };
    } catch (error) {
      this.logger.error(`Error processing file upload: ${error.message}`, error.stack);
      
      if (error instanceof BadRequestException) {
        throw error; // Re-throw BadRequestException
      }
      
      throw new InternalServerErrorException('Failed to process document upload');
    }
  }
} 