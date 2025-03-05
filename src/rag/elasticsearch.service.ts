import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ElasticsearchService as NestElasticsearchService } from '@nestjs/elasticsearch';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ElasticsearchService implements OnModuleInit {
  private readonly logger = new Logger(ElasticsearchService.name);
  private readonly indexName = 'documents';

  constructor(
    private readonly elasticsearchService: NestElasticsearchService,
    private readonly configService: ConfigService,
  ) {}

  async onModuleInit() {
    try {
      // Check if the index exists
      const indexExists = await this.elasticsearchService.indices.exists({
        index: this.indexName,
      });

      if (!indexExists) {
        await this.createIndex();
      }
    } catch (error) {
      this.logger.error(
        `Failed to initialize Elasticsearch: ${error.message}`,
        error.stack,
      );
    }
  }

  private async createIndex() {
    try {
      await this.elasticsearchService.indices.create({
        index: this.indexName,
        body: {
          mappings: {
            properties: {
              content: { type: 'text' },
              embedding: { 
                type: 'dense_vector',
                dims: 1536,
                index: true,
                similarity: 'cosine'
              },
              metadata: { 
                properties: {
                  source: { type: 'keyword' },
                  title: { type: 'text' },
                  created_at: { type: 'date' },
                }
              }
            },
          },
        },
      });
      this.logger.log(`Created index ${this.indexName}`);
    } catch (error) {
      this.logger.error(`Failed to create index: ${error.message}`, error.stack);
      throw error;
    }
  }

  async indexDocument(document: {
    content: string;
    embedding: number[];
    metadata: {
      source: string;
      title: string;
      created_at: Date;
    };
  }) {
    try {
      const response = await this.elasticsearchService.index({
        index: this.indexName,
        body: document,
        refresh: true,
      });
      
      this.logger.log(`Indexed document with ID: ${response._id}`);
      return response._id;
    } catch (error) {
      this.logger.error(`Failed to index document: ${error.message}`, error.stack);
      throw error;
    }
  }

  async searchByVector(embedding: number[], maxResults: number = 5) {
    try {
      const response = await this.elasticsearchService.search({
        index: this.indexName,
        body: {
          size: maxResults,
          query: {
            script_score: {
              query: { match_all: {} },
              script: {
                source: "cosineSimilarity(params.query_vector, 'embedding') + 1.0",
                params: { query_vector: embedding }
              }
            }
          }
        }
      });
      
      return response.hits.hits.map(hit => {
        const source = hit._source as { content: string; metadata: any };
        return {
          id: hit._id,
          score: hit._score,
          content: source.content,
          metadata: source.metadata,
        };
      });
    } catch (error) {
      this.logger.error(`Failed to search by vector: ${error.message}`, error.stack);
      throw error;
    }
  }
} 