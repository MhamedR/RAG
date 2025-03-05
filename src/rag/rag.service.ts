import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OpenAIEmbeddings } from '@langchain/openai';
import { ChatOpenAI } from '@langchain/openai';
import { ElasticsearchService } from './elasticsearch.service';
import { Document } from '@langchain/core/documents';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { RunnableSequence } from '@langchain/core/runnables';
import { PromptTemplate } from '@langchain/core/prompts';

@Injectable()
export class RagService {
  private readonly logger = new Logger(RagService.name);
  private readonly embeddings: OpenAIEmbeddings;
  private readonly chatModel: ChatOpenAI;

  constructor(
    private readonly configService: ConfigService,
    private readonly elasticsearchService: ElasticsearchService,
  ) {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');
    this.embeddings = new OpenAIEmbeddings({ openAIApiKey: apiKey });
    this.chatModel = new ChatOpenAI({ 
      openAIApiKey: apiKey,
      modelName: 'gpt-4',
    });
  }

  async generateEmbedding(text: string): Promise<number[]> {
    try {
      const embedding = await this.embeddings.embedQuery(text);
      return embedding;
    } catch (error) {
      this.logger.error(`Failed to generate embedding: ${error.message}`, error.stack);
      throw error;
    }
  }

  async indexDocument(content: string, metadata: any): Promise<string> {
    try {
      const embedding = await this.generateEmbedding(content);
      
      const document = {
        content,
        embedding,
        metadata: {
          ...metadata,
          created_at: new Date(),
        },
      };

      return await this.elasticsearchService.indexDocument(document);
    } catch (error) {
      this.logger.error(`Failed to index document: ${error.message}`, error.stack);
      throw error;
    }
  }

  async query(query: string): Promise<string> {
    try {
      // Step 1: Generate embedding for the query
      const queryEmbedding = await this.generateEmbedding(query);
      
      // Step 2: Search for relevant documents
      const searchResults = await this.elasticsearchService.searchByVector(queryEmbedding);
      
      if (!searchResults.length) {
        // If no context is found, just use the LLM directly
        const response = await this.chatModel.invoke(query);
        return typeof response.content === 'string' ? response.content : JSON.stringify(response.content);
      }

      // Step 3: Prepare the context from retrieved documents
      const context = searchResults
        .map(result => result.content)
        .join("\n\n");

      // Step 4: Create a prompt template for the RAG
      const promptTemplate = PromptTemplate.fromTemplate(`
        Answer the question based on the following context:
        
        Context:
        {context}
        
        Question: {question}
        
        Answer:
      `);

      // Step 5: Create the RAG pipeline
      const ragChain = RunnableSequence.from([
        {
          context: () => context,
          question: (input: string) => input,
        },
        promptTemplate,
        this.chatModel,
        new StringOutputParser(),
      ]);

      // Step 6: Execute the RAG chain
      return await ragChain.invoke(query);
    } catch (error) {
      this.logger.error(`Failed to process RAG query: ${error.message}`, error.stack);
      throw error;
    }
  }
} 