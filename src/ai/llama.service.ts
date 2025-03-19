import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { Response } from 'express';

@Injectable()
export class LlamaService {
  private readonly logger = new Logger(LlamaService.name);
  private readonly baseUrl: string;
  private readonly modelName: string;

  constructor(private readonly configService: ConfigService) {
    this.baseUrl = this.configService.get<string>('OLLAMA_BASE_URL') || 'http://localhost:11434';
    this.modelName = this.configService.get<string>('OLLAMA_MODEL') || 'llama3:latest';
    this.logger.log(`LlamaService initialized with model: ${this.modelName} and base URL: ${this.baseUrl}`);
  }

  async streamCompletion(prompt: string, res: Response): Promise<void> {
    this.logger.log('Streaming completion for prompt');
    
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    
    try {
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
          const lines = chunk.toString().split('\n').filter(line => line.trim() !== '');
          
          for (const line of lines) {
            try {
              const data = JSON.parse(line);
              if (data.response) {
                res.write(`data: ${JSON.stringify({ text: data.response })}\n\n`);
              }
              
              if (data.done) {
                res.write('data: [DONE]\n\n');
                res.end();
              }
            } catch (error) {
              this.logger.error(`Error parsing JSON: ${error.message}`);
            }
          }
        } catch (error) {
          this.logger.error(`Error processing chunk: ${error.message}`);
        }
      });

      response.data.on('end', () => {
        this.logger.log('Stream ended');
        if (!res.writableEnded) {
          res.write('data: [DONE]\n\n');
          res.end();
        }
      });

      response.data.on('error', (err: Error) => {
        this.logger.error(`Stream error: ${err.message}`);
        if (!res.writableEnded) {
          res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
          res.write('data: [DONE]\n\n');
          res.end();
        }
      });
    } catch (error) {
      this.logger.error(`Error in streamCompletion: ${error.message}`);
      if (!res.writableEnded) {
        res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
        res.write('data: [DONE]\n\n');
        res.end();
      }
    }
  }

  async getCompletion(prompt: string): Promise<any> {
    this.logger.log('Getting completion for prompt');
    
    try {
      const response = await axios.post(`${this.baseUrl}/api/generate`, {
        model: this.modelName,
        prompt: prompt,
      });
      
      return response.data;
    } catch (error) {
      this.logger.error(`Error in getCompletion: ${error.message}`);
      throw error;
    }
  }
} 