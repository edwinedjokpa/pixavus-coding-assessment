import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { graphqlUploadExpress } from 'graphql-upload';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const port = configService.getOrThrow('APP_PORT');

  app.useGlobalPipes(new ValidationPipe());
  app.enableCors({
    origin: ['*'],
    credentials: true,
    // all headers that client are allowed to use
    allowedHeaders: [
      'Accept',
      'Authorization',
      'Content-Type',
      'X-Requested-With',
      'apollo-require-preflight',
    ],
    methods: ['GET', 'PUT', 'POST', 'DELETE', 'OPTIONS'],
  });

  app.use(
    graphqlUploadExpress({ maxFileSize: 100 * 1024 * 1024, maxFiles: 5 }),
  );

  await app.listen(port || 3000);
  console.log(`App is listening on ${port}`);
}
bootstrap();
