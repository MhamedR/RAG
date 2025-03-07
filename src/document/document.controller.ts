import { Controller, Post, UploadedFile, UseInterceptors, Body, UseGuards, HttpException, HttpStatus } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { DocumentService } from './document.service';
import { AuthGuard } from '@nestjs/passport';
import { ApiKeyGuard } from '../auth/api-key.guard';

@Controller('api/documents')
export class DocumentController {
  constructor(private readonly documentService: DocumentService) {}

  @Post('upload')
  @UseGuards(ApiKeyGuard)
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Body() metadata: Record<string, any>,
  ) {
    try {
      if (!file) {
        throw new HttpException('No file uploaded', HttpStatus.BAD_REQUEST);
      }
      
      const chunkIds = await this.documentService.processFile(file, metadata);
      
      return {
        success: true,
        message: 'File processed successfully',
        filename: file.originalname,
        chunkIds,
      };
    } catch (error) {
      throw new HttpException(
        `Failed to process file: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
} 