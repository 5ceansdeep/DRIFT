import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ArchiveSongDto } from './dto/archive-song.dto';
import { SongVectorService } from './song-vector.service';

@Injectable()
export class SongsService {
  constructor(
    private prisma: PrismaService,
    private songVectorService: SongVectorService,
  ) {}

  async search(query: string) {
    const url = `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&entity=song&country=kr&limit=50`;
    const response = await fetch(url);
    const data = await response.json();

    const queryChars = [...new Set(query.toLowerCase().replace(/\s+/g, ''))];
    const keywords = query.toLowerCase().split(/\s+/);

    const scored = data.results
      .map((track: any) => {
        const title = (track.trackName || '').toLowerCase();
        const artist = (track.artistName || '').toLowerCase();

        let score = 0;

        // 글자 단위 매칭 (한 글자씩 체크)
        for (const ch of queryChars) {
          if (title.includes(ch)) score += 2;
          if (artist.includes(ch)) score += 1;
        }

        // 키워드 단위 보너스 (연속 문자열 매칭 = 더 정확)
        for (const kw of keywords) {
          if (title.includes(kw)) score += 10;
          if (artist.includes(kw)) score += 5;
        }

        return { track, score };
      })
      .sort((a: any, b: any) => b.score - a.score);

    const results = scored.map(({ track, score }: any) => ({
      title: track.trackName,
      artist: track.artistName,
      album: track.collectionName,
      coverUrl: track.artworkUrl100,
      previewUrl: track.previewUrl,
      genre: track.primaryGenreName,
      relevance: score,
    }));

    // 응답 반환 후 백그라운드로 곡 정보만 저장 (song_vector는 아카이브 시 생성)
    setImmediate(() => this.saveSongsToPool(results).catch(() => {}));

    return results;
  }

  /**
   * 검색 결과를 songs 테이블에 저장 (title/artist/coverUrl만, song_vector 없이)
   * song_vector는 실제 아카이브 시 생성됨
   */
  private async saveSongsToPool(results: any[]) {
    for (const result of results) {
      if (!result.title || !result.artist) continue;

      const exists = await this.prisma.song.findFirst({
        where: { title: result.title, artist: result.artist },
      });
      if (exists) continue;

      await this.prisma.song.create({
        data: {
          title: result.title,
          artist: result.artist,
          coverUrl: result.coverUrl,
        },
      });
    }
  }

  async archive(userId: string, dto: ArchiveSongDto) {
    // 같은 곡이 DB에 있으면 재사용, 없으면 생성
    let song = await this.prisma.song.findFirst({
      where: { title: dto.title, artist: dto.artist },
    });

    if (!song) {
      // Last.fm에서 태그 조회 → song_vector 생성
      const { vector, tags } = await this.songVectorService.generateSongVector(dto.title, dto.artist);

      song = await this.prisma.song.create({
        data: {
          title: dto.title,
          artist: dto.artist,
          coverUrl: dto.coverUrl,
          songVector: vector,
          genreTags: tags,
        },
      });
    } else if ((song.songVector as number[]).length === 0) {
      // 검색 자동 저장으로 들어온 곡 (song_vector 없음) → 지금 생성
      const { vector, tags } = await this.songVectorService.generateSongVector(dto.title, dto.artist);

      song = await this.prisma.song.update({
        where: { id: song.id },
        data: { songVector: vector, genreTags: tags },
      });
    }

    // UserSong 연결 (이미 있으면 무시)
    await this.prisma.userSong.upsert({
      where: {
        userId_songId: { userId, songId: song.id },
      },
      update: {},
      create: {
        userId,
        songId: song.id,
        source: dto.source,
        emotionTags: dto.emotionTags,
      },
    });

    // taste_vector 재계산
    await this.updateTasteVector(userId);

    return { message: '아카이브에 저장되었습니다', song };
  }

  async getMySongs(userId: string) {
    const userSongs = await this.prisma.userSong.findMany({
      where: { userId },
      include: { song: true },
      orderBy: { savedAt: 'desc' },
    });

    return userSongs.map((us) => ({
      id: us.id,
      savedAt: us.savedAt,
      playCount: us.playCount,
      source: us.source,
      emotionTags: us.emotionTags,
      song: {
        id: us.song.id,
        title: us.song.title,
        artist: us.song.artist,
        coverUrl: us.song.coverUrl,
      },
    }));
  }

  async removeFromArchive(userId: string, userSongId: string) {
    const userSong = await this.prisma.userSong.findFirst({
      where: { id: userSongId, userId },
    });

    if (!userSong) {
      throw new NotFoundException('아카이브에서 해당 곡을 찾을 수 없습니다');
    }

    await this.prisma.userSong.delete({
      where: { id: userSongId },
    });

    // taste_vector 재계산
    await this.updateTasteVector(userId);

    return { message: '아카이브에서 삭제되었습니다' };
  }

  /**
   * 유저의 저장곡 song_vector 평균 → taste_vector 업데이트
   */
  private async updateTasteVector(userId: string) {
    const userSongs = await this.prisma.userSong.findMany({
      where: { userId },
      include: { song: true },
    });

    const vectors = userSongs
      .map((us) => us.song.songVector)
      .filter((v) => v.length > 0);

    if (vectors.length === 0) {
      await this.prisma.user.update({
        where: { id: userId },
        data: { tasteVector: [], vectorUpdatedAt: new Date() },
      });
      return;
    }

    // 각 차원별 평균
    const size = vectors[0].length;
    const avg = new Array(size).fill(0);
    for (const v of vectors) {
      for (let i = 0; i < size; i++) {
        avg[i] += v[i];
      }
    }
    for (let i = 0; i < size; i++) {
      avg[i] = Math.round((avg[i] / vectors.length) * 1000) / 1000;
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { tasteVector: avg, vectorUpdatedAt: new Date() },
    });
  }
}
