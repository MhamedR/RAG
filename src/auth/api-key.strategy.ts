import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-headerapikey';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ApiKeyStrategy extends PassportStrategy(Strategy, 'api-key') {
  constructor(private readonly configService: ConfigService) {
    super(
      { header: configService.get<string>('API_KEY_HEADER_NAME'), passReqToCallback: true },
      true,
      async (req, apiKey, done) => {
        return this.validate(apiKey, done);
      },
    );
  }

  async validate(apiKey: string, done: (error: Error, data) => {}) {
    const expectedApiKey = this.configService.get<string>('API_KEY');
    
    if (apiKey === expectedApiKey) {
      done(null, true);
    } else {
      done(new UnauthorizedException(), null);
    }
  }
} 