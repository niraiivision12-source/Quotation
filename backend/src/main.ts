import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Logger } from 'nestjs-pino';
import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });

  app.setGlobalPrefix('api');

  const config = new DocumentBuilder()
    .setTitle('Quotation API')
    .setDescription('Quotation Management API')
    .setVersion('1.0')
    .build();

  const document = SwaggerModule.createDocument(app, config);

  SwaggerModule.setup('api/docs', app, document);

  app.useLogger(app.get(Logger));

  await app.listen(process.env.PORT ?? 3000);
}

bootstrap().catch(console.error);
