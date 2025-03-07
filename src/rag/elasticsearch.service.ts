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
    // Add a delay to ensure Elasticsearch is fully started
    this.logger.log('Waiting for Elasticsearch to be fully available...');
    await new Promise(resolve => setTimeout(resolve, 10000));
    
    try {
      // Try to ping Elasticsearch first
      this.logger.log('Pinging Elasticsearch...');
      const pingResult = await this.elasticsearchService.ping();
      this.logger.log(`Elasticsearch ping result: ${JSON.stringify(pingResult)}`);
      
      // Check if the index exists
      const indexExists = await this.elasticsearchService.indices.exists({
        index: this.indexName,
      });

      if (!indexExists) {
        await this.createIndex();
      } else {
        this.logger.log(`Index ${this.indexName} already exists`);
        // Delete and recreate the index for testing purposes
        this.logger.log(
          `Deleting existing index ${this.indexName} for clean testing`,
        );
        await this.elasticsearchService.indices.delete({
          index: this.indexName,
        });
        await this.createIndex();
      }
    } catch (error) {
      this.logger.error(
        `Failed to initialize Elasticsearch: ${error?.message || 'Unknown error'}`,
        error?.stack,
      );
    }
  }

  private async createIndex() {
    try {
      // Using 384 dimensions for all-minilm embeddings
      const embeddingDims = 384;
      
      this.logger.log(
        `Creating index ${this.indexName} with embedding dimensions: ${embeddingDims}`,
      );
      
      await this.elasticsearchService.indices.create({
        index: this.indexName,
        body: {
          mappings: {
            properties: {
              content: { type: 'text' },
              embedding: {
                type: 'dense_vector',
                dims: embeddingDims,
                index: true,
                similarity: 'cosine',
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
      this.logger.error(`Failed to create index: ${error?.message || 'Unknown error'}`, error?.stack);
      throw error;
    }
  }

  async indexDocument(documentId: string, content: string, embedding: number[], metadata: Record<string, any>): Promise<void> {
    try {
      // Log the embedding dimensions to verify
      this.logger.log(`Indexing document with embedding dimensions: ${embedding.length}`);
      
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
      this.logger.error(`Failed to index document: ${error?.message || 'Unknown error'}`, error?.stack);
      throw new Error('Failed to index document in Elasticsearch');
    }
  }

  async searchSimilarDocuments(embedding: number[], maxResults: number = 5) {
    try {
      // Log the query embedding dimensions
      this.logger.log(`Searching with embedding dimensions: ${embedding.length}`);
      
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
      this.logger.error(`Failed to search documents: ${error?.message || 'Unknown error'}`, error?.stack);
      throw new Error('Failed to search for similar documents');
    }
  }
} 