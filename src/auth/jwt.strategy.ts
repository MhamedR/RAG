import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import * as dotenv from 'dotenv'

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private configService: ConfigService) {
    const jwtSecret = configService.get<string>('JWT_SECRET');
    if (!jwtSecret) {
      throw new Error('JWT_SECRET is not defined');
    }
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtSecret,
    });
  }

  // async validate(payload: any, done: Function) {
  //   console.log('JWT_SECRET:', process.env.JWT_SECRET)
  //   // You can add more validation logic here
  //   if (!payload.sub) {
  //     throw new UnauthorizedException();
  //   }
  //   return done(null, { userId: payload.sub, username: payload.username });
  // }
  async validate(payload: any) {
    console.log('JWT_SECRET:', process.env.JWT_SECRET)
    // You can add more validation logic here
    if (!payload.sub) {
      throw new UnauthorizedException();
    }
    return { userId: payload.sub, username: payload.username };
  }
} 