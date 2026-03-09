import { InputType, Field, ID, Int } from '@nestjs/graphql';
import { IsString, IsNotEmpty, IsOptional, MinLength, MaxLength, IsInt, Min, IsDate } from 'class-validator';
import { Type } from 'class-transformer';

@InputType()
export class CreateCardInput {
  @Field()
  @IsString()
  @IsNotEmpty({ message: 'Title is required' })
  @MinLength(1, { message: 'Title must be at least 1 character long' })
  @MaxLength(200, { message: 'Title must not exceed 200 characters' })
  title: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(5000, { message: 'Description must not exceed 5000 characters' })
  description?: string;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt()
  @Min(0, { message: 'Position must be a non-negative integer' })
  position?: number;

  @Field({ nullable: true })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  dueDate?: Date;

  @Field(() => ID)
  @IsString()
  @IsNotEmpty({ message: 'List ID is required' })
  listId: string;

  @Field(() => ID, { nullable: true })
  @IsOptional()
  @IsString()
  userId?: string;
}

@InputType()
export class UpdateCardInput {
  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MinLength(1, { message: 'Title must be at least 1 character long' })
  @MaxLength(200, { message: 'Title must not exceed 200 characters' })
  title?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(5000, { message: 'Description must not exceed 5000 characters' })
  description?: string;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt()
  @Min(0, { message: 'Position must be a non-negative integer' })
  position?: number;

  @Field({ nullable: true })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  dueDate?: Date;

  @Field(() => ID, { nullable: true })
  @IsOptional()
  @IsString()
  userId?: string;

  @Field(() => ID, { nullable: true })
  @IsOptional()
  @IsString()
  listId?: string;
}

@InputType()
export class MoveCardInput {
  @Field(() => ID)
  @IsString()
  @IsNotEmpty({ message: 'Card ID is required' })
  cardId: string;

  @Field(() => ID)
  @IsString()
  @IsNotEmpty({ message: 'Target list ID is required' })
  targetListId: string;

  @Field(() => Int)
  @IsInt()
  @Min(0, { message: 'Position must be a non-negative integer' })
  position: number;
}

@InputType()
export class CardFilterInput {
  @Field(() => ID, { nullable: true })
  @IsOptional()
  @IsString()
  listId?: string;

  @Field(() => ID, { nullable: true })
  @IsOptional()
  @IsString()
  userId?: string;

  @Field(() => ID, { nullable: true })
  @IsOptional()
  @IsString()
  boardId?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  search?: string;

  @Field({ nullable: true })
  @IsOptional()
  overdue?: boolean;

  @Field({ nullable: true })
  @IsOptional()
  noDueDate?: boolean;
}

