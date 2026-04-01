import { Module } from '@nestjs/common';
import { UniverseController } from './universe.controller';
import { UniverseService } from './universe.service';
import { PcaService } from './pca.service';

@Module({
  controllers: [UniverseController],
  providers: [UniverseService, PcaService],
  exports: [PcaService],
})
export class UniverseModule {}
