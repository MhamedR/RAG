import { Module } from '@nestjs/common';
import { ElasticsearchModule } from '@nestjs/elasticsearch';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ElasticsearchService } from './elasticsearch.service';
import { RagService } from './rag.service';
import { RagController } from './rag.controller';

@Module({
  imports: [
    ElasticsearchModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const node = configService.get<string>('ELASTICSEARCH_NODE');
        const username = configService.get<string>('ELASTICSEARCH_USERNAME');
        const password = configService.get<string>('ELASTICSEARCH_PASSWORD');
        
        return {
          node: node || 'http://elasticsearch:9200',
          auth: username && password ? {
            username,
            password,
          } : undefined,
          maxRetries: 10,
          requestTimeout: 60000,
          pingTimeout: 60000,
          sniffOnStart: true,
          ssl: {
            rejectUnauthorized: false
          }
        };
      },
    }),
  ],
  controllers: [RagController],
  providers: [ElasticsearchService, RagService],
  exports: [RagService],
})
export class RagModule {} 