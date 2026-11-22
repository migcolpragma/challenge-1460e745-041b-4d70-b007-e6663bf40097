import { Injectable, HttpException, HttpStatus, Inject } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { AppConfig } from '../infrastructure/config/app.config';
import { firstValueFrom } from 'rxjs';
import { v4 as uuidv4 } from 'uuid';
import { LoanRequest, LoanRequestStatus } from '../domain/entities/loan-request.entity';
import { LoanRequestRepository } from '../domain/ports/loan-request.repository';
import { WinstonLogger } from '../infrastructure/logging/winston.logger';

export interface CreateLoanRequestInput {
  operationNumber: string;
  channel: string;
  applicantName: string;
  applicantDocument: string;
  requestedAmount: number;
  currency: string;
  termMonths: number;
  interestRate: number;
  destinationAccount: string;
}

export interface LoanRequestResponse {
  id: string;
  operationNumber: string;
  channel: string;
  status: LoanRequestStatus;
  applicantName: string;
  requestedAmount: number;
  currency: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface UpdateLoanRequestStatusInput {
  id: string;
  newStatus: LoanRequestStatus;
}

export interface UpdateAntifraudResultInput {
  id: string;
  result: string;
}

export interface UpdateRiskBureauResultInput {
  id: string;
  result: string;
}

export interface UpdateCreditOriginatorResultInput {
  id: string;
  result: string;
}

@Injectable()
export class LoanRequestService {
  constructor(
    private readonly loanRequestRepository: LoanRequestRepository,
    private readonly winstonLogger: WinstonLogger,
    private readonly httpService: HttpService,
    @Inject('APP_CONFIG') private readonly config: AppConfig,
  ) {}

  private async callExternalWithTimeout(timeoutMs: number, context: string): Promise<void> {
    const url = this.config.externalUrl;
    const maxRetries = 3;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      const start = Date.now();
      try {
        this.winstonLogger.info(`Llamada externa iniciada [${context}]`, { url, timeoutMs, attempt });
        await firstValueFrom(
          this.httpService.get(url, { timeout: timeoutMs }),
        );
        this.winstonLogger.info(`Llamada externa exitosa [${context}]`, { durationMs: Date.now() - start, attempt });
        return;
      } catch {
        const durationMs = Date.now() - start;
        const backoff = attempt * 200;
        this.winstonLogger.warn(`Intento ${attempt}/${maxRetries} fallido [${context}], reintentando en ${backoff}ms`, context, { durationMs, attempt });
        if (attempt === maxRetries) {
          this.winstonLogger.error(`Timeout en llamada externa [${context}] después de ${maxRetries} intentos`, undefined, context, { durationMs, timeoutMs, url });
          throw new HttpException(`Timeout en servicio externo: ${context}`, HttpStatus.GATEWAY_TIMEOUT);
        }
        await new Promise((resolve) => setTimeout(resolve, backoff));
      }
    }
  }

  async createLoanRequest(input: CreateLoanRequestInput): Promise<LoanRequestResponse> {
    this.winstonLogger.info('Iniciando creación de solicitud de préstamo', {
      operationNumber: input.operationNumber,
      channel: input.channel,
      requestedAmount: input.requestedAmount,
      currency: input.currency,
      termMonths: input.termMonths,
      applicantDocument: input.applicantDocument,
      destinationAccount: input.destinationAccount,
    });

    const idempotencyEnabled = this.config.idempotency.checkEnabled;

    if (idempotencyEnabled) {
      const existing = await this.loanRequestRepository.findByOperationNumberAndChannel(
        input.operationNumber,
        input.channel,
      );
      if (existing) {
        this.winstonLogger.warn('Solicitud duplicada detectada - idempotencia', undefined, {
          operationNumber: input.operationNumber,
          channel: input.channel,
        });
        throw new HttpException(
          { message: 'Solicitud duplicada', operationNumber: input.operationNumber, channel: input.channel },
          HttpStatus.CONFLICT,
        );
      }
    }

    const loanRequest = new LoanRequest(
      uuidv4(),
      input.operationNumber,
      input.channel,
      input.applicantName,
      input.applicantDocument,
      input.requestedAmount,
      input.currency,
      input.termMonths,
      input.interestRate,
      input.destinationAccount,
    );

    const created = await this.loanRequestRepository.create(loanRequest);

    this.winstonLogger.info('Solicitud de préstamo creada exitosamente', {
      requestId: created.id,
      operationNumber: input.operationNumber,
    });

    return this.mapToResponse(created);
  }

