import { Module } from '@nestjs/common';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { GraphQLModule } from '@nestjs/graphql';
import { join } from 'path';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserModule } from './user/user.module';
import { BoardModule } from './board/board.module';
import { ListModule } from './list/list.module';
import { CardModule } from './card/card.module';
import { PrismaModule } from './prisma/prisma.module';
import { ImageResolver } from './uploads/images/image.resolver';
import { ImageService } from './uploads/images/image.service';
import {RoleModule} from "./roles/role.module";

@Module({
  imports: [
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
      sortSchema: true
    }),
    PrismaModule,
    UserModule,
    BoardModule,
    ListModule,
    CardModule,
    RoleModule
  ],
  controllers: [AppController],
  providers: [AppService, ImageResolver, ImageService],
})
export class AppModule {}
