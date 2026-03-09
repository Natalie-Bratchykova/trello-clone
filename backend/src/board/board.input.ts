import { InputType, Field, ID } from '@nestjs/graphql';
import { IsString, IsNotEmpty, IsOptional, IsHexColor, MinLength, MaxLength } from 'class-validator';

@InputType()
export class CreateBoardInput {
  @Field()
  @IsString()
  @IsNotEmpty({ message: 'Title is required' })
  @MinLength(1, { message: 'Title must be at least 1 character long' })
  @MaxLength(100, { message: 'Title must not exceed 100 characters' })
  title: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsHexColor({ message: 'Color must be a valid hex color code' })
  color?: string;

  @Field(() => ID)
  @IsString()
  @IsNotEmpty({ message: 'User ID is required' })
  userId: string;
}

@InputType()
export class UpdateBoardInput {
  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MinLength(1, { message: 'Title must be at least 1 character long' })
  @MaxLength(100, { message: 'Title must not exceed 100 characters' })
  title?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsHexColor({ message: 'Color must be a valid hex color code' })
  color?: string;
}

@InputType()
export class BoardFilterInput {
  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  userId?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  search?: string;
}

