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

    // coverUrl 없는 곡도 함께 처리
    await this.fillMissingCoverUrls();

    // 벡터가 채워졌으니 PCA 재학습 + 전체 좌표 업데이트
    await this.pcaService.fitAndUpdate();
  }

  /**
   * coverUrl 없는 곡을 iTunes에서 재조회하여 고화질(600x600) 아트워크로 채움
   */
  async fillMissingCoverUrls() {
    const songs = await this.prisma.song.findMany({
      where: { coverUrl: null },
      select: { id: true, title: true, artist: true },
    });

    if (songs.length === 0) {
      this.logger.log('coverUrl 없는 곡 없음 — 스킵');
      return;
    }

    this.logger.log(`coverUrl 채우기 시작: ${songs.length}개`);
    let updated = 0;

    for (const song of songs) {
      const coverUrl = await this.fetchItunesCoverUrl(song.title, song.artist);
      if (coverUrl) {
        await this.prisma.song.update({
          where: { id: song.id },
          data: { coverUrl },
        });
        updated++;
      }
      await new Promise((r) => setTimeout(r, 100));
    }

    this.logger.log(`coverUrl 완료: ${updated}/${songs.length}개 업데이트`);
  }

  private async fetchItunesCoverUrl(title: string, artist: string): Promise<string | null> {
    try {
      const url = `https://itunes.apple.com/search?term=${encodeURIComponent(artist + ' ' + title)}&entity=song&limit=5&country=kr`;
      const res = await fetch(url);
      const data = await res.json();

      const artwork = data.results?.[0]?.artworkUrl100;
      if (!artwork) return null;

      // 100x100 → 600x600 고화질로 교체
      return artwork.replace('100x100bb', '600x600bb');
    } catch {
      return null;
    }
  }
}
