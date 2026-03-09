import { ObjectType, Field, ID, Int } from '@nestjs/graphql';
import { UserObject } from '../user/user.object';
import { ListObject } from '../list/list.object';

@ObjectType()
export class CardObject {
  @Field(() => ID)
  id: string;

  @Field()
  title: string;

  @Field({ nullable: true })
  description?: string;

  @Field(() => Int)
  position: number;

  @Field({ nullable: true })
  dueDate?: Date;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;

  @Field(() => ID)
  listId: string;

  @Field(() => ListObject)
  list?: ListObject;

  @Field(() => ID, { nullable: true })
  userId?: string;

  @Field(() => UserObject, { nullable: true })
  user?: UserObject;
}


