import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private readonly baseUrl: string;
  private readonly modelName: string;

  constructor(private readonly configService: ConfigService) {
    this.baseUrl = this.configService.get<string>('OLLAMA_BASE_URL') || 'http://localhost:11434';
    this.modelName = this.configService.get<string>('OLLAMA_MODEL') || 'tinyllama';
    this.logger.log(
      `Initialized AiService with baseUrl: ${this.baseUrl} and model: ${this.modelName}`,
    );
  }

  async getCompletion(prompt: string): Promise<string> {
    try {
      this.logger.log(`Generating completion for prompt: ${prompt.substring(0, 50)}...`);
      
      const response = await axios.post(`${this.baseUrl}/api/generate`, {
        model: this.modelName,
        prompt: prompt,
        stream: false,
      });
      
      if (!response.data || !response.data.response) {
        throw new Error('Invalid response from Ollama API');
      }
      
      return response.data.response;
    } catch (error) {
      this.logger.error(
        `Error generating completion: ${error?.message || 'Unknown error'}`,
        error?.stack || 'No stack trace',
      );
      throw new Error(`Failed to generate completion: ${error?.message || 'Unknown error'}`);
    }
  }

  async streamCompletion(prompt: string, onToken: (token: string) => void): Promise<void> {
    try {
      this.logger.log(`Streaming completion for prompt: ${prompt.substring(0, 50)}...`);
      
      const response = await axios.post(
        `${this.baseUrl}/api/generate`,
        {
          model: this.modelName,
          prompt: prompt,
          stream: true,
        },
        {
          responseType: 'stream',
        },
      );
      
      response.data.on('data', (chunk: Buffer) => {
        try {
          const lines = chunk.toString().split('\n').filter(Boolean);
          for (const line of lines) {
            const data = JSON.parse(line);
            if (data.response) {
              onToken(data.response);
            }
          }
        } catch (err) {
          this.logger.error(`Error parsing streaming chunk: ${err?.message || 'Unknown error'}`);
        }
      });
      
      response.data.on('end', () => {
        this.logger.log('Streaming completed');
      });
      
    } catch (error) {
      this.logger.error(
        `Error streaming completion: ${error?.message || 'Unknown error'}`,
        error?.stack || 'No stack trace',
      );
      throw new Error(`Failed to stream completion: ${error?.message || 'Unknown error'}`);
    }
  }
} 