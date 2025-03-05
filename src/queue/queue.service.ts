import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';

export interface AiTaskData {
  prompt: string;
  userId: string;
}

@Injectable()
export class QueueService {
  private readonly logger = new Logger(QueueService.name);

  constructor(
    @InjectQueue('ai-tasks') private readonly aiTasksQueue: Queue<AiTaskData>,
  ) {}

  async addAiTask(taskData: AiTaskData): Promise<{ jobId: string }> {
    this.logger.log(`Adding AI task to queue: ${JSON.stringify(taskData)}`);
    
    try {
      const job = await this.aiTasksQueue.add('process-ai-request', taskData, {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 1000,
        },
        removeOnComplete: true,
      });

      this.logger.log(`Job added to queue with ID: ${job.id}`);
      return { jobId: job.id as string };
    } catch (error) {
      this.logger.error(`Error adding job to queue: ${error.message}`, error.stack);
      throw new Error('Failed to add task to queue');
    }
  }

  async getJobStatus(jobId: string): Promise<{ status: string; result?: any }> {
    try {
      const job = await this.aiTasksQueue.getJob(jobId);
      
      if (!job) {
        return { status: 'not_found' };
      }

      const state = await job.getState();
      const result = job.returnvalue;

      return {
        status: state,
        result: result || undefined,
      };
    } catch (error) {
      this.logger.error(`Error getting job status: ${error.message}`, error.stack);
      throw new Error('Failed to get job status');
    }
  }
} 