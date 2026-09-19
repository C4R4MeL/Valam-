import * as dotenv from 'dotenv';
dotenv.config();

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { json, urlencoded } from 'express';

/**
 * Validate that all required environment variables are present at startup.
 * Logs clear warnings so deploy issues are caught immediately, not when a user hits the feature.
 */
function validateEnvironment() {
  const required: { key: string; label: string }[] = [
    { key: 'DATABASE_URL', label: 'Database (Supabase)' },
    { key: 'JWT_SECRET', label: 'JWT Authentication' },
    { key: 'GEMINI_API_KEY', label: 'Nila AI Chatbot (Gemini)' },
    { key: 'MIDTRANS_SERVER_KEY', label: 'Payment Gateway (Midtrans)' },
    { key: 'BITESHIP_API_KEY', label: 'Shipping API (Biteship)' },
  ];

  const missing = required.filter((v) => !process.env[v.key]?.trim());

  if (missing.length > 0) {
    console.warn('\n' + '='.repeat(60));
    console.warn('⚠️  VALAM — ENVIRONMENT VARIABLES TIDAK LENGKAP');
    console.warn('='.repeat(60));
    for (const v of missing) {
      console.warn(`  ❌ ${v.key} — diperlukan untuk: ${v.label}`);
    }
    console.warn(
      '\nFitur terkait TIDAK akan berfungsi sampai variabel diisi.',
    );
    console.warn('Cek file .env atau environment variables di hosting.\n');
    console.warn('='.repeat(60) + '\n');
  }
}

async function bootstrap() {
  validateEnvironment();

  const app = await NestFactory.create(AppModule);

  app.use(json({ limit: '10mb' }));
  app.use(urlencoded({ limit: '10mb', extended: true }));

  // Security Hardening
  app.use(helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  }));

  // Serve uploads publicly
  app.use('/uploads', require('express').static(require('path').join(process.cwd(), 'uploads')));

  app.setGlobalPrefix('api');
  
  app.enableCors({
    origin: true,
    credentials: true,
  });

  // Global Validation
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    transform: true,
    forbidNonWhitelisted: true,
  }));

  // Swagger Documentation Setup
  const config = new DocumentBuilder()
    .setTitle('Valam API')
    .setDescription('The Valam Supply Chain Platform API documentation')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  await app.listen(process.env.PORT ?? 3001);
}
bootstrap();
