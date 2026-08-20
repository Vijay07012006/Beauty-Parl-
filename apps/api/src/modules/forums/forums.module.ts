import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ForumCategory, Thread, Reply } from './entities/forum.entities';
import { User } from '../auth/user.entity';
import { ForumsService } from './forums.service';
import { ForumsController } from './forums.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([ForumCategory, Thread, Reply, User]),
  ],
  controllers: [ForumsController],
  providers: [ForumsService],
  exports: [ForumsService],
})
export class ForumsModule {}
