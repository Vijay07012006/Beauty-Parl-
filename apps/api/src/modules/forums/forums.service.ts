import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { ForumCategory, Thread, Reply } from './entities/forum.entities';
import { User } from '../auth/user.entity';

@Injectable()
export class ForumsService implements OnModuleInit {
  private genAI: GoogleGenerativeAI | null = null;

  constructor(
    private readonly configService: ConfigService,
    @InjectRepository(ForumCategory)
    private readonly categoryRepo: Repository<ForumCategory>,
    @InjectRepository(Thread)
    private readonly threadRepo: Repository<Thread>,
    @InjectRepository(Reply)
    private readonly replyRepo: Repository<Reply>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {
    const apiKey =
      this.configService.get<string>('geminiApiKey') ||
      process.env.GOOGLE_GEMINI_API_KEY ||
      process.env.GEMINI_API_KEY;
    if (apiKey) {
      this.genAI = new GoogleGenerativeAI(apiKey);
    } else {
      console.warn('⚠️ Google Gemini API key not found. Forums AI moderation will run in bypass mode.');
    }
  }

  async onModuleInit() {
    const count = await this.categoryRepo.count();
    if (count === 0) {
      const defaults = [
        { name: '✨ Skincare Secrets', description: 'Share routines, genetic profile tips, and skin analysis questions.' },
        { name: '💄 Makeup Talk', description: 'Explore visual search matches, AR lipstick shades, and tutorials.' },
        { name: '🎁 Rewards & Gamification', description: 'Loyalty points discussion, beauty chests, and referrals.' },
        { name: '📢 Support & Feedback', description: 'General support, feature suggestions, and shop inquiries.' },
      ];
      for (const cat of defaults) {
        await this.categoryRepo.save(this.categoryRepo.create(cat));
      }
      console.log('🌱 Seeded default Forum Categories successfully.');
    }
  }

  async listCategories(): Promise<ForumCategory[]> {
    return this.categoryRepo.find({ order: { id: 'ASC' } });
  }

  async listCategoryThreads(categoryId: number): Promise<Thread[]> {
    const threads = await this.threadRepo.find({
      where: { categoryId },
      order: { createdAt: 'DESC' },
    });
    for (const thread of threads) {
      const user = await this.userRepo.findOne({ where: { id: thread.userId } });
      if (user) {
        (thread as any).user = {
          id: user.id,
          name: user.name,
          avatar: user.avatar,
        };
      }
    }
    return threads;
  }

  async getThread(threadId: number): Promise<Thread | null> {
    const thread = await this.threadRepo.findOne({ where: { id: threadId } });
    if (!thread) return null;

    const user = await this.userRepo.findOne({ where: { id: thread.userId } });
    if (user) {
      (thread as any).user = {
        id: user.id,
        name: user.name,
        avatar: user.avatar,
      };
    }

    const replies = await this.replyRepo.find({
      where: { threadId },
      order: { createdAt: 'ASC' },
    });

    for (const reply of replies) {
      const ru = await this.userRepo.findOne({ where: { id: reply.userId } });
      if (ru) {
        (reply as any).user = {
          id: ru.id,
          name: ru.name,
          avatar: ru.avatar,
        };
      }
    }

    (thread as any).replies = replies;
    return thread;
  }

  async createThread(
    categoryId: number,
    userId: number,
    title: string,
    content: string,
  ): Promise<Thread> {
    const thread = this.threadRepo.create({
      categoryId,
      userId,
      title,
      content,
    });
    return this.threadRepo.save(thread);
  }

  async createReply(
    threadId: number,
    userId: number,
    content: string,
  ): Promise<Reply> {
    let reply = this.replyRepo.create({
      threadId,
      userId,
      content,
      isHidden: false,
      isModerated: false,
    });
    reply = await this.replyRepo.save(reply);

    if (this.genAI) {
      try {
        const model = this.genAI.getGenerativeModel({
          model: 'gemini-1.5-flash',
          generationConfig: { responseMimeType: 'application/json' },
        });

        const prompt = `
You are a content moderation AI. Analyze the following forum reply content.
Reply text: "${content}"

Flag this text if it contains hate speech, toxicity, harassment, abusive terms, or extreme profanity.
Reply with JSON format only:
{
  "isToxic": true/false
}
`;
        const result = await model.generateContent(prompt);
        const resText = (await result.response).text().trim();
        const json = JSON.parse(resText);

        if (json && json.isToxic === true) {
          reply.isHidden = true;
          console.warn(`🚨 AI Moderation flagged toxic reply #${reply.id}: "${content}"`);
        }
        reply.isModerated = true;
        await this.replyRepo.save(reply);
      } catch (err) {
        console.error('❌ Gemini content moderation query failed:', err);
      }
    }

    return reply;
  }
}
