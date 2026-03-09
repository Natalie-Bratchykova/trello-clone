import { Resolver, Query, Mutation, Args, ID, ResolveField, Parent } from '@nestjs/graphql';
import { UserService } from './user.service';
import { UserObject } from './user.object';
import { CreateUserInput, UpdateUserInput, LoginUserInput } from './user.input';
import { BoardObject } from '../board/board.object';
import { CardObject } from '../card/card.object';
import { ImageService } from '../uploads/images/image.service';
import { GraphQLUpload, FileUpload } from 'graphql-upload-ts';

@Resolver(() => UserObject)
export class UserResolver {
  constructor(
    private userService: UserService,
    private imageService: ImageService,
  ) {}

  @Query(() => UserObject, { nullable: true })
  async user(@Args('id', { type: () => ID }) id: string) {
    return this.userService.getUserById(id);
  }

  @Query(() => UserObject, { nullable: true })
  async userByEmail(@Args('email') email: string) {
    return this.userService.getUserByEmail(email);
  }

  @Query(() => [UserObject])
  async users() {
    return this.userService.getAllUsers();
  }

  @Mutation(() => UserObject)
  async createUser(@Args('data') data: CreateUserInput) {
    return this.userService.createUser(data);
  }

  @Mutation(() => UserObject)
  async login(@Args('data') data: LoginUserInput) {
    return this.userService.validateUser(data);
  }

  @Mutation(() => UserObject)
  async updateUser(
    @Args('id', { type: () => ID }) id: string,
    @Args('data') data: UpdateUserInput,
  ) {
    return this.userService.updateUser(id, data);
  }

  @Mutation(() => UserObject)
  async uploadProfileImage(
    @Args('userId', { type: () => ID }) userId: string,
    @Args({ name: 'file', type: () => GraphQLUpload }) file: any,
  ) {
    const resolvedFile = await file;
    const imageUrl = await this.imageService.saveImage(resolvedFile);
    return this.userService.updateUser(userId, { profileImage: imageUrl });
  }

  @Mutation(() => Boolean)
  async deleteUser(@Args('id', { type: () => ID }) id: string) {
    await this.userService.deleteUser(id);
    return true;
  }

  @ResolveField(() => [BoardObject])
  async boards(@Parent() user: UserObject) {
    return this.userService.getUserBoards(user.id);
  }

  @ResolveField(() => [CardObject])
  async cards(@Parent() user: UserObject) {
    return this.userService.getUserCards(user.id);
  }
}