  async findById(id: string): Promise<LoanRequestResponse | null> {
    this.winstonLogger.debug('Buscando solicitud de préstamo por ID');
    const request = await this.loanRequestRepository.findById(id);
    if (!request) {
      this.winstonLogger.warn('Solicitud de préstamo no encontrada');
      return null;
    }
    return this.mapToResponse(request);
  }

  async findAllLoanRequests(): Promise<LoanRequestResponse[]> {
    this.winstonLogger.debug('Listando todas las solicitudes de préstamo');
    const requests = await this.loanRequestRepository.findAll();
    return requests.map((r) => this.mapToResponse(r));
  }

  async findAll(): Promise<LoanRequestResponse[]> {
    return this.findAllLoanRequests();
  }

  async updateStatus(idOrInput: string | UpdateLoanRequestStatusInput, status?: LoanRequestStatus): Promise<LoanRequestResponse> {
    const id = typeof idOrInput === 'string' ? idOrInput : idOrInput.id;
    const newStatus = typeof idOrInput === 'string' ? status! : idOrInput.newStatus;

    this.winstonLogger.info('Actualizando estado de solicitud', { requestId: id, newStatus });
    const updated = await this.loanRequestRepository.updateStatus(id, newStatus);
    return this.mapToResponse(updated);
  }

  async updateAntifraudResult(input: UpdateAntifraudResultInput): Promise<LoanRequestResponse> {
    const timeoutMs = this.config.services.antifraud.timeout;
    await this.callExternalWithTimeout(timeoutMs, 'antifraud');
    this.winstonLogger.info('Actualizando resultado de antifraude', { requestId: input.id });
    const updated = await this.loanRequestRepository.updateAntifraudResult(input.id, input.result);
    return this.mapToResponse(updated);
  }

  async updateRiskBureauResult(input: UpdateRiskBureauResultInput): Promise<LoanRequestResponse> {
    const timeoutMs = this.config.services.riskBureau.timeout;
    await this.callExternalWithTimeout(timeoutMs, 'risk-bureau');
    this.winstonLogger.info('Actualizando resultado del buró de riesgos', { requestId: input.id });
    const updated = await this.loanRequestRepository.updateRiskBureauResult(input.id, input.result);
    return this.mapToResponse(updated);
  }

  async updateCreditOriginatorResult(input: UpdateCreditOriginatorResultInput): Promise<LoanRequestResponse> {
    const timeoutMs = this.config.services.creditOriginator.timeout;
    await this.callExternalWithTimeout(timeoutMs, 'credit-originator');
    this.winstonLogger.info('Actualizando resultado del originador de crédito', { requestId: input.id });
    const updated = await this.loanRequestRepository.updateCreditOriginatorResult(input.id, input.result);
    return this.mapToResponse(updated);
  }

  async deleteLoanRequest(id: string): Promise<void> {
    this.winstonLogger.info('Eliminando solicitud de préstamo', { requestId: id });
    const existing = await this.loanRequestRepository.findById(id);
    if (!existing) {
      throw new HttpException(`Solicitud con ID ${id} no encontrada`, HttpStatus.NOT_FOUND);
    }
    await this.loanRequestRepository.delete(id);
  }

  async delete(id: string): Promise<void> {
    return this.deleteLoanRequest(id);
  }

  private mapToResponse(loanRequest: LoanRequest): LoanRequestResponse {
    return {
      id: loanRequest.id,
      operationNumber: loanRequest.operationNumber,
      channel: loanRequest.channel,
      status: loanRequest.status,
      applicantName: loanRequest.applicantName,
      requestedAmount: loanRequest.requestedAmount,
      currency: loanRequest.currency,
      createdAt: loanRequest.createdAt,
      updatedAt: loanRequest.updatedAt,
    };
  }
}
