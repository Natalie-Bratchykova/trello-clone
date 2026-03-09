import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCardInput, UpdateCardInput, MoveCardInput, CardFilterInput } from './card.input';

@Injectable()
export class CardService {
  constructor(private prisma: PrismaService) {}

  async createCard(data: CreateCardInput) {
    // Verify list exists
    const list = await this.prisma.list.findUnique({
      where: { id: data.listId },
      include: { board: true },
    });

    if (!list) {
      throw new NotFoundException(`List with ID ${data.listId} not found`);
    }

    // Verify user exists if userId is provided
    if (data.userId) {
      const user = await this.prisma.user.findUnique({
        where: { id: data.userId },
      });

      if (!user) {
        throw new NotFoundException(`User with ID ${data.userId} not found`);
      }
    }

    // Get the next position if not provided
    let position = data.position;
    if (position === undefined || position === null) {
      const lastCard = await this.prisma.card.findFirst({
        where: { listId: data.listId },
        orderBy: { position: 'desc' },
      });
      position = lastCard ? lastCard.position + 1 : 0;
    }

    return this.prisma.card.create({
      data: {
        title: data.title,
        description: data.description,
        position,
        dueDate: data.dueDate,
        listId: data.listId,
        userId: data.userId,
      },
      include: {
        list: {
          include: {
            board: true,
          },
        },
        user: true,
      },
    });
  }

  async getCardById(id: string) {
    const card = await this.prisma.card.findUnique({
      where: { id },
      include: {
        list: {
          include: {
            board: true,
          },
        },
        user: true,
      },
    });

    if (!card) {
      throw new NotFoundException(`Card with ID ${id} not found`);
    }

    return card;
  }

  async getCardsByListId(listId: string) {
    // Verify list exists
    const list = await this.prisma.list.findUnique({
      where: { id: listId },
    });

    if (!list) {
      throw new NotFoundException(`List with ID ${listId} not found`);
    }

    return this.prisma.card.findMany({
      where: { listId },
      include: {
        list: true,
        user: true,
      },
      orderBy: { position: 'asc' },
    });
  }

