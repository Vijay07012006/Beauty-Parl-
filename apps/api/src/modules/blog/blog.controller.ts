import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { Request } from 'express';
import { BlogService } from './blog.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../auth/user.entity';

@Controller('blog')
export class BlogController {
  constructor(private readonly blogService: BlogService) {}

  @Get()
  async getPosts(@Query('category') category?: string) {
    return this.blogService.getPublishedPosts(category);
  }

  @Get(':slug')
  async getPost(@Param('slug') slug: string) {
    return this.blogService.getPostBySlug(slug);
  }

  @Post(':id/comment')
  @UseGuards(JwtAuthGuard)
  async addComment(
    @Param('id') id: string,
    @Req() req: Request,
    @Body() body: { comment: string },
  ) {
    const userId = (req.user as { id: number }).id;
    return this.blogService.addComment(Number(id), userId, body.comment);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async create(
    @Req() req: Request,
    @Body()
    body: {
      title: string;
      excerpt?: string;
      content: string;
      imageUrl?: string;
      category?: string;
      tags?: string[];
      isPublished?: boolean;
    },
  ) {
    const authorId = (req.user as { id: number }).id;
    return this.blogService.createPost({
      ...body,
      authorId,
    });
  }
}
