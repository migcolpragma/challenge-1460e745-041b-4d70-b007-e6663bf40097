import { LoanRequest, LoanRequestStatus } from '../entities/loan-request.entity';

export abstract class LoanRequestRepository {
  abstract create(loanRequest: LoanRequest): Promise<LoanRequest>;
  abstract findById(id: string): Promise<LoanRequest | null>;
  abstract findByOperationNumberAndChannel(operationNumber: string, channel: string): Promise<LoanRequest | null>;
  abstract updateStatus(id: string, status: LoanRequestStatus): Promise<LoanRequest>;
  abstract updateAntifraudResult(id: string, result: string): Promise<LoanRequest>;
  abstract updateRiskBureauResult(id: string, result: string): Promise<LoanRequest>;
  abstract updateCreditOriginatorResult(id: string, result: string): Promise<LoanRequest>;
  abstract findAll(): Promise<LoanRequest[]>;
  abstract delete(id: string): Promise<void>;
}
