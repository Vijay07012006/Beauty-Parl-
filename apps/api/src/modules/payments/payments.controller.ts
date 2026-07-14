import { Controller, Post, Body, HttpCode, HttpStatus, BadRequestException } from '@nestjs/common';
import { RazorpayService } from './razorpay.service';

@Controller('payments')
export class PaymentsController {
  constructor(private razorpayService: RazorpayService) {}

  @Post('create-order')
  @HttpCode(HttpStatus.OK)
  async createOrder(@Body() body: { amount: number }) {
    if (body.amount === undefined || body.amount <= 0) {
      throw new BadRequestException('Amount must be a positive number');
    }
    return this.razorpayService.createOrder(body.amount);
  }
}
