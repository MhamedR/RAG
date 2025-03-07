import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ElasticsearchService } from './elasticsearch.service';
import axios from 'axios';

@Injectable()
export class RagService {
  private readonly logger = new Logger(RagService.name);
  private readonly baseUrl: string;
  private readonly modelName: string;
  private readonly embeddingModel: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly elasticsearchService: ElasticsearchService,
  ) {
    this.baseUrl = this.configService.get<string>('OLLAMA_BASE_URL') || 'http://localhost:11434';
    this.modelName = this.configService.get<string>('OLLAMA_MODEL') || 'tinyllama';
    this.embeddingModel = this.configService.get<string>('OLLAMA_EMBEDDING_MODEL') || 'all-minilm';
    this.logger.log(`Initialized RagService with baseUrl: ${this.baseUrl}, model: ${this.modelName}, embedding model: ${this.embeddingModel}`);
  }

  async generateEmbedding(text: string): Promise<number[]> {
    try {
      this.logger.log(`Generating embedding for text of length: ${text.length} using model: ${this.embeddingModel}`);
      
      // Using the /api/embeddings endpoint which is supported in Ollama 0.5.13
      const response = await axios.post(`${this.baseUrl}/api/embeddings`, {
        model: this.embeddingModel,
        prompt: text,
      });
      
      if (!response.data || !response.data.embedding) {
        this.logger.error(`Invalid response from Ollama API: ${JSON.stringify(response.data)}`);
        throw new Error('Invalid response from Ollama API');
      }
      
      this.logger.log(`Generated embedding with length: ${response.data.embedding.length}`);
      return response.data.embedding;
    } catch (error) {
      this.logger.error(`Error generating embedding: ${error?.message || 'Unknown error'}`, 
          error?.stack || 'No stack trace');
      if (error.response) {
        this.logger.error(`Response status: ${error.response.status}, data: ${JSON.stringify(error.response.data)}`);
      }
      throw new Error('Failed to generate embedding');
    }
  }

  async indexDocument(
    documentId: string,
    content: string,
    metadata: Record<string, any> = {},
  ): Promise<void> {
    try {
      this.logger.log(`Generating embeddings for document: ${documentId}`);
      const embedding = await this.generateEmbedding(content);
      
      this.logger.log(`Embedding generated successfully. Length: ${embedding.length}`);
      
      await this.elasticsearchService.indexDocument(
        documentId,
        content,
        embedding,
        metadata,
      );
      
      this.logger.log(`Document indexed successfully: ${documentId}`);
    } catch (error) {
      this.logger.error(
        `Failed to index document ${documentId}: ${error?.message || 'Unknown error'}`,
        error?.stack,
      );
      throw new Error(`Failed to index document: ${error?.message || 'Unknown error'}`);
    }
  }

  // New method for indexing document text directly - supports the document service
  async indexDocumentText(
    documentId: string,
    text: string,
    metadata: Record<string, any> = {},
  ): Promise<void> {
    try {
      this.logger.log(`Processing text document with ID: ${documentId}`);
      
      // For longer texts, we could implement chunking here
      // For now, we'll just index the entire text
      await this.indexDocument(documentId, text, metadata);
      
      this.logger.log(`Text document indexed successfully: ${documentId}`);
    } catch (error) {
      this.logger.error(
        `Failed to index text document ${documentId}: ${error?.message || 'Unknown error'}`,
        error?.stack,
      );
      throw new Error(`Failed to index text document: ${error?.message || 'Unknown error'}`);
    }
  }

  async queryDocuments(query: string): Promise<{ answer: string }> {
    try {
      this.logger.log(`Processing query: ${query}`);
      
      // Generate embedding for the query
      const embedding = await this.generateEmbedding(query);
      
      // Search for relevant documents
      const results = await this.elasticsearchService.searchSimilarDocuments(embedding);
      
      if (results.length === 0) {
        this.logger.log('No relevant documents found for query');
        return { answer: 'No relevant documents found.' };
      }
      
      // Prepare the context by extracting content from relevant documents
      const context = results
        .map((doc) => `Content: ${doc.content}\nSource: ${doc.metadata?.source || 'Unknown'}`)
        .join('\n\n');
      
      // Build a prompt with the context and query
      const prompt = `Based on the following information:\n\n${context}\n\nQuestion: ${query}\n\nAnswer:`;
      
      // Generate a response using the Ollama model via API
      const response = await axios.post(`${this.baseUrl}/api/generate`, {
        model: this.modelName,
        prompt: prompt,
        stream: false,
      });
      
      const answer = response.data.response || 'No answer generated';
      
      return { answer };
    } catch (error) {
      this.logger.error(`Failed to process query: ${error?.message || 'Unknown error'}`, 
          error?.stack || 'No stack trace');
      throw new Error(`Failed to process query: ${error?.message || 'Unknown error'}`);
    }
  }
} 