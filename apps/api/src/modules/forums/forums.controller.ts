import { Controller, Get, Post, Body, Param, UseGuards, Request, NotFoundException } from '@nestjs/common';
import { ForumsService } from './forums.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('forums')
export class ForumsController {
  constructor(private readonly forumsService: ForumsService) {}

  @Get('categories')
  async listCategories() {
    return this.forumsService.listCategories();
  }

  @Get('category/:id/threads')
  async listCategoryThreads(@Param('id') id: string) {
    return this.forumsService.listCategoryThreads(Number(id));
  }

  @Get('thread/:id')
  async getThread(@Param('id') id: string) {
    const thread = await this.forumsService.getThread(Number(id));
    if (!thread) {
      throw new NotFoundException(`Thread with ID ${id} not found`);
    }
    return thread;
  }

  @Post('thread')
  @UseGuards(JwtAuthGuard)
  async createThread(
    @Request() req: any,
    @Body() body: { categoryId: number; title: string; content: string },
  ) {
    const userId = Number(req.user.id);
    return this.forumsService.createThread(
      body.categoryId,
      userId,
      body.title,
      body.content,
    );
  }

  @Post('thread/:id/reply')
  @UseGuards(JwtAuthGuard)
  async createReply(
    @Param('id') id: string,
    @Request() req: any,
    @Body() body: { content: string },
  ) {
    const userId = Number(req.user.id);
    return this.forumsService.createReply(
      Number(id),
      userId,
      body.content,
    );
  }
}
