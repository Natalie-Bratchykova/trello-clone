import { InputType, Field, ID, Int } from '@nestjs/graphql';
import { IsString, IsNotEmpty, IsOptional, MinLength, MaxLength, IsInt, Min } from 'class-validator';

@InputType()
export class CreateListInput {
  @Field()
  @IsString()
  @IsNotEmpty({ message: 'Title is required' })
  @MinLength(1, { message: 'Title must be at least 1 character long' })
  @MaxLength(100, { message: 'Title must not exceed 100 characters' })
  title: string;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt()
  @Min(0, { message: 'Position must be a non-negative integer' })
  position?: number;

  @Field(() => ID)
  @IsString()
  @IsNotEmpty({ message: 'Board ID is required' })
  boardId: string;
}

@InputType()
export class UpdateListInput {
  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MinLength(1, { message: 'Title must be at least 1 character long' })
  @MaxLength(100, { message: 'Title must not exceed 100 characters' })
  title?: string;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt()
  @Min(0, { message: 'Position must be a non-negative integer' })
  position?: number;
}

@InputType()
export class MoveListInput {
  @Field(() => ID)
  @IsString()
  @IsNotEmpty({ message: 'List ID is required' })
  listId: string;

  @Field(() => Int)
  @IsInt()
  @Min(0, { message: 'Position must be a non-negative integer' })
  position: number;
}

@InputType()
export class ListFilterInput {
  @Field(() => ID, { nullable: true })
  @IsOptional()
  @IsString()
  boardId?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  search?: string;
}

