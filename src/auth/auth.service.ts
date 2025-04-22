import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from 'src/users/users.service';
import { SignUpDto } from './dto/signup.dto';
import * as bcrypt from 'bcrypt';
import { User } from '../users/entities/user.entity';
import { excludePassword } from '../utils/exclude-password';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async signup(signUpDto: SignUpDto) {
    const hashedPass = await bcrypt.hash(signUpDto.password, 10);
    const data = { ...signUpDto, password: hashedPass };
    return await this.usersService.create(data);
  }

  async validateUser(username: string, password: string) {
    const user = await this.usersService.searchUserWithCredentials(username);

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      throw new UnauthorizedException('Неверный логин или пароль');
    }

    return excludePassword(user);
  }

  async login(user: User) {
    const payload = { sub: user.id, username: user.username };
    return {
      access_token: this.jwtService.sign(payload),
      user: excludePassword(user),
    };
  }
}
