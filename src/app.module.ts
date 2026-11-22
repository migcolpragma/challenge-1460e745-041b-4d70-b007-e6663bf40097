import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { LoanRequestService } from './application/loan-request.service';
import { LoanRequestRepository } from './domain/ports/loan-request.repository';
import { PrismaLoanRequestRepository } from './infrastructure/repositories/prisma-loan-request.repository';
import { PrismaService } from './infrastructure/database/prisma.service';
import { WinstonLogger } from './infrastructure/logging/winston.logger';
import { LoanRequestController } from './infrastructure/controllers/loan-request.controller';
import { HttpExceptionFilter } from './infrastructure/filters/http-exception.filter';
import { LoggingInterceptor } from './infrastructure/interceptors/logging.interceptor';
import { TransformInterceptor } from './infrastructure/interceptors/transform.interceptor';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      validationOptions: { allowUnknown: true, abortEarly: false },
    }),
    HttpModule,
  ],
  controllers: [LoanRequestController],
  providers: [
    PrismaService,
    WinstonLogger,
    {
      provide: LoanRequestRepository,
      useClass: PrismaLoanRequestRepository,
    },
    LoanRequestService,
    { provide: APP_FILTER, useClass: HttpExceptionFilter },
    { provide: APP_INTERCEPTOR, useClass: LoggingInterceptor },
    { provide: APP_INTERCEPTOR, useClass: TransformInterceptor },
  ],
})
export class AppModule {}
