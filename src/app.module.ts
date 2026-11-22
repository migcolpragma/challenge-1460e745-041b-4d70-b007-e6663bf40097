import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { AppConfigModule } from './infrastructure/config/app.config';
import { LoanRequestService } from './application/loan-request.service';
import { LoanRequestRepository } from './domain/ports/loan-request.repository';
import { PrismaLoanRequestRepository } from './infrastructure/repositories/prisma-loan-request.repository';
import { WinstonLogger } from './infrastructure/logging/winston.logger';
import { LoanRequestController } from './infrastructure/controllers/loan-request.controller';
import { HttpExceptionFilter } from './infrastructure/filters/http-exception.filter';
import { LoggingInterceptor } from './infrastructure/interceptors/logging.interceptor';
import { TransformInterceptor } from './infrastructure/interceptors/transform.interceptor';

@Module({
  imports: [
    AppConfigModule,
    HttpModule,
  ],
  controllers: [LoanRequestController],
  providers: [
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