  async getCardsByUserId(userId: string) {
    // Verify user exists
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    return this.prisma.card.findMany({
      where: { userId },
      include: {
        list: {
          include: {
            board: true,
          },
        },
        user: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getAllCards(filter?: CardFilterInput) {
    const where: any = {};

    if (filter?.listId) {
      where.listId = filter.listId;
    }

    if (filter?.userId) {
      where.userId = filter.userId;
    }

    if (filter?.boardId) {
      where.list = {
        boardId: filter.boardId,
      };
    }

    if (filter?.search) {
      where.OR = [
        {
          title: {
            contains: filter.search,
            mode: 'insensitive',
          },
        },
        {
          description: {
            contains: filter.search,
            mode: 'insensitive',
          },
        },
      ];
    }

    if (filter?.overdue) {
      where.dueDate = {
        lt: new Date(),
      };
    }

    if (filter?.noDueDate) {
      where.dueDate = null;
    }

    return this.prisma.card.findMany({
      where,
      include: {
        list: {
          include: {
            board: true,
          },
        },
        user: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateCard(id: string, data: UpdateCardInput) {
    // Check if card exists
    await this.getCardById(id);

    // If listId is being changed, verify the new list exists
    if (data.listId) {
      const list = await this.prisma.list.findUnique({
        where: { id: data.listId },
      });

      if (!list) {
        throw new NotFoundException(`List with ID ${data.listId} not found`);
      }
    }

    // If userId is being changed, verify the user exists
    if (data.userId) {
      const user = await this.prisma.user.findUnique({
        where: { id: data.userId },
      });

      if (!user) {
        throw new NotFoundException(`User with ID ${data.userId} not found`);
      }
    }

    return this.prisma.card.update({
      where: { id },
      data,
      include: {
        list: {
          include: {
            board: true,
          },
        },
        user: true,
      },
    });
  }

  async deleteCard(id: string) {
    // Check if card exists
    await this.getCardById(id);

    return this.prisma.card.delete({
      where: { id },
    });
  }

  async moveCard(data: MoveCardInput) {
    const card = await this.getCardById(data.cardId);

    // Verify target list exists
    const targetList = await this.prisma.list.findUnique({
      where: { id: data.targetListId },
    });

    if (!targetList) {
      throw new NotFoundException(`Target list with ID ${data.targetListId} not found`);
    }

    const isSameList = card.listId === data.targetListId;

    // Move card to new position
    if (isSameList) {
      // Reorder within same list
      await this.reorderCardsInList(card.listId, card.position, data.position);
    } else {
      // Move to different list
      // Update positions in source list
      await this.prisma.card.updateMany({
        where: {
          listId: card.listId,
          position: { gt: card.position },
        },
        data: {
          position: { decrement: 1 },
        },
      });

      // Update positions in target list
      await this.prisma.card.updateMany({
        where: {
          listId: data.targetListId,
          position: { gte: data.position },
        },
        data: {
          position: { increment: 1 },
        },
      });
    }

    // Update the card
    return this.prisma.card.update({
      where: { id: data.cardId },
      data: {
        listId: data.targetListId,
        position: data.position,
      },
      include: {
        list: {
          include: {
            board: true,
          },
        },
        user: true,
      },
    });
  }

  private async reorderCardsInList(listId: string, fromPosition: number, toPosition: number) {
    if (fromPosition === toPosition) {
      return;
    }

    if (fromPosition < toPosition) {
      // Moving down
      await this.prisma.card.updateMany({
        where: {
          listId,
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
      // Moving up
      await this.prisma.card.updateMany({
        where: {
          listId,
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

  async duplicateCard(cardId: string, targetListId?: string) {
    const originalCard = await this.getCardById(cardId);

    const listId = targetListId || originalCard.listId;

    // Verify target list exists if provided
    if (targetListId) {
      const list = await this.prisma.list.findUnique({
        where: { id: targetListId },
      });

      if (!list) {
        throw new NotFoundException(`List with ID ${targetListId} not found`);
      }
    }

    // Get the next position in target list
    const lastCard = await this.prisma.card.findFirst({
      where: { listId },
      orderBy: { position: 'desc' },
    });

    const position = lastCard ? lastCard.position + 1 : 0;

    return this.prisma.card.create({
      data: {
        title: `${originalCard.title} (Copy)`,
        description: originalCard.description,
        position,
        dueDate: originalCard.dueDate,
        listId,
        userId: originalCard.userId,
      },
      include: {
        list: {
          include: {
            board: true,
          },
        },
        user: true,
      },
    });
  }

  async assignUser(cardId: string, userId: string | null) {
    // Verify card exists
    await this.getCardById(cardId);

    // Verify user exists if userId is provided
    if (userId) {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw new NotFoundException(`User with ID ${userId} not found`);
      }
    }

    return this.prisma.card.update({
      where: { id: cardId },
      data: { userId },
      include: {
        list: {
          include: {
            board: true,
          },
        },
        user: true,
      },
    });
  }

  async getOverdueCards(userId?: string) {
    const where: any = {
      dueDate: {
        lt: new Date(),
      },
    };

    if (userId) {
      where.userId = userId;
    }

    return this.prisma.card.findMany({
      where,
      include: {
        list: {
          include: {
            board: true,
          },
        },
        user: true,
      },
      orderBy: { dueDate: 'asc' },
    });
  }

  async getUpcomingCards(userId?: string, days: number = 7) {
    const now = new Date();
    const futureDate = new Date();
    futureDate.setDate(now.getDate() + days);

    const where: any = {
      dueDate: {
        gte: now,
        lte: futureDate,
      },
    };

    if (userId) {
      where.userId = userId;
    }

    return this.prisma.card.findMany({
      where,
      include: {
        list: {
          include: {
            board: true,
          },
        },
        user: true,
      },
      orderBy: { dueDate: 'asc' },
    });
  }

  async searchCards(query: string, boardId?: string, userId?: string) {
    const where: any = {
      OR: [
        {
          title: {
            contains: query,
            mode: 'insensitive',
          },
        },
        {
          description: {
            contains: query,
            mode: 'insensitive',
          },
        },
      ],
    };

    if (boardId) {
      where.list = {
        boardId,
      };
    }

    if (userId) {
      where.userId = userId;
    }

    return this.prisma.card.findMany({
      where,
      include: {
        list: {
          include: {
            board: true,
          },
        },
        user: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}

