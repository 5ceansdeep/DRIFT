import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSectorDto } from './dto/create-sector.dto';

@Injectable()
export class SectorsService {
  constructor(private prisma: PrismaService) {}

  private toResponse(sector: {
    id: string;
    name: string;
    boundsMin: number[];
    boundsMax: number[];
    trackIds: string[];
    createdAt: Date;
  }) {
    return {
      sectorId: sector.id,
      name: sector.name,
      bounds: { min: sector.boundsMin, max: sector.boundsMax },
      trackIds: sector.trackIds,
      createdAt: sector.createdAt.toISOString(),
    };
  }

  async findMine(userId: string) {
    const sectors = await this.prisma.sector.findMany({
      where: { ownerId: userId },
      orderBy: { createdAt: 'asc' },
    });
    return sectors.map((s) => this.toResponse(s));
  }

  async create(userId: string, dto: CreateSectorDto) {
    const sector = await this.prisma.sector.create({
      data: {
        ownerId: userId,
        name: dto.name,
        boundsMin: dto.boundsMin,
        boundsMax: dto.boundsMax,
        trackIds: dto.trackIds,
      },
    });
    return this.toResponse(sector);
  }

  async remove(userId: string, sectorId: string) {
    const sector = await this.prisma.sector.findFirst({
      where: { id: sectorId, ownerId: userId },
    });
    if (!sector) throw new NotFoundException('해당 구역을 찾을 수 없습니다');

    await this.prisma.sector.delete({ where: { id: sectorId } });
    return { message: '구역이 삭제되었습니다' };
  }
}
