import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ArchiveSongDto } from './dto/archive-song.dto';

@Injectable()
export class SongsService {
  constructor(private prisma: PrismaService) {}

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

    return scored.map(({ track, score }: any) => ({
      title: track.trackName,
      artist: track.artistName,
      album: track.collectionName,
      coverUrl: track.artworkUrl100,
      previewUrl: track.previewUrl,
      genre: track.primaryGenreName,
      relevance: score,
    }));
  }

  async archive(userId: string, dto: ArchiveSongDto) {
    // 같은 곡이 DB에 있으면 재사용, 없으면 생성
    let song = await this.prisma.song.findFirst({
      where: { title: dto.title, artist: dto.artist },
    });

    if (!song) {
      song = await this.prisma.song.create({
        data: {
          title: dto.title,
          artist: dto.artist,
          coverUrl: dto.coverUrl,
        },
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

    return { message: '아카이브에서 삭제되었습니다' };
  }
}
