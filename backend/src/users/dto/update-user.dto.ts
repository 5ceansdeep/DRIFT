import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, MinLength, MaxLength } from 'class-validator';

export class UpdateUserDto {
  @ApiProperty({ example: 'newusername', required: false })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(20)
  username?: string;
}
