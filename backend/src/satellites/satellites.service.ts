import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSatelliteDto } from './dto/create-satellite.dto';
import { UpdateSatelliteDto } from './dto/update-satellite.dto';

const MAX_SATELLITES = 3;

@Injectable()
export class SatellitesService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, dto: CreateSatelliteDto) {
    const count = await this.prisma.satellite.count({
      where: { ownerId: userId },
    });
    if (count >= MAX_SATELLITES) {
      throw new BadRequestException(`Satellite은 최대 ${MAX_SATELLITES}개까지 등록할 수 있습니다`);
    }

    // 같은 곡이 DB에 있으면 재사용
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

    const satellite = await this.prisma.satellite.create({
      data: {
        ownerId: userId,
        songId: song.id,
        message: dto.message,
      },
      include: { song: true },
    });

    return {
      id: satellite.id,
      message: satellite.message,
      createdAt: satellite.createdAt,
      song: {
        id: song.id,
        title: song.title,
        artist: song.artist,
        coverUrl: song.coverUrl,
      },
    };
  }

  async getMySatellites(userId: string) {
    const satellites = await this.prisma.satellite.findMany({
      where: { ownerId: userId },
      include: { song: true },
      orderBy: { createdAt: 'desc' },
    });

    return satellites.map((s) => ({
      id: s.id,
      message: s.message,
      createdAt: s.createdAt,
      song: {
        id: s.song.id,
        title: s.song.title,
        artist: s.song.artist,
        coverUrl: s.song.coverUrl,
      },
    }));
  }

  async getUserSatellites(username: string) {
    const user = await this.prisma.user.findUnique({
      where: { username },
    });
    if (!user) {
      throw new NotFoundException('해당 유저를 찾을 수 없습니다');
    }

    const satellites = await this.prisma.satellite.findMany({
      where: { ownerId: user.id },
      include: { song: true },
      orderBy: { createdAt: 'desc' },
    });

    return satellites.map((s) => ({
      id: s.id,
      message: s.message,
      createdAt: s.createdAt,
      song: {
        id: s.song.id,
        title: s.song.title,
        artist: s.song.artist,
        coverUrl: s.song.coverUrl,
      },
    }));
  }

  async remove(userId: string, satelliteId: string) {
    const satellite = await this.prisma.satellite.findFirst({
      where: { id: satelliteId, ownerId: userId },
    });

    if (!satellite) {
      throw new NotFoundException('해당 Satellite을 찾을 수 없습니다');
    }

    await this.prisma.satellite.delete({ where: { id: satelliteId } });

    return { message: 'Satellite이 삭제되었습니다' };
  }

  async update(userId: string, satelliteId: string, dto: UpdateSatelliteDto) {
    const satellite = await this.prisma.satellite.findFirst({
      where: { id: satelliteId, ownerId: userId },
    });

    if (!satellite) {
      throw new NotFoundException('해당 Satellite을 찾을 수 없습니다');
    }

    // 곡 변경이 있으면 새 곡으로 교체
    let songId = satellite.songId;
    if (dto.title && dto.artist) {
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
      songId = song.id;
    }

    const updated = await this.prisma.satellite.update({
      where: { id: satelliteId },
      data: {
        songId,
        message: dto.message !== undefined ? dto.message : satellite.message,
      },
      include: { song: true },
    });

    return {
      id: updated.id,
      message: updated.message,
      createdAt: updated.createdAt,
      song: {
        id: updated.song.id,
        title: updated.song.title,
        artist: updated.song.artist,
        coverUrl: updated.song.coverUrl,
      },
    };
  }
}
