import { Resolver, Query, Mutation, Args, ID, ResolveField, Parent, Int } from '@nestjs/graphql';
import { CardService } from './card.service';
import { CardObject } from './card.object';
import { CreateCardInput, UpdateCardInput, MoveCardInput, CardFilterInput } from './card.input';
import { UserObject } from '../user/user.object';
import { ListObject } from '../list/list.object';

@Resolver(() => CardObject)
export class CardResolver {
  constructor(private cardService: CardService) {}

  @Query(() => CardObject, { nullable: true })
  async card(@Args('id', { type: () => ID }) id: string) {
    return this.cardService.getCardById(id);
  }

  @Query(() => [CardObject])
  async cards(@Args('filter', { nullable: true }) filter?: CardFilterInput) {
    return this.cardService.getAllCards(filter);
  }

  @Query(() => [CardObject])
  async listCards(@Args('listId', { type: () => ID }) listId: string) {
    return this.cardService.getCardsByListId(listId);
  }

  @Query(() => [CardObject])
  async userCards(@Args('userId', { type: () => ID }) userId: string) {
    return this.cardService.getCardsByUserId(userId);
  }

  @Query(() => [CardObject])
  async overdueCards(@Args('userId', { type: () => ID, nullable: true }) userId?: string) {
    return this.cardService.getOverdueCards(userId);
  }

  @Query(() => [CardObject])
  async upcomingCards(
    @Args('userId', { type: () => ID, nullable: true }) userId?: string,
    @Args('days', { type: () => Int, nullable: true, defaultValue: 7 }) days?: number,
  ) {
    return this.cardService.getUpcomingCards(userId, days);
  }

  @Query(() => [CardObject])
  async searchCards(
    @Args('query') query: string,
    @Args('boardId', { type: () => ID, nullable: true }) boardId?: string,
    @Args('userId', { type: () => ID, nullable: true }) userId?: string,
  ) {
    return this.cardService.searchCards(query, boardId, userId);
  }

  @Mutation(() => CardObject)
  async createCard(@Args('data') data: CreateCardInput) {
    return this.cardService.createCard(data);
  }

  @Mutation(() => CardObject)
  async updateCard(
    @Args('id', { type: () => ID }) id: string,
    @Args('data') data: UpdateCardInput,
  ) {
    return this.cardService.updateCard(id, data);
  }

  @Mutation(() => Boolean)
  async deleteCard(@Args('id', { type: () => ID }) id: string) {
    await this.cardService.deleteCard(id);
    return true;
  }

  @Mutation(() => CardObject)
  async moveCard(@Args('data') data: MoveCardInput) {
    return this.cardService.moveCard(data);
  }

  @Mutation(() => CardObject)
  async duplicateCard(
    @Args('cardId', { type: () => ID }) cardId: string,
    @Args('targetListId', { type: () => ID, nullable: true }) targetListId?: string,
  ) {
    return this.cardService.duplicateCard(cardId, targetListId);
  }

  @Mutation(() => CardObject)
  async assignUser(
    @Args('cardId', { type: () => ID }) cardId: string,
    @Args('userId', { type: () => ID, nullable: true }) userId?: string,
  ) {
    return this.cardService.assignUser(cardId, userId ?? null);
  }

  @ResolveField(() => ListObject)
  async list(@Parent() card: CardObject) {
    // If list is already loaded, return it
    if (card.list) {
      return card.list;
    }
    // Otherwise fetch it (this shouldn't happen in practice due to includes)
    const fullCard = await this.cardService.getCardById(card.id);
    return fullCard.list;
  }

  @ResolveField(() => UserObject, { nullable: true })
  async user(@Parent() card: CardObject) {
    // If no userId, return null
    if (!card.userId) {
      return null;
    }
    // If user is already loaded, return it
    if (card.user) {
      return card.user;
    }
    // Otherwise fetch it
    const fullCard = await this.cardService.getCardById(card.id);
    return fullCard.user;
  }
}

