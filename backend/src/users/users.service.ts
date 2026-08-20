import { Injectable, NotFoundException, ConflictException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { ChangePasswordDto } from './dto/change-password.dto';

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
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        username: true,
        coordX: true,
        coordY: true,
        coordZ: true,
        vectorUpdatedAt: true,
      },
    });

    if (!user) throw new NotFoundException('유저를 찾을 수 없습니다');

    return {
      id: user.id,
      email: user.email,
      username: user.username,
      vectorUpdatedAt: user.vectorUpdatedAt,
      coord: user.coordX !== null
        ? { x: user.coordX, y: user.coordY, z: user.coordZ }
        : null,
    };
  }

  async updateMe(userId: string, dto: UpdateUserDto) {
    if (dto.username) {
      const exists = await this.prisma.user.findUnique({
        where: { username: dto.username },
      });
      if (exists && exists.id !== userId) {
        throw new ConflictException('이미 사용 중인 이름입니다');
      }
    }

    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { username: dto.username },
      select: { id: true, email: true, username: true },
    });

    return user;
  }

  async getUserById(username: string) {
    const user = await this.prisma.user.findUnique({
      where: { username },
      select: {
        id: true,
        username: true,
        coordX: true,
        coordY: true,
        coordZ: true,
      },
    });

    if (!user) throw new NotFoundException('유저를 찾을 수 없습니다');

    return {
      id: user.id,
      username: user.username,
      coord: user.coordX !== null
        ? { x: user.coordX, y: user.coordY, z: user.coordZ }
        : null,
    };
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('유저를 찾을 수 없습니다');

    const isValid = await bcrypt.compare(dto.currentPassword, user.passwordHash);
    if (!isValid) throw new UnauthorizedException('현재 비밀번호가 올바르지 않습니다');

    const passwordHash = await bcrypt.hash(dto.newPassword, 10);
    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });

    return { message: '비밀번호가 변경되었습니다' };
  }

  async deleteMe(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('유저를 찾을 수 없습니다');

    await this.prisma.user.delete({ where: { id: userId } });

    return { message: '계정이 삭제되었습니다' };
  }

  /**
   * 취향 쌍둥이 — taste_vector 코사인 유사도가 가장 높은 다른 유저 1명과
   * 그 유저의 아카이브를 반환한다. 곡 좌표는 이미 계산된 song.coordX/Y/Z를
   * 그대로 쓴다(같은 PCA 모델을 공유하는 우주라 별도 투영이 필요 없음).
   * Gap Node = 쌍둥이는 담았지만 나는 아직 안 담은 곡.
   */
  async findTwin(userId: string) {
    const me = await this.prisma.user.findUnique({ where: { id: userId } });
    const myVector = (me?.tasteVector as number[]) ?? [];
    if (!me || myVector.length === 0) {
      return { twin: null, message: '아카이브에 곡을 저장하면 취향 쌍둥이를 찾을 수 있어요' };
    }

    const others = await this.prisma.user.findMany({
      where: { id: { not: userId }, tasteVector: { isEmpty: false } },
    });

    let best: { user: (typeof others)[number]; similarity: number } | null = null;
    for (const other of others) {
      const similarity = cosineSimilarity(myVector, other.tasteVector as number[]);
      if (!best || similarity > best.similarity) best = { user: other, similarity };
    }
    if (!best) {
      return { twin: null, message: '아직 취향을 비교할 다른 유저가 없어요' };
    }

    const myUserSongs = await this.prisma.userSong.findMany({
      where: { userId },
      select: { songId: true },
    });
    const mySongIds = new Set(myUserSongs.map((us) => us.songId));

    const twinUserSongs = await this.prisma.userSong.findMany({
      where: { userId: best.user.id },
      include: { song: true },
    });
    const twinSongs = twinUserSongs
      .map((us) => us.song)
      .filter((s) => s.coordX !== null && s.coordY !== null && s.coordZ !== null);

    return {
      twin: {
        twinUserId: best.user.id,
        twinUsername: best.user.username,
        matchPercentage: Math.round(best.similarity * 100),
        twinNodes: twinSongs.map((s) => ({
          id: s.id,
          title: s.title,
          artist: s.artist,
          coverUrl: s.coverUrl,
          previewUrl: s.previewUrl,
          genreTags: s.genreTags,
          coord: { x: s.coordX, y: s.coordY, z: s.coordZ },
          isGapNode: !mySongIds.has(s.id),
        })),
      },
    };
  }

  async getUserSongs(username: string) {
    const exists = await this.prisma.user.findUnique({ where: { username } });
    if (!exists) throw new NotFoundException('유저를 찾을 수 없습니다');

    const userSongs = await this.prisma.userSong.findMany({
      where: { userId: exists.id },
      include: { song: true },
      orderBy: { savedAt: 'desc' },
    });

    return userSongs.map((us) => ({
      id: us.id,
      savedAt: us.savedAt,
      source: us.source,
      song: {
        id: us.song.id,
        title: us.song.title,
        artist: us.song.artist,
        coverUrl: us.song.coverUrl,
        previewUrl: us.song.previewUrl,
      },
    }));
  }
}
