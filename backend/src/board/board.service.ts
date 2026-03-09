import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBoardInput, UpdateBoardInput, BoardFilterInput } from './board.input';

@Injectable()
export class BoardService {
  constructor(private prisma: PrismaService) {}

  async createBoard(data: CreateBoardInput) {
    // Verify user exists
    const user = await this.prisma.user.findUnique({
      where: { id: data.userId },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${data.userId} not found`);
    }

    // Create board with default lists
    const board = await this.prisma.board.create({
      data: {
        title: data.title,
        color: data.color || '#0079bf',
        userId: data.userId,
      },
    });

    // Create default lists: Backlog, To Do, Review, Done
    const defaultLists = [
      { title: 'Backlog', position: 0 },
      { title: 'To Do', position: 1 },
      { title: 'Review', position: 2 },
      { title: 'Done', position: 3 },
    ];

    await Promise.all(
      defaultLists.map((list) =>
        this.prisma.list.create({
          data: {
            title: list.title,
            position: list.position,
            boardId: board.id,
          },
        })
      )
    );

    // Return board with all lists
    return this.prisma.board.findUnique({
      where: { id: board.id },
      include: {
        user: true,
        lists: {
          orderBy: { position: 'asc' },
          include: {
            cards: {
              orderBy: { position: 'asc' },
            },
          },
        },
      },
    });
  }

  async getBoardById(id: string) {
    const board = await this.prisma.board.findUnique({
      where: { id },
      include: {
        user: true,
        lists: {
          orderBy: { position: 'asc' },
          include: {
            cards: {
              orderBy: { position: 'asc' },
            },
          },
        },
      },
    });

    if (!board) {
      throw new NotFoundException(`Board with ID ${id} not found`);
    }

    return board;
  }

  async getBoardsByUserId(userId: string) {
    // Verify user exists
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    return this.prisma.board.findMany({
      where: { userId },
      include: {
        user: true,
        lists: {
          orderBy: { position: 'asc' },
          include: {
            cards: {
              orderBy: { position: 'asc' },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getAllBoards(filter?: BoardFilterInput) {
    const where: any = {};

    if (filter?.userId) {
      where.userId = filter.userId;
    }

    if (filter?.search) {
      where.title = {
        contains: filter.search,
        mode: 'insensitive',
      };
    }

    return this.prisma.board.findMany({
      where,
      include: {
        user: true,
        lists: {
          orderBy: { position: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateBoard(id: string, data: UpdateBoardInput) {
    // Check if board exists
    await this.getBoardById(id);

    return this.prisma.board.update({
      where: { id },
      data,
      include: {
        user: true,
        lists: {
          orderBy: { position: 'asc' },
          include: {
            cards: {
              orderBy: { position: 'asc' },
            },
          },
        },
      },
    });
  }

  async deleteBoard(id: string) {
    // Check if board exists
    await this.getBoardById(id);

    return this.prisma.board.delete({
      where: { id },
    });
  }

  async verifyBoardOwnership(boardId: string, userId: string): Promise<boolean> {
    const board = await this.getBoardById(boardId);

    if (board.userId !== userId) {
      throw new ForbiddenException('You do not have permission to access this board');
    }

    return true;
  }

  async getBoardLists(boardId: string) {
    const board = await this.getBoardById(boardId);

    return this.prisma.list.findMany({
      where: { boardId: board.id },
      include: {
        cards: {
          orderBy: { position: 'asc' },
        },
      },
      orderBy: { position: 'asc' },
    });
  }

  async getBoardStats(boardId: string) {
    const board = await this.getBoardById(boardId);

    const [listsCount, cardsCount, completedCards] = await Promise.all([
      this.prisma.list.count({
        where: { boardId: board.id },
      }),
      this.prisma.card.count({
        where: { list: { boardId: board.id } },
      }),
      this.prisma.card.count({
        where: {
          list: { boardId: board.id },
          dueDate: { lte: new Date() },
        },
      }),
    ]);

    return {
      boardId: board.id,
      listsCount,
      cardsCount,
      completedCards,
      activeCards: cardsCount - completedCards,
    };
  }

  async duplicateBoard(boardId: string, userId: string, newTitle?: string) {
    const originalBoard = await this.getBoardById(boardId);

    // Create new board with same properties
    const newBoard = await this.prisma.board.create({
      data: {
        title: newTitle || `${originalBoard.title} (Copy)`,
        color: originalBoard.color,
        userId,
      },
    });

    // Get all lists with cards from original board
    const lists = await this.prisma.list.findMany({
      where: { boardId: originalBoard.id },
      include: {
        cards: {
          orderBy: { position: 'asc' },
        },
      },
      orderBy: { position: 'asc' },
    });

    // Create lists and cards in new board
    for (const list of lists) {
      const newList = await this.prisma.list.create({
        data: {
          title: list.title,
          position: list.position,
          boardId: newBoard.id,
        },
      });

      for (const card of list.cards) {
        await this.prisma.card.create({
          data: {
            title: card.title,
            description: card.description,
            position: card.position,
            listId: newList.id,
            userId: card.userId,
          },
        });
      }
    }

    return this.getBoardById(newBoard.id);
  }
}

