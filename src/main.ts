import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import mongoose from 'mongoose';

async function bootstrap() {
  mongoose.set('transactionAsyncLocalStorage', true);

  const app = await NestFactory.create(AppModule);

  const config = app.get(ConfigService);
  const host = config.get<string>('server.host');
  const port = config.get<number>('server.port');
  const env = config.get<string>('server.env');

  console.info(`Environment: ${env}`);
  console.info(`Listening on ${host}:${port}`);

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
    }),
  );

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Record API')
    .setDescription('The record management API')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('swagger', app, document);

  await app.listen(port, host);
}

bootstrap();
