import { Injectable, LoggerService } from '@nestjs/common';
import * as winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import { ConfigService } from '@nestjs/config';
import { sanitize, sanitizeFormat } from './logger.utils';

export interface LogMetadata {
  [key: string]: unknown;
}

@Injectable()
export class WinstonLogger implements LoggerService {
  private readonly logger: winston.Logger;
  private readonly isProduction: boolean;

  constructor(private readonly configService: ConfigService) {
    const logLevel = this.configService.get<string>('LOG_LEVEL') ?? 'info';
    this.isProduction = this.configService.get<string>('NODE_ENV') === 'production';

    const transports: winston.transport[] = [
      new winston.transports.Console({
        level: logLevel,
        format: this.isProduction
          ? winston.format.combine(sanitizeFormat, winston.format.timestamp(), winston.format.json())
          : winston.format.combine(
              sanitizeFormat,
              winston.format.colorize(),
              winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
              winston.format.printf(({ timestamp, level, message, context, ...meta }) => {
                let msg = `${timestamp} [${context ?? 'App'}] ${level}: ${message}`;
                if (Object.keys(meta).length > 0) msg += ` ${JSON.stringify(meta)}`;
                return msg;
              }),
            ),
      }),
    ];

    if (this.isProduction) {
      transports.push(
        new DailyRotateFile({
          filename: 'logs/error-%DATE%.log',
          datePattern: 'YYYY-MM-DD',
          level: 'error',
          maxSize: '20m',
          maxFiles: '14d',
          zippedArchive: true,
          format: winston.format.combine(sanitizeFormat, winston.format.timestamp(), winston.format.json()),
        }),
        new DailyRotateFile({
          filename: 'logs/combined-%DATE%.log',
          datePattern: 'YYYY-MM-DD',
          maxSize: '20m',
          maxFiles: '14d',
          zippedArchive: true,
          format: winston.format.combine(sanitizeFormat, winston.format.timestamp(), winston.format.json()),
        }),
      );
    }

    this.logger = winston.createLogger({
      level: logLevel,
      format: winston.format.combine(
        sanitizeFormat,
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json(),
      ),
      defaultMeta: { service: 'loan-microservice' },
      transports,
      exitOnError: false,
    });
  }

  log(level: string, message: string, metadata?: LogMetadata): void {
    this.logger.log(level, message, sanitize(metadata ?? {}) as LogMetadata);
  }

  info(message: string, metadata?: LogMetadata): void {
    this.logger.info(message, sanitize(metadata ?? {}) as LogMetadata);
  }

  error(message: string, trace?: string, context?: string, metadata?: LogMetadata): void {
    this.logger.error(message, sanitize({ trace, context, ...metadata }) as LogMetadata);
  }

  warn(message: string, context?: string, metadata?: LogMetadata): void {
    this.logger.warn(message, sanitize({ context, ...metadata }) as LogMetadata);
  }

  debug(message: string, context?: string, metadata?: LogMetadata): void {
    this.logger.debug(message, sanitize({ context, ...metadata }) as LogMetadata);
  }

  verbose(message: string, context?: string, metadata?: LogMetadata): void {
    this.logger.verbose(message, sanitize({ context, ...metadata }) as LogMetadata);
  }

  getLogger(): winston.Logger {
    return this.logger;
  }
}
