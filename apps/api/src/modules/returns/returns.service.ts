import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Return } from './return.entity';
import { Order } from '../orders/order.entity';

@Injectable()
export class ReturnsService {
  constructor(
    @InjectRepository(Return)
    private readonly returnRepo: Repository<Return>,
    @InjectRepository(Order)
    private readonly orderRepo: Repository<Order>,
  ) {}

  async requestReturn(
    userId: number,
    orderId: number,
    reason: string,
  ): Promise<Return> {
    const order = await this.orderRepo.findOne({ where: { id: orderId } });
    if (!order) {
      throw new NotFoundException(`Order with ID ${orderId} not found`);
    }

    if (order.userId !== userId) {
      throw new BadRequestException(
        'You can only request returns for your own orders',
      );
    }

    if (order.status !== 'delivered') {
      throw new BadRequestException(
        'Returns can only be requested for delivered orders',
      );
    }

    const existingReturn = await this.returnRepo.findOne({
      where: { orderId },
    });
    if (existingReturn) {
      throw new BadRequestException(
        'A return request already exists for this order',
      );
    }

    const returnRequest = this.returnRepo.create({
      orderId,
      userId,
      reason,
      status: 'pending',
    });

    return this.returnRepo.save(returnRequest);
  }

  async getReturns(userId: number, isAdmin: boolean): Promise<Return[]> {
    if (isAdmin) {
      return this.returnRepo.find({
        relations: ['order', 'user'],
        order: { createdAt: 'DESC' },
      });
    }
    return this.returnRepo.find({
      where: { userId },
      relations: ['order'],
      order: { createdAt: 'DESC' },
    });
  }

  async updateReturnStatus(
    id: number,
    status: 'approved' | 'rejected' | 'completed',
  ): Promise<Return> {
    const returnRequest = await this.returnRepo.findOne({
      where: { id },
      relations: ['order'],
    });
    if (!returnRequest) {
      throw new NotFoundException(`Return request with ID ${id} not found`);
    }

    returnRequest.status = status;

    // If the return is marked completed, update the order status
    if (status === 'completed' && returnRequest.order) {
      returnRequest.order.status = 'cancelled'; // or custom status like 'returned'
      await this.orderRepo.save(returnRequest.order);
    }

    return this.returnRepo.save(returnRequest);
  }
}
