import { IsString, IsNumber, IsDate, IsEnum, IsUUID } from 'class-validator';

export enum LoanRequestStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  TIMEOUT = 'TIMEOUT',
  PENDING_ANTIFRAUD = 'PENDING_ANTIFRAUD',
}

export class LoanRequest {
  @IsUUID()
  id: string;

  @IsString()
  operationNumber: string;

  @IsString()
  channel: string;

  @IsString()
  applicantName: string;

  @IsString()
  applicantDocument: string;

  @IsNumber()
  requestedAmount: number;

  @IsString()
  currency: string;

  @IsNumber()
  termMonths: number;

  @IsNumber()
  interestRate: number;

  @IsString()
  destinationAccount: string;

  @IsEnum(LoanRequestStatus)
  status: LoanRequestStatus;

  @IsDate()
  createdAt: Date;

  @IsDate()
  updatedAt: Date;

  antifraudResult?: string | null;
  riskBureauResult?: string | null;
  creditOriginatorResult?: string | null;

  constructor(
    id: string,
    operationNumber: string,
    channel: string,
    applicantName: string,
    applicantDocument: string,
    requestedAmount: number,
    currency: string,
    termMonths: number,
    interestRate: number,
    destinationAccount: string,
    status: LoanRequestStatus = LoanRequestStatus.PENDING,
    createdAt: Date = new Date(),
    updatedAt: Date = new Date(),
    antifraudResult?: string | null,
    riskBureauResult?: string | null,
    creditOriginatorResult?: string | null,
  ) {
    this.id = id;
    this.operationNumber = operationNumber;
    this.channel = channel;
    this.applicantName = applicantName;
    this.applicantDocument = applicantDocument;
    this.requestedAmount = requestedAmount;
    this.currency = currency;
    this.termMonths = termMonths;
    this.interestRate = interestRate;
    this.destinationAccount = destinationAccount;
    this.status = status;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
    this.antifraudResult = antifraudResult;
    this.riskBureauResult = riskBureauResult;
    this.creditOriginatorResult = creditOriginatorResult;
  }

  updateStatus(newStatus: LoanRequestStatus): void {
    this.status = newStatus;
    this.updatedAt = new Date();
  }

  updateAntifraudResult(result: string): void {
    this.antifraudResult = result;
    this.updatedAt = new Date();
  }

  updateRiskBureauResult(result: string): void {
    this.riskBureauResult = result;
    this.updatedAt = new Date();
  }

  updateCreditOriginatorResult(result: string): void {
    this.creditOriginatorResult = result;
    this.updatedAt = new Date();
  }
}
