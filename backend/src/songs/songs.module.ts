import { Module } from '@nestjs/common';
import { SongsController } from './songs.controller';
import { SongsService } from './songs.service';
import { SongVectorService } from './song-vector.service';
import { RecommendService } from './recommend.service';
import { UniverseModule } from '../universe/universe.module';

@Module({
  imports: [UniverseModule],
  controllers: [SongsController],
  providers: [SongsService, SongVectorService, RecommendService],
  exports: [SongVectorService],
})
export class SongsModule {}
