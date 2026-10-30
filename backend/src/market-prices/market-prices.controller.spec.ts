import { INestApplication, UnauthorizedException, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { MarketPricesController } from './market-prices.controller';
import { MarketPricesService } from './market-prices.service';

describe('market price HTTP access and validation', () => {
  let app: INestApplication;
  const id = '568cd5f6-ae16-4f35-9d68-26dff9981081';
  const userId = '1ed31b45-e025-40de-842e-e45303c29c7f';
  const prices = {
    findAll: jest.fn().mockResolvedValue([]),
    history: jest.fn().mockResolvedValue([]),
    update: jest.fn().mockImplementation((id, price_per_kg) => ({ id, grade: 'A', price_per_kg })),
  };

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      controllers: [MarketPricesController],
      providers: [{ provide: MarketPricesService, useValue: prices }],
    }).overrideGuard(JwtAuthGuard).useValue({
      canActivate(context) {
        const req = context.switchToHttp().getRequest();
        if (!req.headers.authorization) throw new UnauthorizedException();
        req.user = { userId, role: req.headers.authorization };
        return true;
      },
    }).compile();
    app = module.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: true }));
    await app.init();
  });
  afterAll(() => app.close());
  beforeEach(() => jest.clearAllMocks());

  it('allows public price reads without caching', async () => {
    await request(app.getHttpServer()).get('/market-prices').expect('Cache-Control', 'no-store').expect(200, []);
  });

  it('rejects unauthenticated users and non-admin roles', async () => {
    await request(app.getHttpServer()).patch(`/market-prices/${id}`).send({ price_per_kg: 923456 }).expect(401);
    for (const role of ['supplier', 'buyer']) {
      await request(app.getHttpServer()).patch(`/market-prices/${id}`).set('Authorization', role).send({ price_per_kg: 923456 }).expect(403);
    }
    expect(prices.update).not.toHaveBeenCalled();
  });

  it('accepts admin updates and derives the author from the authenticated session', async () => {
    await request(app.getHttpServer()).patch(`/market-prices/${id}`).set('Authorization', 'admin')
      .send({ price_per_kg: 923456.25 }).expect(200, { id, grade: 'A', price_per_kg: 923456.25 });
    expect(prices.update).toHaveBeenCalledWith(id, 923456.25, userId);
  });

  it.each([0, -1, '923456', null, 12.345])('rejects invalid price %p', async price_per_kg => {
    await request(app.getHttpServer()).patch(`/market-prices/${id}`).set('Authorization', 'admin').send({ price_per_kg }).expect(400);
    expect(prices.update).not.toHaveBeenCalled();
  });

  it('rejects invalid IDs and forged author fields', async () => {
    await request(app.getHttpServer()).patch('/market-prices/invalid').set('Authorization', 'admin').send({ price_per_kg: 923456 }).expect(400);
    await request(app.getHttpServer()).patch(`/market-prices/${id}`).set('Authorization', 'admin')
      .send({ price_per_kg: 923456, updated_by: userId }).expect(400);
    expect(prices.update).not.toHaveBeenCalled();
  });

  it('validates history limits', async () => {
    await request(app.getHttpServer()).get('/market-prices/A/history?limit=10').expect(200);
    expect(prices.history).toHaveBeenCalledWith('A', 10);
    await request(app.getHttpServer()).get('/market-prices/A/history?limit=-1').expect(400);
    await request(app.getHttpServer()).get('/market-prices/A/history?limit=101').expect(400);
  });
});
