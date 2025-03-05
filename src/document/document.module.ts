import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { DocumentController } from './document.controller';
import { DocumentService } from './document.service';
import { RagModule } from '../rag/rag.module';

@Module({
  imports: [
    MulterModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        dest: configService.get<string>('DOCUMENT_UPLOAD_PATH') || './uploads',
      }),
    }),
    RagModule,
  ],
  controllers: [DocumentController],
  providers: [DocumentService],
  exports: [DocumentService],
})
export class DocumentModule {} 