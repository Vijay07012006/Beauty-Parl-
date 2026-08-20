import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Room } from './entities/room.entity';
import { Product } from '../products/product.entity';
import { CartService } from '../cart/cart.service';

@Injectable()
export class CoShoppingService {
  constructor(
    @InjectRepository(Room)
    private readonly roomRepo: Repository<Room>,
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
    private readonly cartService: CartService,
  ) {}

  async createRoom(hostId: number): Promise<Room> {
    const code = `CS-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    const room = this.roomRepo.create({
      id: code,
      hostId,
      participants: [],
      sharedCartItems: [],
      isActive: true,
    });
    return this.roomRepo.save(room);
  }

  async getRoom(roomId: string): Promise<Room> {
    const room = await this.roomRepo.findOne({ where: { id: roomId } });
    if (!room) {
      throw new NotFoundException(`Co-shopping room with code ${roomId} not found`);
    }
    return room;
  }

  async joinRoom(roomId: string, userId: number, name: string, socketId: string): Promise<Room> {
    const room = await this.getRoom(roomId);
    if (!room.isActive) {
      throw new BadRequestException('This co-shopping room is no longer active');
    }

    const participants = [...room.participants];
    const existingIdx = participants.findIndex((p) => p.userId === userId);
    if (existingIdx > -1) {
      participants[existingIdx].socketId = socketId;
      participants[existingIdx].name = name;
    } else {
      participants.push({ userId, name, socketId });
    }

    room.participants = participants;
    return this.roomRepo.save(room);
  }

  async leaveRoom(roomId: string, socketId: string): Promise<Room> {
    const room = await this.getRoom(roomId);
    room.participants = room.participants.filter((p) => p.socketId !== socketId);
    return this.roomRepo.save(room);
  }

  async addItem(roomId: string, productId: number, quantity: number, addedByUserId: number): Promise<Room> {
    const room = await this.getRoom(roomId);
    if (!room.isActive) {
      throw new BadRequestException('Room is inactive');
    }

    const product = await this.productRepo.findOne({ where: { id: productId } });
    if (!product) {
      throw new NotFoundException('Product not found');
    }

    const items = [...room.sharedCartItems];
    const existingIdx = items.findIndex((i) => i.productId === productId);
    const addedQty = Math.max(1, quantity);

    if (existingIdx > -1) {
      items[existingIdx].quantity += addedQty;
    } else {
      items.push({
        productId: product.id,
        name: product.name,
        price: Number(product.price),
        image: product.image,
        quantity: addedQty,
        addedByUserId,
      });
    }

    room.sharedCartItems = items;
    return this.roomRepo.save(room);
  }

  async removeItem(roomId: string, productId: number, quantity: number, addedByUserId: number): Promise<Room> {
    const room = await this.getRoom(roomId);
    if (!room.isActive) {
      throw new BadRequestException('Room is inactive');
    }

    let items = [...room.sharedCartItems];
    const existingIdx = items.findIndex((i) => i.productId === productId);
    if (existingIdx > -1) {
      items[existingIdx].quantity -= quantity;
      if (items[existingIdx].quantity <= 0) {
        items = items.filter((i) => i.productId !== productId);
      }
      room.sharedCartItems = items;
      return this.roomRepo.save(room);
    }
    return room;
  }

  async checkoutRoom(roomId: string): Promise<Room> {
    const room = await this.getRoom(roomId);
    if (!room.isActive) {
      throw new BadRequestException('Room is already inactive');
    }

    // Close room
    room.isActive = false;
    await this.roomRepo.save(room);

    // Distribute items to participants
    for (const participant of room.participants) {
      const activeCart = await this.cartService.findActiveCart(participant.userId);
      const existingItems = activeCart?.items || [];
      
      // Merge room items into user cart
      const mergedItems = [...existingItems];
      for (const roomItem of room.sharedCartItems) {
        const idx = mergedItems.findIndex((mi) => mi.productId === roomItem.productId);
        if (idx > -1) {
          mergedItems[idx].quantity += roomItem.quantity;
        } else {
          mergedItems.push({
            productId: roomItem.productId,
            name: roomItem.name,
            price: roomItem.price,
            quantity: roomItem.quantity,
            image: roomItem.image,
          });
        }
      }

      await this.cartService.syncCart(participant.userId, undefined, mergedItems);
    }

    return room;
  }
}
