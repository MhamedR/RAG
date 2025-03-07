import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ElasticsearchService } from './elasticsearch.service';
import axios from 'axios';

@Injectable()
export class RagService {
  private readonly logger = new Logger(RagService.name);
  private readonly baseUrl: string;
  private readonly modelName: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly elasticsearchService: ElasticsearchService,
  ) {
    this.baseUrl = this.configService.get<string>('OLLAMA_BASE_URL') || 'http://localhost:11434';
    this.modelName = this.configService.get<string>('OLLAMA_MODEL') || 'llama3';
    
    this.logger.log(`Initialized RagService with baseUrl: ${this.baseUrl} and model: ${this.modelName}`);
  }

  async generateEmbedding(text: string): Promise<number[]> {
    try {
      const response = await axios.post(`${this.baseUrl}/api/embeddings`, {
        model: this.modelName,
        prompt: text,
      });

      return response.data.embedding;
    } catch (error) {
      this.logger.error(`Error generating embedding: ${error.message}`, error.stack);
      throw new Error('Failed to generate embedding');
    }
  }

  async indexDocument(documentId: string, content: string, metadata: Record<string, any>): Promise<void> {
    try {
      const embedding = await this.generateEmbedding(content);
      await this.elasticsearchService.indexDocument(documentId, content, embedding, metadata);
      this.logger.log(`Document indexed successfully: ${documentId}`);
    } catch (error) {
      this.logger.error(`Error indexing document: ${error.message}`, error.stack);
      throw new Error('Failed to index document');
    }
  }

  async query(query: string): Promise<any> {
    try {
      // Generate embedding for the query
      const embedding = await this.generateEmbedding(query);
      
      // Search for similar documents
      const documents = await this.elasticsearchService.searchSimilarDocuments(embedding);
      
      if (!documents.length) {
        return { answer: 'No relevant documents found.' };
      }
      
      // Construct context from documents
      const context = documents.map(doc => doc.content).join('\n\n');
      
      // Generate response using Ollama
      const response = await axios.post(`${this.baseUrl}/api/chat`, {
        model: this.modelName,
        messages: [
          { 
            role: 'system', 
            content: 'You are a helpful assistant. Use the provided context to answer the question. If the answer is not in the context, say "I don\'t have enough information to answer that."' 
          },
          { 
            role: 'user', 
            content: `Context:\n${context}\n\nQuestion: ${query}` 
          }
        ],
      });
      
      return { 
        answer: response.data.message?.content || 'No response generated.',
        documents: documents.map(doc => ({
          id: doc.id,
          score: doc.score,
          metadata: doc.metadata
        }))
      };
    } catch (error) {
      this.logger.error(`Error querying RAG: ${error.message}`, error.stack);
      throw new Error('Failed to query RAG system');
    }
  }
} 