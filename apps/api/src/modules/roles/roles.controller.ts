import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role } from './role.entity';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../auth/user.entity';

@Controller('roles')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.SUPER_ADMIN)
export class RolesController {
  constructor(
    @InjectRepository(Role)
    private roleRepo: Repository<Role>
  ) {}

  @Get()
  async getRoles() {
    return this.roleRepo.find({ order: { name: 'ASC' } });
  }

  @Post()
  async createRole(@Body() body: { name: string; permissions: string[] }) {
    const role = this.roleRepo.create({
      name: body.name,
      permissions: body.permissions,
    });
    return this.roleRepo.save(role);
  }

  @Put(':id')
  async updateRole(
    @Param('id') id: number,
    @Body() body: { name?: string; permissions?: string[]; isActive?: boolean }
  ) {
    await this.roleRepo.update(id, body);
    return this.roleRepo.findOne({ where: { id } });
  }

  @Delete(':id')
  async deleteRole(@Param('id') id: number) {
    await this.roleRepo.delete(id);
    return { success: true };
  }
}
