import { Controller, Get } from '@nestjs/common';
import { TikTokService } from './tiktok.service';

@Controller('tiktok')
export class TikTokController {
  constructor(private readonly tiktokService: TikTokService) {}

  @Get('feed')
  generateFeed() {
    return this.tiktokService.generateFeed();
  }
}
