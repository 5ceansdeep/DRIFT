import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class SearchSongDto {
  @ApiProperty({ example: '아이유', description: '검색어 (곡 제목 또는 아티스트)' })
  @IsString()
  @MinLength(1)
  q: string;
}
