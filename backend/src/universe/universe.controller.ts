import { Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UniverseService } from './universe.service';
import { PcaService } from './pca.service';
import { JwtGuard } from '../auth/guard/jwt.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('universe')
@Controller('universe')
@UseGuards(JwtGuard)
@ApiBearerAuth()
export class UniverseController {
  constructor(
    private universeService: UniverseService,
    private pcaService: PcaService,
  ) {}

  @Get('stars')
  @ApiOperation({ summary: '별 3D 좌표 목록 (곡 기반 PCA)' })
  @ApiResponse({ status: 200, description: 'Three.js 렌더링용 별 좌표 데이터' })
  getStars(@CurrentUser() user: { id: string }) {
    return this.universeService.getStars(user.id);
  }

  @Get('planets')
  @ApiOperation({ summary: '행성 3D 좌표 목록 (유저 기반 PCA)' })
  @ApiResponse({ status: 200, description: 'Three.js 렌더링용 행성 좌표 데이터' })
  getPlanets() {
    return this.universeService.getPlanets();
  }

  @Post('refit')
  @ApiOperation({ summary: 'PCA 모델 재학습 + 전체 좌표 업데이트' })
  @ApiResponse({ status: 200, description: '업데이트된 곡/유저 수 반환' })
  refit() {
    return this.pcaService.fitAndUpdate();
  }
}
