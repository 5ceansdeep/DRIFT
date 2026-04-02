import { Controller, Get, Patch, Param, Body, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtGuard } from '../auth/guard/jwt.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('users')
@Controller('users')
@UseGuards(JwtGuard)
@ApiBearerAuth()
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get('me')
  @ApiOperation({ summary: '내 프로필 조회' })
  getMe(@CurrentUser() user: { id: string }) {
    return this.usersService.getMe(user.id);
  }

  @Patch('me')
  @ApiOperation({ summary: '내 프로필 수정 (username)' })
  updateMe(@CurrentUser() user: { id: string }, @Body() dto: UpdateUserDto) {
    return this.usersService.updateMe(user.id, dto);
  }

  @Get(':id')
  @ApiOperation({ summary: '다른 유저 프로필 조회' })
  getUser(@Param('id') id: string) {
    return this.usersService.getUserById(id);
  }

  @Get(':id/songs')
  @ApiOperation({ summary: '다른 유저 아카이브 조회' })
  getUserSongs(@Param('id') id: string) {
    return this.usersService.getUserSongs(id);
  }
}
