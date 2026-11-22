import { Controller, Get, Post, Put, Delete, Body, Param, HttpCode, HttpStatus, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody } from '@nestjs/swagger';
import { LoanRequestService, LoanRequestResponse } from '../../application/loan-request.service';
import { LoanRequestStatus } from '../../domain/entities/loan-request.entity';
import { CreateLoanRequestDto } from './dtos/create-loan-request.dto';
import { UpdateLoanRequestStatusDto } from './dtos/update-loan-request-status.dto';
import { WinstonLogger } from '../logging/winston.logger';

@ApiTags('loans')
@Controller('api/loan-requests')
export class LoanRequestController {
  private readonly logger = new Logger(LoanRequestController.name);

  constructor(
    private readonly loanRequestService: LoanRequestService,
    private readonly winstonLogger: WinstonLogger,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Crear una nueva solicitud de préstamo' })
  @ApiBody({ type: CreateLoanRequestDto })
  @ApiResponse({ status: 201, description: 'Solicitud creada exitosamente' })
  @ApiResponse({ status: 400, description: 'Datos de entrada inválidos' })
  async create(@Body() dto: CreateLoanRequestDto): Promise<LoanRequestResponse> {
    this.winstonLogger.info('Loan request creation initiated', { operationNumber: dto.operationNumber });
    return this.loanRequestService.createLoanRequest(dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener una solicitud de préstamo por ID' })
  @ApiParam({ name: 'id', description: 'ID único de la solicitud' })
  @ApiResponse({ status: 200, description: 'Solicitud encontrada' })
  @ApiResponse({ status: 404, description: 'Solicitud no encontrada' })
  async findById(@Param('id') id: string): Promise<LoanRequestResponse | null> {
    return this.loanRequestService.findById(id);
  }

  @Get()
  @ApiOperation({ summary: 'Listar todas las solicitudes de préstamos' })
  @ApiResponse({ status: 200, description: 'Lista de solicitudes' })
  async findAll(): Promise<LoanRequestResponse[]> {
    return this.loanRequestService.findAll();
  }

  @Put(':id/status')
  @ApiOperation({ summary: 'Actualizar el estado de una solicitud' })
  @ApiParam({ name: 'id', description: 'ID único de la solicitud' })
  @ApiBody({ type: UpdateLoanRequestStatusDto })
  @ApiResponse({ status: 200, description: 'Estado actualizado exitosamente' })
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateLoanRequestStatusDto,
  ): Promise<LoanRequestResponse> {
    return this.loanRequestService.updateStatus(id, dto.status);
  }

  @Put(':id/antifraud-result')
  @ApiOperation({ summary: 'Actualizar resultado del motor antifraude' })
  @ApiParam({ name: 'id', description: 'ID único de la solicitud' })
  @ApiBody({ schema: { properties: { result: { type: 'string' } } } })
  @ApiResponse({ status: 200, description: 'Resultado antifraude actualizado' })
  async updateAntifraudResult(
    @Param('id') id: string,
    @Body('result') result: string,
  ): Promise<LoanRequestResponse> {
    return this.loanRequestService.updateAntifraudResult({ id, result });
  }

  @Put(':id/risk-bureau-result')
  @ApiOperation({ summary: 'Actualizar resultado del buró de riesgos' })
  @ApiParam({ name: 'id', description: 'ID único de la solicitud' })
  @ApiBody({ schema: { properties: { result: { type: 'string' } } } })
  @ApiResponse({ status: 200, description: 'Resultado del buró actualizado' })
  async updateRiskBureauResult(
    @Param('id') id: string,
    @Body('result') result: string,
  ): Promise<LoanRequestResponse> {
    return this.loanRequestService.updateRiskBureauResult({ id, result });
  }

  @Put(':id/credit-originator-result')
  @ApiOperation({ summary: 'Actualizar resultado del originador de créditos' })
  @ApiParam({ name: 'id', description: 'ID único de la solicitud' })
  @ApiBody({ schema: { properties: { result: { type: 'string' } } } })
  @ApiResponse({ status: 200, description: 'Resultado del originador actualizado' })
  async updateCreditOriginatorResult(
    @Param('id') id: string,
    @Body('result') result: string,
  ): Promise<LoanRequestResponse> {
    return this.loanRequestService.updateCreditOriginatorResult({ id, result });
  }

  @Post(':id/process')
  @ApiOperation({ summary: 'Procesar una solicitud de préstamo por todas las etapas' })
  @ApiParam({ name: 'id', description: 'ID único de la solicitud' })
  @ApiResponse({ status: 200, description: 'Solicitud procesada' })
  async processLoanRequest(@Param('id') id: string): Promise<LoanRequestResponse> {
    this.logger.log(`Processing loan request: ${id}`);
    return this.loanRequestService.updateStatus(id, LoanRequestStatus.APPROVED);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Eliminar una solicitud de préstamo' })
  @ApiParam({ name: 'id', description: 'ID único de la solicitud' })
  @ApiResponse({ status: 204, description: 'Solicitud eliminada exitosamente' })
  async delete(@Param('id') id: string): Promise<void> {
    return this.loanRequestService.delete(id);
  }
}
