import { Controller, Get, Patch, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
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

  @Patch('me/password')
  @ApiOperation({ summary: '비밀번호 변경' })
  changePassword(@CurrentUser() user: { id: string }, @Body() dto: ChangePasswordDto) {
    return this.usersService.changePassword(user.id, dto);
  }

  @Delete('me')
  @ApiOperation({ summary: '회원 탈퇴' })
  deleteMe(@CurrentUser() user: { id: string }) {
    return this.usersService.deleteMe(user.id);
  }

  @Get(':username')
  @ApiOperation({ summary: '다른 유저 프로필 조회' })
  getUser(@Param('username') username: string) {
    return this.usersService.getUserById(username);
  }

  @Get(':username/songs')
  @ApiOperation({ summary: '다른 유저 아카이브 조회' })
  getUserSongs(@Param('username') username: string) {
    return this.usersService.getUserSongs(username);
  }
}
