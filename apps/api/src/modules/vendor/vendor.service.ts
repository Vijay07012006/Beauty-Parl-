import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Vendor } from './entities/vendor.entity';
import { User, UserRole } from '../auth/user.entity';
import { Product } from '../products/product.entity';

@Injectable()
export class VendorService {
  constructor(
    @InjectRepository(Vendor)
    private readonly vendorRepo: Repository<Vendor>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
  ) {}

  async registerVendor(userId: number, storeName: string, businessRegNumber: string): Promise<Vendor> {
    const existing = await this.vendorRepo.findOne({ where: { userId } });
    if (existing) {
      return existing;
    }
    const rate = Number(process.env.MARKETPLACE_COMMISSION_RATE) || 15.0;
    const vendor = this.vendorRepo.create({
      userId,
      storeName,
      businessRegNumber,
      commissionRate: rate,
      status: 'pending',
    });
    return this.vendorRepo.save(vendor);
  }

  async updateVendorStatus(vendorId: number, status: 'approved' | 'rejected'): Promise<Vendor> {
    const vendor = await this.vendorRepo.findOne({ where: { id: vendorId } });
    if (!vendor) {
      throw new NotFoundException(`Vendor with ID ${vendorId} not found`);
    }

    vendor.status = status;
    const saved = await this.vendorRepo.save(vendor);

    if (status === 'approved') {
      const user = await this.userRepo.findOne({ where: { id: vendor.userId } });
      if (user) {
        user.role = UserRole.VENDOR;
        await this.userRepo.save(user);
      }
    }

    return saved;
  }

  async listVendors(): Promise<Vendor[]> {
    const vendors = await this.vendorRepo.find({ order: { id: 'DESC' } });
    for (const vendor of vendors) {
      const u = await this.userRepo.findOne({ where: { id: vendor.userId } });
      if (u) {
        (vendor as any).user = {
          name: u.name,
          email: u.email,
        };
      }
    }
    return vendors;
  }

  async findVendorByUserId(userId: number): Promise<Vendor | null> {
    return this.vendorRepo.findOne({ where: { userId } });
  }

  async listVendorProducts(vendorId: number): Promise<Product[]> {
    return this.productRepo.find({ where: { vendorId } });
  }

  async createVendorProduct(vendorId: number, details: Partial<Product>): Promise<Product> {
    const product = this.productRepo.create({
      ...details,
      vendorId,
    });
    return this.productRepo.save(product);
  }
}
