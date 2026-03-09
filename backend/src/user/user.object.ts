import { ObjectType, Field, ID } from '@nestjs/graphql';
import { BoardObject } from '../board/board.object';
import { CardObject } from '../card/card.object';

@ObjectType()
export class UserObject {
  @Field(() => ID)
  id: string;

  @Field()
  email: string;

  @Field({ nullable: true })
  name?: string;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;

  @Field({ nullable: true })
  profileImage?: string;

  @Field(() => [BoardObject], { nullable: true })
  boards?: BoardObject[];

  @Field(() => [CardObject], { nullable: true })
  cards?: CardObject[];
}

