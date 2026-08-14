import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { User } from '../auth/user.entity';

@Injectable()
export class BulkUserActionsService {
  constructor(
    @InjectRepository(User)
    private userRepo: Repository<User>,
  ) {}

  async bulkSuspend(userIds: number[]): Promise<{ success: boolean; count: number }> {
    if (!userIds || userIds.length === 0) {
      throw new BadRequestException('User IDs array is empty');
    }

    // Do not allow suspending admins or super_admins through bulk user action to prevent locking admins out
    const adminUsers = await this.userRepo.find({
      where: { id: In(userIds), role: In(['admin', 'super_admin']) },
    });

    if (adminUsers.length > 0) {
      throw new BadRequestException('Cannot bulk suspend administrative or super-admin users');
    }

    const result = await this.userRepo.update(
      { id: In(userIds) },
      { isActive: false }
    );

    return { success: true, count: result.affected || 0 };
  }

  async bulkDelete(userIds: number[]): Promise<{ success: boolean; count: number }> {
    if (!userIds || userIds.length === 0) {
      throw new BadRequestException('User IDs array is empty');
    }

    // Do not allow deleting admins/super_admins
    const adminUsers = await this.userRepo.find({
      where: { id: In(userIds), role: In(['admin', 'super_admin']) },
    });

    if (adminUsers.length > 0) {
      throw new BadRequestException('Cannot bulk delete administrative or super-admin users');
    }

    const result = await this.userRepo.delete({
      id: In(userIds)
    });

    return { success: true, count: result.affected || 0 };
  }
}
