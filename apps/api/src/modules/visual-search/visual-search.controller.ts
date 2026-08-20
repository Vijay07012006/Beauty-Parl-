/* eslint-disable */
import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { VisualSearchService } from './visual-search.service';

@Controller('visual-search')
export class VisualSearchController {
  constructor(private readonly visualSearchService: VisualSearchService) {}

  @Post()
  @UseInterceptors(FileInterceptor('image'))
  async search(@UploadedFile() file: any) {
    if (!file) {
      throw new BadRequestException(
        'No image file uploaded. Please upload an image with field name "image".',
      );
    }

    try {
      const buffer = file.buffer;
      if (!buffer) {
        throw new BadRequestException(
          'Uploaded file is empty or missing buffer.',
        );
      }
      return await this.visualSearchService.searchByImage(buffer);
    } catch (err: any) {
      throw new BadRequestException(
        err.message || 'Failed to process visual search request.',
      );
    }
  }
}
