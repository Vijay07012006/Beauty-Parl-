import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { ABTestingService } from './ab-testing.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../auth/user.entity';

@Controller('ab-tests')
export class ABTestingController {
  constructor(private readonly abTestingService: ABTestingService) {}

  @Get('active')
  async getActiveTests() {
    return this.abTestingService.listActiveTests();
  }

  @Get('variant')
  async getVariant(
    @Query('userId') userId: string,
    @Query('testName') testName: string,
  ) {
    const variant = await this.abTestingService.getVariantForUser(userId || 'guest', testName);
    return { variant };
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async createTest(
    @Body() body: { name: string; variantA: string; variantB: string; allocation: number },
  ) {
    return this.abTestingService.createTest(
      body.name,
      body.variantA,
      body.variantB,
      body.allocation,
    );
  }
}
