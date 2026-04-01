import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsArray } from 'class-validator';

export class ArchiveSongDto {
  @ApiProperty({ example: 'Blueming' })
  @IsString()
  title: string;

  @ApiProperty({ example: '아이유' })
  @IsString()
  artist: string;

  @ApiProperty({ example: 'https://is1-ssl.mzstatic.com/...', required: false })
  @IsOptional()
  @IsString()
  coverUrl?: string;

  @ApiProperty({ example: 'https://audio-ssl.itunes.apple.com/...', required: false })
  @IsOptional()
  @IsString()
  previewUrl?: string;

  @ApiProperty({ example: 'search', description: '곡 발견 경로 (search, recommend, comet)' })
  @IsString()
  source: string;

}
