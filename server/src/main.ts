import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import helmet from 'helmet';

let port = process.env.SERVER_PORT ? parseInt(process.env.SERVER_PORT) : 3000;

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(port);

  // Security middleware
  app.use(helmet());

  // Global prefix
  app.setGlobalPrefix('/api/v1');

  console.log(`🚀 Huddle Server started successfully!`);
  console.log(`📍 Server: http://localhost:${port}`);
}
bootstrap();
