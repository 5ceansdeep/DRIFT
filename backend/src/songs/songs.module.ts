import { Module } from '@nestjs/common';
import { SongsController } from './songs.controller';
import { SongsService } from './songs.service';
import { SongVectorService } from './song-vector.service';
import { RecommendService } from './recommend.service';

@Module({
  controllers: [SongsController],
  providers: [SongsService, SongVectorService, RecommendService],
  exports: [SongVectorService],
})
export class SongsModule {}
