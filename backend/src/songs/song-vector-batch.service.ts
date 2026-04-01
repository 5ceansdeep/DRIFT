import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { SongVectorService } from './song-vector.service';
import { PcaService } from '../universe/pca.service';

@Injectable()
export class SongVectorBatchService {
  private readonly logger = new Logger(SongVectorBatchService.name);

  constructor(
    private prisma: PrismaService,
    private songVectorService: SongVectorService,
    private pcaService: PcaService,
  ) {}

  /**
   * 매일 새벽 3시: song_vector 없는 곡 일괄 처리 → PCA refit
   */
  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async fillMissingSongVectors() {
    const songs = await this.prisma.song.findMany({
      where: { songVector: { equals: [] } },
      select: { id: true, title: true, artist: true },
    });

    if (songs.length === 0) {
      this.logger.log('song_vector 없는 곡 없음 — 스킵');
      return;
    }

    this.logger.log(`song_vector 채우기 시작: ${songs.length}개`);
    let updated = 0;

    for (const song of songs) {
      const { vector, tags } = await this.songVectorService.generateSongVector(
        song.title,
        song.artist,
      );

      await this.prisma.song.update({
        where: { id: song.id },
        data: { songVector: vector, genreTags: tags },
      });

      if (vector.some((v) => v > 0)) updated++;

      // Last.fm API 레이트 리밋 대비
      await new Promise((r) => setTimeout(r, 250));
    }

    this.logger.log(`song_vector 완료: ${updated}/${songs.length}개 벡터 생성`);

    // 벡터가 채워졌으니 PCA 재학습 + 전체 좌표 업데이트
    await this.pcaService.fitAndUpdate();
  }
}
