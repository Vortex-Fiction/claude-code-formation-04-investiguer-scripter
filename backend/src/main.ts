import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

const API_PORT = 3000;
const FRONTEND_ORIGIN = 'http://localhost:5173';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');
  app.enableCors({ origin: FRONTEND_ORIGIN });
  await app.listen(API_PORT);
}

void bootstrap();
