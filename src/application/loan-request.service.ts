import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
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
  ) {}

  async createLoanRequest(input: CreateLoanRequestInput): Promise<LoanRequestResponse> {
    this.winstonLogger.info('Iniciando creación de solicitud de préstamo');

    const existing = await this.loanRequestRepository.findByOperationNumberAndChannel(
      input.operationNumber,
      input.channel,
    );

    if (existing) {
      this.winstonLogger.warn('Solicitud duplicada detectada - idempotencia');
      return this.mapToResponse(existing);
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
    this.winstonLogger.info('Actualizando resultado de antifraude', { requestId: input.id });
    const updated = await this.loanRequestRepository.updateAntifraudResult(input.id, input.result);
    return this.mapToResponse(updated);
  }

  async updateRiskBureauResult(input: UpdateRiskBureauResultInput): Promise<LoanRequestResponse> {
    this.winstonLogger.info('Actualizando resultado del buró de riesgos', { requestId: input.id });
    const updated = await this.loanRequestRepository.updateRiskBureauResult(input.id, input.result);
    return this.mapToResponse(updated);
  }

  async updateCreditOriginatorResult(input: UpdateCreditOriginatorResultInput): Promise<LoanRequestResponse> {
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
