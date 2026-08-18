import {
  Controller,
  Get,
  Put,
  Param,
  Body,
  UseGuards,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FraudAlert } from './fraud-alert.entity';
import { Order } from '../orders/order.entity';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../auth/user.entity';

@Controller('admin/fraud')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
export class FraudController {
  constructor(
    @InjectRepository(FraudAlert)
    private fraudAlertRepo: Repository<FraudAlert>,
    @InjectRepository(Order)
    private orderRepo: Repository<Order>,
  ) {}

  @Get()
  async getAlerts() {
    return this.fraudAlertRepo.find({
      relations: ['order', 'user'],
      order: { createdAt: 'DESC' },
    });
  }

  @Put(':id/review')
  async reviewAlert(
    @Param('id') id: number,
    @Body() body: { status: 'confirmed' | 'false_positive' | 'reviewed' },
  ) {
    const alert = await this.fraudAlertRepo.findOne({
      where: { id },
      relations: ['order'],
    });
    if (!alert) {
      throw new NotFoundException('Fraud alert not found');
    }

    alert.status = body.status;
    await this.fraudAlertRepo.save(alert);

    if (body.status === 'confirmed' && alert.order) {
      alert.order.status = 'cancelled';
      await this.orderRepo.save(alert.order);
    }

    return alert;
  }
}
