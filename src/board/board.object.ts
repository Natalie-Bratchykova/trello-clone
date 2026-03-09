import { ObjectType, Field, ID, Int } from '@nestjs/graphql';
import { UserObject } from '../user/user.object';
import { ListObject } from '../list/list.object';

@ObjectType()
export class BoardObject {
  @Field(() => ID)
  id: string;

  @Field()
  title: string;

  @Field()
  color: string;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;

  @Field(() => ID)
  userId: string;

  @Field(() => UserObject, { nullable: true })
  user?: UserObject;

  @Field(() => [ListObject], { nullable: true })
  lists?: ListObject[];
}

@ObjectType()
export class BoardStatsObject {
  @Field(() => ID)
  boardId: string;

  @Field(() => Int)
  listsCount: number;

  @Field(() => Int)
  cardsCount: number;

  @Field(() => Int)
  completedCards: number;

  @Field(() => Int)
  activeCards: number;
}

