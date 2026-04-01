import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UniverseService } from './universe.service';
import { JwtGuard } from '../auth/guard/jwt.guard';

@ApiTags('universe')
@Controller('universe')
@UseGuards(JwtGuard)
@ApiBearerAuth()
export class UniverseController {
  constructor(private universeService: UniverseService) {}

  @Get('stars')
  @ApiOperation({ summary: '별 3D 좌표 목록 (곡 기반 UMAP)' })
  @ApiResponse({ status: 200, description: 'Three.js 렌더링용 별 좌표 데이터' })
  getStars() {
    return this.universeService.getStars();
  }

  @Get('planets')
  @ApiOperation({ summary: '행성 3D 좌표 목록 (유저 기반 UMAP)' })
  @ApiResponse({ status: 200, description: 'Three.js 렌더링용 행성 좌표 데이터' })
  getPlanets() {
    return this.universeService.getPlanets();
  }
}
