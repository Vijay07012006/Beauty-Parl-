import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BlogPost } from './blog-post.entity';
import { BlogComment } from './blog-comment.entity';

@Injectable()
export class BlogService {
  constructor(
    @InjectRepository(BlogPost)
    private readonly postRepo: Repository<BlogPost>,
    @InjectRepository(BlogComment)
    private readonly commentRepo: Repository<BlogComment>,
  ) {}

  async createPost(data: {
    title: string;
    excerpt?: string;
    content: string;
    imageUrl?: string;
    category?: string;
    tags?: string[];
    authorId?: number;
    isPublished?: boolean;
  }): Promise<BlogPost> {
    const slug = data.title
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');

    // Ensure slug uniqueness simple suffix strategy
    let finalSlug = slug;
    let count = 1;
    while (await this.postRepo.findOne({ where: { slug: finalSlug } })) {
      finalSlug = `${slug}-${count}`;
      count++;
    }

    const post = this.postRepo.create({
      ...data,
      slug: finalSlug,
      isPublished: data.isPublished ?? false,
    });
    return this.postRepo.save(post);
  }

  async getPublishedPosts(category?: string): Promise<BlogPost[]> {
    const where: any = { isPublished: true };
    if (category) {
      where.category = category;
    }
    return this.postRepo.find({
      where,
      order: { createdAt: 'DESC' },
      relations: ['author'],
    });
  }

  async getPostBySlug(slug: string): Promise<BlogPost> {
    const post = await this.postRepo.findOne({
      where: { slug },
      relations: ['author', 'comments', 'comments.user'],
    });
    if (!post) {
      throw new NotFoundException('Blog post not found');
    }
    // Increment view count
    post.viewCount += 1;
    await this.postRepo.save(post);
    return post;
  }

  async addComment(
    postId: number,
    userId: number,
    commentText: string,
  ): Promise<BlogComment> {
    const post = await this.postRepo.findOne({ where: { id: postId } });
    if (!post) {
      throw new NotFoundException('Blog post not found');
    }
    const comment = this.commentRepo.create({
      postId,
      userId,
      comment: commentText,
      isApproved: true, // Auto-approve for verified users in dev
    });
    return this.commentRepo.save(comment);
  }

  async approveComment(commentId: number): Promise<BlogComment> {
    const comment = await this.commentRepo.findOne({
      where: { id: commentId },
    });
    if (!comment) {
      throw new NotFoundException('Comment not found');
    }
    comment.isApproved = true;
    return this.commentRepo.save(comment);
  }
}
