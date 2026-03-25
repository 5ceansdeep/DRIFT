import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class CreateSatelliteDto {
  @ApiProperty({ example: '노래 제목', description: '추천할 곡 제목' })
  @IsString()
  title: string;

  @ApiProperty({ example: '아티스트명', description: '추천할 곡 아티스트' })
  @IsString()
  artist: string;

  @ApiProperty({ example: 'https://...', description: '앨범 커버 URL', required: false })
  @IsOptional()
  @IsString()
  coverUrl?: string;

  @ApiProperty({ example: '이 노래 꼭 들어봐!', description: '추천 메시지', required: false })
  @IsOptional()
  @IsString()
  message?: string;
}
