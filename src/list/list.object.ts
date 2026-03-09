import { ObjectType, Field, ID, Int } from '@nestjs/graphql';
import { BoardObject } from '../board/board.object';
import { CardObject } from '../card/card.object';

@ObjectType()
export class ListObject {
  @Field(() => ID)
  id: string;

  @Field()
  title: string;

  @Field(() => Int)
  position: number;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;

  @Field(() => ID)
  boardId: string;

  @Field(() => BoardObject, { nullable: true })
  board?: BoardObject;

  @Field(() => [CardObject], { nullable: true })
  cards?: CardObject[];
}

@ObjectType()
export class ListStatsObject {
  @Field(() => ID)
  listId: string;

  @Field(() => Int)
  totalCards: number;

  @Field(() => Int)
  cardsWithDueDate: number;

  @Field(() => Int)
  overdueCards: number;

  @Field(() => Int)
  cardsWithoutDueDate: number;
}

