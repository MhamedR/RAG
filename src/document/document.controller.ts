import { Controller, Post, UploadedFile, UseInterceptors, Body, UseGuards } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { DocumentService } from './document.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('api/documents')
export class DocumentController {
  constructor(private readonly documentService: DocumentService) {}

  @Post('upload')
  @UseGuards(AuthGuard(['jwt', 'api-key']))
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: { title?: string; description?: string },
  ) {
    if (!file) {
      return { error: 'No file uploaded' };
    }

    const metadata = {
      title: body.title || file.originalname,
      description: body.description || '',
      uploadDate: new Date(),
    };

    const result = await this.documentService.processFile(file, metadata);
    
    return {
      success: true,
      fileName: file.originalname,
      metadata,
      result,
    };
  }
} 