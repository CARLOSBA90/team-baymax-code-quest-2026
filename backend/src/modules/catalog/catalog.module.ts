import { Module } from '@nestjs/common';
import { CatalogController } from './catalog.controller.js';
import { CatalogCacheService } from './catalog-cache.service.js';
import { CatalogService } from './catalog.service.js';

@Module({
  controllers: [CatalogController],
  providers: [CatalogService, CatalogCacheService],
  exports: [CatalogService, CatalogCacheService],
})
export class CatalogModule {}
