import { Body, Controller, Delete, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { SongsService } from './songs.service';
import { JwtGuard } from '../auth/guard/jwt.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ArchiveSongDto } from './dto/archive-song.dto';

@ApiTags('songs')
@Controller('songs')
export class SongsController {
  constructor(private songsService: SongsService) {}

  @Get('search')
  @ApiOperation({ summary: '곡 검색 (iTunes)' })
  @ApiQuery({ name: 'q', example: '아이유', description: '검색어' })
  @ApiResponse({ status: 200, description: '검색 결과 (미리듣기 URL 포함)' })
  search(@Query('q') query: string) {
    return this.songsService.search(query);
  }

  @Post('archive')
  @UseGuards(JwtGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '곡을 내 아카이브에 저장' })
  @ApiResponse({ status: 201, description: '저장 성공' })
  @ApiResponse({ status: 401, description: '인증 필요' })
  archive(@CurrentUser() user: any, @Body() dto: ArchiveSongDto) {
    return this.songsService.archive(user.sub, dto);
  }

  @Get('my')
  @UseGuards(JwtGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '내 아카이브 곡 목록' })
  @ApiResponse({ status: 200, description: '저장한 곡 목록' })
  getMySongs(@CurrentUser() user: any) {
    return this.songsService.getMySongs(user.sub);
  }

  @Delete('my/:id')
  @UseGuards(JwtGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '아카이브에서 곡 삭제' })
  @ApiResponse({ status: 200, description: '삭제 성공' })
  @ApiResponse({ status: 404, description: '곡을 찾을 수 없음' })
  remove(@CurrentUser() user: any, @Param('id') id: string) {
    return this.songsService.removeFromArchive(user.sub, id);
  }
}
