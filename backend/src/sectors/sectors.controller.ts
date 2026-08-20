import { Body, Controller, Delete, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { SectorsService } from './sectors.service';
import { CreateSectorDto } from './dto/create-sector.dto';
import { JwtGuard } from '../auth/guard/jwt.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('sectors')
@Controller('sectors')
@UseGuards(JwtGuard)
@ApiBearerAuth()
export class SectorsController {
  constructor(private sectorsService: SectorsService) {}

  @Get()
  @ApiOperation({ summary: '내 구역 목록' })
  @ApiResponse({ status: 200, description: '구역 목록' })
  findMine(@CurrentUser() user: { id: string }) {
    return this.sectorsService.findMine(user.id);
  }

  @Post()
  @ApiOperation({ summary: '구역 저장' })
  @ApiResponse({ status: 201, description: '저장 성공' })
  create(@CurrentUser() user: { id: string }, @Body() dto: CreateSectorDto) {
    return this.sectorsService.create(user.id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: '구역 삭제' })
  @ApiResponse({ status: 200, description: '삭제 성공' })
  @ApiResponse({ status: 404, description: '구역을 찾을 수 없음' })
  remove(@CurrentUser() user: { id: string }, @Param('id') id: string) {
    return this.sectorsService.remove(user.id, id);
  }
}
