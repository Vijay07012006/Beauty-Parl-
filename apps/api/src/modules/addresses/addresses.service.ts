import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Address } from './address.entity';

@Injectable()
export class AddressesService {
  constructor(
    @InjectRepository(Address)
    private addressRepo: Repository<Address>,
  ) {}

  // Whitelist user-controlled address fields — blocks mass-assignment of id/userId/etc.
  private sanitizeInput(data: Record<string, any>): Partial<Address> {
    const allowed = [
      'name',
      'phone',
      'address',
      'city',
      'state',
      'pincode',
      'isDefault',
    ];
    const clean: Record<string, any> = {};
    for (const key of allowed) {
      if (data?.[key] !== undefined) {
        clean[key] = data[key];
      }
    }
    return clean as Partial<Address>;
  }

  async createAddress(userId: number, data: Partial<Address>) {
    const clean = this.sanitizeInput(data);
    const count = await this.addressRepo.count({ where: { userId } });
    if (count === 0) {
      clean.isDefault = true;
    }

    if (clean.isDefault) {
      await this.addressRepo.update(
        { userId, isDefault: true },
        { isDefault: false },
      );
    }

    const address = this.addressRepo.create({ ...clean, userId });
    await this.addressRepo.save(address);
    return address;
  }

  async getAddresses(userId: number) {
    return this.addressRepo.find({
      where: { userId },
      order: { isDefault: 'DESC', createdAt: 'DESC' },
    });
  }

  async getAddress(userId: number, addressId: number) {
    const address = await this.addressRepo.findOne({
      where: { id: addressId, userId },
    });
    if (!address) {
      throw new NotFoundException('Address not found');
    }
    return address;
  }

  async updateAddress(
    userId: number,
    addressId: number,
    data: Partial<Address>,
  ) {
    const address = await this.getAddress(userId, addressId);
    const clean = this.sanitizeInput(data);

    if (clean.isDefault) {
      await this.addressRepo.update(
        { userId, isDefault: true },
        { isDefault: false },
      );
    }

    Object.assign(address, clean);
    await this.addressRepo.save(address);
    return address;
  }

  async deleteAddress(userId: number, addressId: number) {
    const address = await this.getAddress(userId, addressId);
    await this.addressRepo.delete(addressId);

    if (address.isDefault) {
      const nextAddress = await this.addressRepo.findOne({
        where: { userId },
        order: { createdAt: 'DESC' },
      });
      if (nextAddress) {
        await this.addressRepo.update(nextAddress.id, { isDefault: true });
      }
    }

    return { success: true };
  }

  async setDefaultAddress(userId: number, addressId: number) {
    await this.getAddress(userId, addressId);
    await this.addressRepo.update({ userId }, { isDefault: false });
    await this.addressRepo.update(addressId, { isDefault: true });
    return { success: true };
  }

  async getDefaultAddress(userId: number) {
    return this.addressRepo.findOne({
      where: { userId, isDefault: true },
    });
  }
}
