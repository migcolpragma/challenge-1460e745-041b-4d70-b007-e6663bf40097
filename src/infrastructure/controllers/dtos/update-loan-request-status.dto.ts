import { IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { LoanRequestStatus } from '../../../domain/entities/loan-request.entity';

export class UpdateLoanRequestStatusDto {
  @ApiProperty({ enum: LoanRequestStatus })
  @IsEnum(LoanRequestStatus)
  status!: LoanRequestStatus;
}
