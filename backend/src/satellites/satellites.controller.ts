import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { SatellitesService } from './satellites.service';
import { JwtGuard } from '../auth/guard/jwt.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CreateSatelliteDto } from './dto/create-satellite.dto';
import { UpdateSatelliteDto } from './dto/update-satellite.dto';

@ApiTags('satellites')
@Controller('satellites')
@UseGuards(JwtGuard)
@ApiBearerAuth()
export class SatellitesController {
  constructor(private satellitesService: SatellitesService) {}

  @Post()
  @ApiOperation({ summary: 'Satellite 등록 (최대 3개)' })
  @ApiResponse({ status: 201, description: '등록 성공' })
  @ApiResponse({ status: 400, description: '최대 개수 초과' })
  create(@CurrentUser() user: { id: string }, @Body() dto: CreateSatelliteDto) {
    return this.satellitesService.create(user.id, dto);
  }

  @Get('my')
  @ApiOperation({ summary: '내 Satellite 목록' })
  @ApiResponse({ status: 200, description: 'Satellite 목록' })
  getMySatellites(@CurrentUser() user: { id: string }) {
    return this.satellitesService.getMySatellites(user.id);
  }

  @Get('user/:username')
  @ApiOperation({ summary: '특정 유저의 Satellite 목록' })
  @ApiParam({ name: 'username', description: '조회할 유저 username' })
  @ApiResponse({ status: 200, description: 'Satellite 목록' })
  @ApiResponse({ status: 404, description: '유저를 찾을 수 없음' })
  getUserSatellites(@Param('username') username: string) {
    return this.satellitesService.getUserSatellites(username);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Satellite 삭제' })
  @ApiParam({ name: 'id', description: '삭제할 Satellite ID' })
  @ApiResponse({ status: 200, description: '삭제 성공' })
  @ApiResponse({ status: 404, description: 'Satellite을 찾을 수 없음' })
  remove(@CurrentUser() user: { id: string }, @Param('id') id: string) {
    return this.satellitesService.remove(user.id, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Satellite 수정 (곡 변경, 메시지 변경)' })
  @ApiParam({ name: 'id', description: '수정할 Satellite ID' })
  @ApiResponse({ status: 200, description: '수정 성공' })
  @ApiResponse({ status: 404, description: 'Satellite을 찾을 수 없음' })
  update(@CurrentUser() user: { id: string }, @Param('id') id: string, @Body() dto: UpdateSatelliteDto) {
    return this.satellitesService.update(user.id, id, dto);
  }
}
