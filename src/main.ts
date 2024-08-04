import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { ValidationPipe } from '@nestjs/common';
import fastifyCookie from '@fastify/cookie';
import { transports, format } from 'winston';
import {
  utilities as nestWinstonModuleUtilities,
  WinstonModule,
} from 'nest-winston';
import 'winston-daily-rotate-file';
import helmet from '@fastify/helmet';
import compression from '@fastify/compress';

function createWinstonLogger() {
  return WinstonModule.createLogger({
    transports: [
      new transports.Console({
        format: format.combine(
          format.timestamp({
            format: 'YYYY-MM-DD HH:mm:ss.SSS',
          }),
          format.ms(),
          nestWinstonModuleUtilities.format.nestLike('rotec', {
            colors: true,
            prettyPrint: true,
          }),
        ),
      }),
      new transports.DailyRotateFile({
        dirname: 'logs',
        filename: '%DATE%-all.log',
        maxFiles: '30d',
        format: format.combine(
          format.timestamp({
            format: 'YYYY-MM-DD HH:mm:ss.SSS',
          }),
          format.ms(),
          format.json(),
        ),
      }),
      new transports.DailyRotateFile({
        dirname: 'logs',
        filename: '%DATE%-error.log',
        level: 'error',
        maxFiles: '30d',
        format: format.combine(
          format.timestamp({
            format: 'YYYY-MM-DD HH:mm:ss.SSS',
          }),
          format.ms(),
          format.json(),
        ),
      }),
    ],
  });
}

async function bootstrap() {
  const logger = createWinstonLogger();

  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter(),
    {
      bufferLogs: true,
      logger: createWinstonLogger(),
    },
  );

  await app.register(helmet);
  await app.register(compression, { encodings: ['gzip', 'deflate'] });

  app.useLogger(logger);

  await app.register(fastifyCookie, {
    secret: process.env.COOKIE_SECRET,
  });

  app.enableCors({
    origin: [
      'http://localhost:5173',
      'http://127.0.0.1:5173',
      'https://cps.nekatz.com',
    ],
    credentials: true,
  });

  app.useGlobalPipes(new ValidationPipe());

  await app.listen(3000, '0.0.0.0', (err, address) => {
    if (err) {
      console.error(err);
      process.exit(1);
    }

    logger.log(`Server listening on ${address}`);
  });
}
bootstrap();
