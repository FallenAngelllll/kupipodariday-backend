import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import { User } from './entities/user.entity';
import { UpdateUserDto } from './dto/update-user.dto';
import { excludePassword } from '../utils/exclude-password';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async create(userData: Partial<User>) {
    const user = this.usersRepository.create(userData);
    const saved = await this.usersRepository.save(user);
    return excludePassword(saved);
  }

  async searchUserWithCredentials(username: string) {
    const user = await this.usersRepository.findOne({
      where: { username },
      relations: ['wishes'],
      select: {
        id: true,
        username: true,
        email: true,
        about: true,
        avatar: true,
        createdAt: true,
        updatedAt: true,
        password: true,
      },
    });

    if (!user) throw new NotFoundException('Пользователь не найден');
    return user;
  }

  async searchUserByName(username: string) {
    const user = await this.usersRepository.findOne({
      where: { username },
      relations: ['wishes'],
      select: {
        id: true,
        username: true,
        email: true,
        about: true,
        avatar: true,
        createdAt: true,
        updatedAt: true,
        password: true,
      },
    });

    if (!user) throw new NotFoundException('Пользователь не найден');
    return excludePassword(user);
  }

  async updateUser(id: number, dto: UpdateUserDto) {
    await this.usersRepository.update(id, dto);
    return this.getItemById(id);
  }

  async getItemById(id: number) {
    const user = await this.usersRepository.findOne({
      where: { id },
      relations: ['wishes'],
    });

    if (!user) throw new NotFoundException('Пользователь не найден');
    return excludePassword(user);
  }

  async getMultipleItems(query: string) {
    const users = await this.usersRepository.find({
      where: [
        { username: ILike(`%${query}%`) },
        { email: ILike(`%${query}%`) },
      ],
      relations: ['wishes'],
    });

    return users.map((user) => excludePassword(user));
  }
}
