import { Body, Controller, Get, Param, Patch } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { UserService } from 'src/user/user.service';
import { UpdateUserDto } from './dtos/update-user.dto';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  @Roles([UserRole.Admin])
  getUsers() {
    return this.userService.getUsers({
      orderBy: {
        name: 'asc',
      },
    });
  }

  @Patch(':id')
  @Roles([UserRole.Admin])
  updateUser(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.userService.updateUser({
      where: { id },
      data: updateUserDto,
    });
  }
}
