import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { executeWithRetry } from '../database/prisma-retry.util';
import { LoanRequest, LoanRequestStatus } from '../../domain/entities/loan-request.entity';
import { LoanRequestRepository } from '../../domain/ports/loan-request.repository';

@Injectable()
export class PrismaLoanRequestRepository extends LoanRequestRepository {
  private readonly logger = new Logger(PrismaLoanRequestRepository.name);

  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async create(loanRequest: LoanRequest): Promise<LoanRequest> {
    const created = await executeWithRetry(
      () => this.prisma.loanRequest.create({
        data: {
          id: loanRequest.id,
          operationNumber: loanRequest.operationNumber,
          channel: loanRequest.channel,
          applicantName: loanRequest.applicantName,
          applicantDocument: loanRequest.applicantDocument,
          requestedAmount: loanRequest.requestedAmount,
          currency: loanRequest.currency,
          termMonths: loanRequest.termMonths,
          interestRate: loanRequest.interestRate,
          destinationAccount: loanRequest.destinationAccount,
          status: loanRequest.status,
          createdAt: loanRequest.createdAt,
          updatedAt: loanRequest.updatedAt,
          antifraudResult: loanRequest.antifraudResult,
          riskBureauResult: loanRequest.riskBureauResult,
          creditOriginatorResult: loanRequest.creditOriginatorResult,
        },
      }),
      'create',
      this.logger,
    );
    return this.mapToDomain(created);
  }

  async findById(id: string): Promise<LoanRequest | null> {
    const loanRequest = await executeWithRetry(
      () => this.prisma.loanRequest.findUnique({ where: { id } }),
      'findById',
      this.logger,
    );
    return loanRequest ? this.mapToDomain(loanRequest) : null;
  }

  async findByOperationNumberAndChannel(operationNumber: string, channel: string): Promise<LoanRequest | null> {
    const loanRequest = await executeWithRetry(
      () => this.prisma.loanRequest.findUnique({
        where: { operationNumber_channel: { operationNumber, channel } },
      }),
      'findByOperationNumberAndChannel',
      this.logger,
    );
    return loanRequest ? this.mapToDomain(loanRequest) : null;
  }

  async updateStatus(id: string, status: LoanRequestStatus): Promise<LoanRequest> {
    const updated = await executeWithRetry(
      () => this.prisma.loanRequest.update({ where: { id }, data: { status, updatedAt: new Date() } }),
      'updateStatus',
      this.logger,
    );
    return this.mapToDomain(updated);
  }

  async updateAntifraudResult(id: string, result: string): Promise<LoanRequest> {
    const updated = await executeWithRetry(
      () => this.prisma.loanRequest.update({ where: { id }, data: { antifraudResult: result, updatedAt: new Date() } }),
      'updateAntifraudResult',
      this.logger,
    );
    return this.mapToDomain(updated);
  }

  async updateRiskBureauResult(id: string, result: string): Promise<LoanRequest> {
    const updated = await executeWithRetry(
      () => this.prisma.loanRequest.update({ where: { id }, data: { riskBureauResult: result, updatedAt: new Date() } }),
      'updateRiskBureauResult',
      this.logger,
    );
    return this.mapToDomain(updated);
  }

  async updateCreditOriginatorResult(id: string, result: string): Promise<LoanRequest> {
    const updated = await executeWithRetry(
      () => this.prisma.loanRequest.update({ where: { id }, data: { creditOriginatorResult: result, updatedAt: new Date() } }),
      'updateCreditOriginatorResult',
      this.logger,
    );
    return this.mapToDomain(updated);
  }

  async findAll(): Promise<LoanRequest[]> {
    const loanRequests = await executeWithRetry(
      () => this.prisma.loanRequest.findMany(),
      'findAll',
      this.logger,
    );
    return loanRequests.map((lr) => this.mapToDomain(lr));
  }

  async delete(id: string): Promise<void> {
    await executeWithRetry(
      () => this.prisma.loanRequest.delete({ where: { id } }),
      'delete',
      this.logger,
    );
  }

  private mapToDomain(p: any): LoanRequest {
    return new LoanRequest(
      p.id,
      p.operationNumber,
      p.channel,
      p.applicantName,
      p.applicantDocument,
      p.requestedAmount,
      p.currency,
      p.termMonths,
      p.interestRate,
      p.destinationAccount,
      p.status as LoanRequestStatus,
      p.createdAt,
      p.updatedAt,
      p.antifraudResult,
      p.riskBureauResult,
      p.creditOriginatorResult,
    );
  }
}
