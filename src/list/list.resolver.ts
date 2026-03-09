import { Resolver, Query, Mutation, Args, ID, ResolveField, Parent } from '@nestjs/graphql';
import { ListService } from './list.service';
import { ListObject, ListStatsObject } from './list.object';
import { CreateListInput, UpdateListInput, MoveListInput, ListFilterInput } from './list.input';
import { BoardObject } from '../board/board.object';
import { CardObject } from '../card/card.object';

@Resolver(() => ListObject)
export class ListResolver {
  constructor(private listService: ListService) {}

  @Query(() => ListObject, { nullable: true })
  async list(@Args('id', { type: () => ID }) id: string) {
    return this.listService.getListById(id);
  }

  @Query(() => [ListObject])
  async lists(@Args('filter', { nullable: true }) filter?: ListFilterInput) {
    return this.listService.getAllLists(filter);
  }

  @Query(() => [ListObject])
  async boardLists(@Args('boardId', { type: () => ID }) boardId: string) {
    return this.listService.getListsByBoardId(boardId);
  }

  @Query(() => ListStatsObject)
  async listStats(@Args('listId', { type: () => ID }) listId: string) {
    return this.listService.getListStats(listId);
  }

  @Mutation(() => ListObject)
  async createList(@Args('data') data: CreateListInput) {
    return this.listService.createList(data);
  }

  @Mutation(() => ListObject)
  async updateList(
    @Args('id', { type: () => ID }) id: string,
    @Args('data') data: UpdateListInput,
  ) {
    return this.listService.updateList(id, data);
  }

  @Mutation(() => Boolean)
  async deleteList(@Args('id', { type: () => ID }) id: string) {
    await this.listService.deleteList(id);
    return true;
  }

  @Mutation(() => ListObject)
  async moveList(@Args('data') data: MoveListInput) {
    return this.listService.moveList(data);
  }

  @Mutation(() => ListObject)
  async duplicateList(
    @Args('listId', { type: () => ID }) listId: string,
    @Args('newTitle', { nullable: true }) newTitle?: string,
  ) {
    return this.listService.duplicateList(listId, newTitle);
  }

  @Mutation(() => ListObject)
  async archiveList(@Args('listId', { type: () => ID }) listId: string) {
    return this.listService.archiveList(listId);
  }

  @Mutation(() => ListObject)
  async clearAllCards(@Args('listId', { type: () => ID }) listId: string) {
    return this.listService.clearAllCards(listId);
  }

  @Mutation(() => ListObject)
  async moveAllCards(
    @Args('sourceListId', { type: () => ID }) sourceListId: string,
    @Args('targetListId', { type: () => ID }) targetListId: string,
  ) {
    return this.listService.moveAllCards(sourceListId, targetListId);
  }

  @ResolveField(() => BoardObject)
  async board(@Parent() list: ListObject) {
    // If board is already loaded, return it
    if (list.board) {
      return list.board;
    }
    // Otherwise fetch it
    const fullList = await this.listService.getListById(list.id);
    return fullList.board;
  }

  @ResolveField(() => [CardObject])
  async cards(@Parent() list: ListObject) {
    return this.listService.getListCards(list.id);
  }
}

