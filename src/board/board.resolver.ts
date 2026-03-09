import { Resolver, Query, Mutation, Args, ID, ResolveField, Parent } from '@nestjs/graphql';
import { BoardService } from './board.service';
import { BoardObject, BoardStatsObject } from './board.object';
import { CreateBoardInput, UpdateBoardInput, BoardFilterInput } from './board.input';
import { UserObject } from '../user/user.object';
import { ListObject } from '../list/list.object';

@Resolver(() => BoardObject)
export class BoardResolver {
  constructor(private boardService: BoardService) {}

  @Query(() => BoardObject, { nullable: true })
  async board(@Args('id', { type: () => ID }) id: string) {
    return this.boardService.getBoardById(id);
  }

  @Query(() => [BoardObject])
  async boards(@Args('filter', { nullable: true }) filter?: BoardFilterInput) {
    return this.boardService.getAllBoards(filter);
  }

  @Query(() => [BoardObject])
  async userBoards(@Args('userId', { type: () => ID }) userId: string) {
    return this.boardService.getBoardsByUserId(userId);
  }

  @Query(() => BoardStatsObject)
  async boardStats(@Args('boardId', { type: () => ID }) boardId: string) {
    return this.boardService.getBoardStats(boardId);
  }

  @Mutation(() => BoardObject)
  async createBoard(@Args('data') data: CreateBoardInput) {
    return this.boardService.createBoard(data);
  }

  @Mutation(() => BoardObject)
  async updateBoard(
    @Args('id', { type: () => ID }) id: string,
    @Args('data') data: UpdateBoardInput,
  ) {
    return this.boardService.updateBoard(id, data);
  }

  @Mutation(() => Boolean)
  async deleteBoard(@Args('id', { type: () => ID }) id: string) {
    await this.boardService.deleteBoard(id);
    return true;
  }

  @Mutation(() => BoardObject)
  async duplicateBoard(
    @Args('boardId', { type: () => ID }) boardId: string,
    @Args('userId', { type: () => ID }) userId: string,
    @Args('newTitle', { nullable: true }) newTitle?: string,
  ) {
    return this.boardService.duplicateBoard(boardId, userId, newTitle);
  }

  @ResolveField(() => UserObject)
  async user(@Parent() board: BoardObject) {
    // If user is already loaded, return it
    if (board.user) {
      return board.user;
    }
    // Otherwise fetch it (this shouldn't happen in practice due to includes)
    const fullBoard = await this.boardService.getBoardById(board.id);
    return fullBoard.user;
  }

  @ResolveField(() => [ListObject])
  async lists(@Parent() board: BoardObject) {
    return this.boardService.getBoardLists(board.id);
  }
}

