import { Body, Controller, Get, Inject, Param, ParseIntPipe, Post } from '@nestjs/common';
import type { Loan } from '@formation/shared';
import { LoansService } from './loans.service';

@Controller('loans')
export class LoansController {
  constructor(@Inject(LoansService) private readonly loansService: LoansService) {}

  @Get()
  list(): Promise<Loan[]> {
    return this.loansService.list();
  }

  @Post()
  borrow(@Body() body: unknown): Promise<Loan> {
    return this.loansService.borrow(body);
  }

  @Post(':id/return')
  returnLoan(@Param('id', ParseIntPipe) id: number): Promise<Loan> {
    return this.loansService.returnLoan(id);
  }
}
