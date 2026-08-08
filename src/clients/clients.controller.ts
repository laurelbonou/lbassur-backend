import { Controller, Get, Post, Body, Req, UnauthorizedException, UseGuards, Patch, Param, ParseEnumPipe } from '@nestjs/common';
import { ClaimStatus } from '@prisma/client';
import { ClientsService } from './clients.service';
import { JwtService } from '@nestjs/jwt';
import { ApiKeyGuard } from '../common/guards/api-key.guard';
import { CreateClaimDto } from './dto/create-claim.dto';

@Controller('clients')
export class ClientsController {
  constructor(
    private readonly clientsService: ClientsService,
    private readonly jwtService: JwtService,
  ) {}

  private extractTokenFromHeader(request: any): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }

  private getClientId(req: any): string {
    const token = this.extractTokenFromHeader(req);
    if (!token) throw new UnauthorizedException('Token required');
    try {
      const payload = this.jwtService.verify(token);
      return payload.sub;
    } catch {
      throw new UnauthorizedException('Invalid token');
    }
  }

  @Get('me/quotes')
  getMyQuotes(@Req() req: any) {
    const clientId = this.getClientId(req);
    return this.clientsService.getMyQuotes(clientId);
  }

  @Get('me/claims')
  getMyClaims(@Req() req: any) {
    const clientId = this.getClientId(req);
    return this.clientsService.getMyClaims(clientId);
  }

  @Post('me/claims')
  createClaim(@Req() req: any, @Body() dto: CreateClaimDto) {
    const clientId = this.getClientId(req);
    return this.clientsService.createClaim(clientId, dto);
  }

  // Admin endpoints
  @Get('claims')
  @UseGuards(ApiKeyGuard)
  getAllClaims() {
    return this.clientsService.getAllClaims();
  }

  @Get('claims/:id')
  @UseGuards(ApiKeyGuard)
  getClaim(@Param('id') id: string) {
    return this.clientsService.getClaim(id);
  }

  @Post('claims/:id/report')
  @UseGuards(ApiKeyGuard)
  generateClaimReport(@Param('id') id: string) {
    return this.clientsService.generateClaimReport(id);
  }

  @Patch('claims/:id')
  @UseGuards(ApiKeyGuard)
  updateClaimStatus(
    @Param('id') id: string,
    @Body('status', new ParseEnumPipe(ClaimStatus)) status: ClaimStatus,
    @Body('adminNote') adminNote?: string,
  ) {
    return this.clientsService.updateClaimStatus(id, status, adminNote);
  }

  // --- Profile Change Requests ---

  @Get('me/change-requests')
  getMyChangeRequests(@Req() req: any) {
    const clientId = this.getClientId(req);
    return this.clientsService.getMyChangeRequests(clientId);
  }

  @Post('me/change-requests')
  createChangeRequest(@Req() req: any, @Body() body: any) {
    const clientId = this.getClientId(req);
    return this.clientsService.createChangeRequest(clientId, body);
  }

  // Admin endpoints for change requests
  @Get('change-requests')
  @UseGuards(ApiKeyGuard)
  getAllChangeRequests() {
    return this.clientsService.getAllChangeRequests();
  }

  @Patch('change-requests/:id/status')
  @UseGuards(ApiKeyGuard)
  updateChangeRequestStatus(
    @Param('id') id: string, 
    @Body('status') status: string,
    @Body('adminNote') adminNote?: string
  ) {
    return this.clientsService.updateChangeRequestStatus(id, status, adminNote);
  }
}
