import { Module } from '@nestjs/common';
import { SongsController } from './songs.controller';
import { SongsService } from './songs.service';
import { SongVectorService } from './song-vector.service';

@Module({
  controllers: [SongsController],
  providers: [SongsService, SongVectorService],
  exports: [SongVectorService],
})
export class SongsModule {}
