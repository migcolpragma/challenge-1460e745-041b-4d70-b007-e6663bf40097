import { IsString, IsNumber, IsNotEmpty, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateLoanRequestDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  operationNumber!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  channel!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  applicantName!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  applicantDocument!: string;

  @ApiProperty()
  @IsNumber()
  @Min(1)
  requestedAmount!: number;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  currency!: string;

  @ApiProperty()
  @IsNumber()
  @Min(1)
  termMonths!: number;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  interestRate!: number;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  destinationAccount!: string;
}
