import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const STAR_COUNT = 5;
const COMET_COUNT = 3;
const STAR_THRESHOLD = 0.5;
const COMET_MIN = 0.2;
const COMET_MAX = 0.5;

function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

@Injectable()
export class RecommendService {
  constructor(private prisma: PrismaService) {}

  async recommend(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.tasteVector || (user.tasteVector as number[]).length === 0) {
      return { stars: [], comets: [], message: '아카이브에 곡을 저장하면 추천이 시작됩니다' };
    }

    const tasteVector = user.tasteVector as number[];

    const archivedSongIds = (
      await this.prisma.userSong.findMany({ where: { userId }, select: { songId: true } })
    ).map((us) => us.songId);

    const songs = await this.prisma.song.findMany({
      where: {
        id: { notIn: archivedSongIds.length ? archivedSongIds : ['__none__'] },
        songVector: { isEmpty: false },
      },
    });

    const scored = songs.map((song) => ({
      song,
      similarity: cosineSimilarity(tasteVector, song.songVector as number[]),
    }));

    // Stars: 코사인 유사도 높은 상위 N개
    const stars = scored
      .filter((s) => s.similarity >= STAR_THRESHOLD)
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, STAR_COUNT)
      .map(({ song, similarity }) => this.formatSong(song, similarity));

    // Comets: 중간 유사도 랜덤 샘플 (serendipity)
    const comets = scored
      .filter((s) => s.similarity >= COMET_MIN && s.similarity < COMET_MAX)
      .sort(() => Math.random() - 0.5)
      .slice(0, COMET_COUNT)
      .map(({ song, similarity }) => this.formatSong(song, similarity));

    return { stars, comets };
  }

  private formatSong(song: any, similarity: number) {
    return {
      id: song.id,
      title: song.title,
      artist: song.artist,
      coverUrl: song.coverUrl,
      genreTags: song.genreTags,
      similarity: Math.round(similarity * 1000) / 1000,
    };
  }
}
