import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../prisma/prisma.service';
import { jwtSecret } from './jwt-config';
import { isUUID } from 'class-validator';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        ExtractJwt.fromAuthHeaderAsBearerToken(),
        (req) => {
          if (req && req.query && req.query.token) {
            return req.query.token as string;
          }
          return null;
        },
      ]),
      ignoreExpiration: false,
      secretOrKey: jwtSecret(),
      algorithms: ['HS256'],
    });
  }

  async validate(payload: any) {
    if (typeof payload.sub !== 'string' || typeof payload.jti !== 'string' || !isUUID(payload.sub) || !isUUID(payload.jti)) {
      throw new UnauthorizedException('Invalid session');
    }
    const session = await this.prisma.authSession.findUnique({ where: { id: payload.jti } });
    if (!session || session.user_id !== payload.sub || session.revoked_at || session.expires_at <= new Date()) {
      throw new UnauthorizedException('Invalid or expired session');
    }
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      include: { role: true },
    });
    if (!user || !['active', 'pending'].includes(user.status)) {
      throw new UnauthorizedException();
    }
    return { userId: user.id, email: user.email, role: user.role.name, sessionId: session.id };
  }
}
