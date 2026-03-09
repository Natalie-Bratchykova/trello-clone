import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateListInput, UpdateListInput, MoveListInput, ListFilterInput } from './list.input';

@Injectable()
export class ListService {
  constructor(private prisma: PrismaService) {}

  async createList(data: CreateListInput) {
    // Verify board exists
    const board = await this.prisma.board.findUnique({
      where: { id: data.boardId },
    });

    if (!board) {
      throw new NotFoundException(`Board with ID ${data.boardId} not found`);
    }

    // Get the next position if not provided
    let position = data.position;
    if (position === undefined || position === null) {
      const lastList = await this.prisma.list.findFirst({
        where: { boardId: data.boardId },
        orderBy: { position: 'desc' },
      });
      position = lastList ? lastList.position + 1 : 0;
    }

    return this.prisma.list.create({
      data: {
        title: data.title,
        position,
        boardId: data.boardId,
      },
      include: {
        board: true,
        cards: {
          orderBy: { position: 'asc' },
        },
      },
    });
  }

  async getListById(id: string) {
    const list = await this.prisma.list.findUnique({
      where: { id },
      include: {
        board: true,
        cards: {
          orderBy: { position: 'asc' },
          include: {
            user: true,
          },
        },
      },
    });

    if (!list) {
      throw new NotFoundException(`List with ID ${id} not found`);
    }

    return list;
  }

  async getListsByBoardId(boardId: string) {
    // Verify board exists
    const board = await this.prisma.board.findUnique({
      where: { id: boardId },
    });

    if (!board) {
      throw new NotFoundException(`Board with ID ${boardId} not found`);
    }

    return this.prisma.list.findMany({
      where: { boardId },
      include: {
        board: true,
        cards: {
          orderBy: { position: 'asc' },
          include: {
            user: true,
          },
        },
      },
      orderBy: { position: 'asc' },
    });
  }

  async getAllLists(filter?: ListFilterInput) {
    const where: any = {};

    if (filter?.boardId) {
      where.boardId = filter.boardId;
    }

    if (filter?.search) {
      where.title = {
        contains: filter.search,
        mode: 'insensitive',
      };
    }

    return this.prisma.list.findMany({
      where,
      include: {
        board: true,
        cards: {
          orderBy: { position: 'asc' },
        },
      },
      orderBy: { position: 'asc' },
    });
  }

  async updateList(id: string, data: UpdateListInput) {
    // Check if list exists
    await this.getListById(id);

    return this.prisma.list.update({
      where: { id },
      data,
      include: {
        board: true,
        cards: {
          orderBy: { position: 'asc' },
        },
      },
    });
  }

  async deleteList(id: string) {
    // Check if list exists
    const list = await this.getListById(id);

    // Delete the list (cards will be cascade deleted)
    await this.prisma.list.delete({
      where: { id },
    });

    // Update positions of remaining lists
    await this.prisma.list.updateMany({
      where: {
        boardId: list.boardId,
        position: { gt: list.position },
      },
      data: {
        position: { decrement: 1 },
      },
    });

    return list;
  }

  async moveList(data: MoveListInput) {
    const list = await this.getListById(data.listId);

    await this.reorderListsInBoard(list.boardId, list.position, data.position);

    return this.prisma.list.update({
      where: { id: data.listId },
      data: { position: data.position },
      include: {
        board: true,
        cards: {
          orderBy: { position: 'asc' },
        },
      },
    });
  }

  private async reorderListsInBoard(boardId: string, fromPosition: number, toPosition: number) {
    if (fromPosition === toPosition) {
      return;
    }

    if (fromPosition < toPosition) {
      // Moving right
      await this.prisma.list.updateMany({
        where: {
          boardId,
          position: {
            gt: fromPosition,
            lte: toPosition,
          },
        },
        data: {
          position: { decrement: 1 },
        },
      });
    } else {
      // Moving left
      await this.prisma.list.updateMany({
        where: {
          boardId,
          position: {
            gte: toPosition,
            lt: fromPosition,
          },
        },
        data: {
          position: { increment: 1 },
        },
      });
    }
  }

  async duplicateList(listId: string, newTitle?: string) {
    const originalList = await this.getListById(listId);

    // Get the next position in the board
    const lastList = await this.prisma.list.findFirst({
      where: { boardId: originalList.boardId },
      orderBy: { position: 'desc' },
    });

    const position = lastList ? lastList.position + 1 : 0;

    // Create new list
    const newList = await this.prisma.list.create({
      data: {
        title: newTitle || `${originalList.title} (Copy)`,
        position,
        boardId: originalList.boardId,
      },
    });

    // Copy all cards
    const cards = await this.prisma.card.findMany({
      where: { listId: originalList.id },
      orderBy: { position: 'asc' },
    });

    for (const card of cards) {
      await this.prisma.card.create({
        data: {
          title: card.title,
          description: card.description,
          position: card.position,
          dueDate: card.dueDate,
          listId: newList.id,
          userId: card.userId,
        },
      });
    }

    return this.getListById(newList.id);
  }

  async archiveList(listId: string) {
    // For now, archiving is the same as deleting
    // In the future, you might add an 'archived' field to the schema
    return this.deleteList(listId);
  }

  async getListCards(listId: string) {
    const list = await this.getListById(listId);

    return this.prisma.card.findMany({
      where: { listId: list.id },
      include: {
        user: true,
      },
      orderBy: { position: 'asc' },
    });
  }

  async getListStats(listId: string) {
    const list = await this.getListById(listId);

    const [totalCards, cardsWithDueDate, overdueCards] = await Promise.all([
      this.prisma.card.count({
        where: { listId: list.id },
      }),
      this.prisma.card.count({
        where: {
          listId: list.id,
          dueDate: { not: null },
        },
      }),
      this.prisma.card.count({
        where: {
          listId: list.id,
          dueDate: { lt: new Date() },
        },
      }),
    ]);

    return {
      listId: list.id,
      totalCards,
      cardsWithDueDate,
      overdueCards,
      cardsWithoutDueDate: totalCards - cardsWithDueDate,
    };
  }

  async clearAllCards(listId: string) {
    const list = await this.getListById(listId);

    await this.prisma.card.deleteMany({
      where: { listId: list.id },
    });

    return list;
  }

  async moveAllCards(sourceListId: string, targetListId: string) {
    const sourceList = await this.getListById(sourceListId);
    const targetList = await this.getListById(targetListId);

    // Get all cards from source list
    const cards = await this.prisma.card.findMany({
      where: { listId: sourceList.id },
      orderBy: { position: 'asc' },
    });

    // Get the next position in target list
    const lastCard = await this.prisma.card.findFirst({
      where: { listId: targetList.id },
      orderBy: { position: 'desc' },
    });

    let nextPosition = lastCard ? lastCard.position + 1 : 0;

    // Move all cards to target list
    for (const card of cards) {
      await this.prisma.card.update({
        where: { id: card.id },
        data: {
          listId: targetList.id,
          position: nextPosition++,
        },
      });
    }

    return this.getListById(targetListId);
  }
}

