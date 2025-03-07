import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ElasticsearchService as NestElasticsearchService } from '@nestjs/elasticsearch';
import { ConfigService } from '@nestjs/config';

interface ElasticsearchHit {
  _id: string;
  _score: number;
  _source: {
    content: string;
    embedding: number[];
    metadata: Record<string, any>;
  };
}

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
                },
              },
            },
          },
        },
      });
      this.logger.log(`Created index: ${this.indexName}`);
    } catch (error) {
      this.logger.error(`Failed to create index: ${error.message}`, error.stack);
      throw error;
    }
  }

  async indexDocument(documentId: string, content: string, embedding: number[], metadata: Record<string, any>): Promise<void> {
    try {
      const document = {
        content,
        embedding,
        metadata: {
          ...metadata,
          created_at: new Date(),
        },
      };

      await this.elasticsearchService.index({
        index: this.indexName,
        id: documentId,
        body: document,
        refresh: true,
      });

      this.logger.log(`Indexed document with ID: ${documentId}`);
    } catch (error) {
      this.logger.error(`Failed to index document: ${error.message}`, error.stack);
      throw new Error('Failed to index document in Elasticsearch');
    }
  }

  async searchSimilarDocuments(embedding: number[], maxResults: number = 5) {
    try {
      const response = await this.elasticsearchService.search({
        index: this.indexName,
        body: {
          query: {
            script_score: {
              query: { match_all: {} },
              script: {
                source: "cosineSimilarity(params.query_vector, 'embedding') + 1.0",
                params: { query_vector: embedding },
              },
            },
          },
          size: maxResults,
        },
      });

      return (response.hits.hits as unknown as ElasticsearchHit[]).map((hit) => ({
        id: hit._id,
        content: hit._source.content,
        metadata: hit._source.metadata,
        score: hit._score,
      }));
    } catch (error) {
      this.logger.error(`Failed to search documents: ${error.message}`, error.stack);
      throw new Error('Failed to search for similar documents');
    }
  }
} 