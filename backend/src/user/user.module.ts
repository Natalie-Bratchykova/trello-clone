import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserResolver } from './user.resolver';
import { PrismaModule } from '../prisma/prisma.module';
import { ImageService } from '../uploads/images/image.service';

@Module({
  imports: [PrismaModule],
  providers: [UserService, UserResolver, ImageService],
  exports: [UserService],
})
export class UserModule {}


