import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Wishlist } from './entities/wishlist.entity';
import { CreateWishlistDto } from './dto/create-wishlist.dto';
import { UpdateWishlistDto } from './dto/update-wishlist.dto';
import { User } from 'src/users/entities/user.entity';
import { Wish } from 'src/wishes/entities/wish.entity';
import { excludePassword } from '../utils/exclude-password';

@Injectable()
export class WishlistsService {
  constructor(
    @InjectRepository(Wishlist)
    private readonly wishlistRepo: Repository<Wishlist>,
    @InjectRepository(Wish)
    private readonly wishRepo: Repository<Wish>,
  ) {}

  async create(dto: CreateWishlistDto, owner: User) {
    const wishes = await this.wishRepo.findBy({ id: In(dto.itemsId) });
    const wishlist = this.wishlistRepo.create({
      items: wishes,
      owner,
      ...dto,
    });
    return this.wishlistRepo.save(wishlist);
  }

  async findAll() {
    const wishlists = await this.wishlistRepo.find({
      relations: ['owner', 'items'],
    });

    return wishlists.map((wishlist) => ({
      owner: excludePassword(wishlist.owner) as User,
      ...wishlist,
    }));
  }

  async find(id: number) {
    const wishlist = await this.wishlistRepo.findOne({
      where: { id },
      relations: ['owner', 'items', 'items.owner'],
    });

    if (!wishlist) throw new NotFoundException('Подборка не найдена');

    wishlist.owner = excludePassword(wishlist.owner) as User;

    wishlist.items = wishlist.items.map((item) => ({
      owner: excludePassword(item.owner) as User,
      ...item,
    }));

    return wishlist;
  }

  async update(id: number, dto: UpdateWishlistDto, user: User) {
    const wishlist = await this.wishlistRepo.findOne({
      where: { id },
      relations: ['owner', 'items'],
    });

    if (!wishlist) throw new NotFoundException('Подборка не найдена');
    if (wishlist.owner.id !== user.id)
      throw new ForbiddenException('Нельзя редактировать чужую подборку');

    if (dto.itemsId) {
      wishlist.items = await this.wishRepo.findBy({ id: In(dto.itemsId) });
    }

    Object.assign(wishlist, dto);
    const saved = await this.wishlistRepo.save(wishlist);
    saved.owner = excludePassword(saved.owner) as User;
    saved.items = saved.items.map((item) => ({
      ...item,
      owner: excludePassword(item.owner) as User,
    }));
    return saved;
  }

  async remove(id: number, user: User) {
    const wishlist = await this.wishlistRepo.findOne({
      where: { id },
      relations: ['owner'],
    });
    if (!wishlist) throw new NotFoundException('Подборка не найдена');
    if (wishlist.owner.id !== user.id)
      throw new ForbiddenException('Нельзя удалить чужую подборку');

    return this.wishlistRepo.delete(id);
  }
}
