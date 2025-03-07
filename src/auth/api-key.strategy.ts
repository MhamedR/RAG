import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import Strategy from 'passport-headerapikey';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ApiKeyStrategy extends PassportStrategy(Strategy, 'api-key') {
  constructor(private readonly configService: ConfigService) {
    const headerName = configService.get<string>('API_KEY_HEADER_NAME');
    if (!headerName) {
      throw new Error('API_KEY_HEADER_NAME is not defined');
    }

    super(
      {
        header: headerName,
        prefix: '',
      },
      false
    );
  }

  validate(apiKey: string): boolean | Promise<boolean> {
    const expectedApiKey = this.configService.get<string>('API_KEY');
    if (!expectedApiKey) {
      throw new Error('API_KEY is not defined');
    }
    
    if (apiKey === expectedApiKey) {
      return true;
    }
    
    throw new UnauthorizedException();
  }
} 