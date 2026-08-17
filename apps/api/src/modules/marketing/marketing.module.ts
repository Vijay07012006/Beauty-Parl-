import { Module } from '@nestjs/common';
import { DripCampaignService } from './drip-campaign.service';

@Module({
  providers: [DripCampaignService],
  exports: [DripCampaignService],
})
export class MarketingModule {}
