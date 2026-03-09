import { Test, TestingModule } from '@nestjs/testing';
import { ListService } from './list.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';

describe('ListService', () => {
  let service: ListService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    board: {
      findUnique: jest.fn(),
    },
    list: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      delete: jest.fn(),
    },
    card: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      deleteMany: jest.fn(),
      count: jest.fn(),
    },
  };

  const mockBoard = {
    id: 'board-1',
    title: 'Test Board',
    userId: 'user-1',
  };

  const mockList = {
    id: 'list-1',
    title: 'To Do',
    position: 0,
    boardId: 'board-1',
    createdAt: new Date(),
    updatedAt: new Date(),
    board: mockBoard,
    cards: [],
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ListService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<ListService>(ListService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createList', () => {
    it('should create a new list', async () => {
      const createInput = {
        title: 'New List',
        boardId: 'board-1',
      };

      mockPrismaService.board.findUnique.mockResolvedValue(mockBoard);
      mockPrismaService.list.findFirst.mockResolvedValue(null);
      mockPrismaService.list.create.mockResolvedValue(mockList);

      const result = await service.createList(createInput);

      expect(result).toEqual(mockList);
      expect(mockPrismaService.board.findUnique).toHaveBeenCalledWith({
        where: { id: 'board-1' },
      });
      expect(mockPrismaService.list.create).toHaveBeenCalled();
    });

    it('should throw NotFoundException if board does not exist', async () => {
      const createInput = {
        title: 'New List',
        boardId: 'non-existent-board',
      };

      mockPrismaService.board.findUnique.mockResolvedValue(null);

      await expect(service.createList(createInput)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should auto-calculate position if not provided', async () => {
      const createInput = {
        title: 'New List',
        boardId: 'board-1',
      };

      const lastList = { ...mockList, position: 3 };

      mockPrismaService.board.findUnique.mockResolvedValue(mockBoard);
      mockPrismaService.list.findFirst.mockResolvedValue(lastList);
      mockPrismaService.list.create.mockResolvedValue({
        ...mockList,
        position: 4,
      });

      await service.createList(createInput);

      expect(mockPrismaService.list.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            position: 4,
          }),
        }),
      );
    });
  });

  describe('getListById', () => {
    it('should return a list by id', async () => {
      mockPrismaService.list.findUnique.mockResolvedValue(mockList);

      const result = await service.getListById('list-1');

      expect(result).toEqual(mockList);
      expect(mockPrismaService.list.findUnique).toHaveBeenCalledWith({
        where: { id: 'list-1' },
        include: expect.any(Object),
      });
    });

    it('should throw NotFoundException if list not found', async () => {
      mockPrismaService.list.findUnique.mockResolvedValue(null);

      await expect(service.getListById('non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getListsByBoardId', () => {
    it('should return all lists in a board', async () => {
      const lists = [mockList];

      mockPrismaService.board.findUnique.mockResolvedValue(mockBoard);
      mockPrismaService.list.findMany.mockResolvedValue(lists);

      const result = await service.getListsByBoardId('board-1');

      expect(result).toEqual(lists);
      expect(mockPrismaService.list.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { boardId: 'board-1' },
          orderBy: { position: 'asc' },
        }),
      );
    });

    it('should throw NotFoundException if board not found', async () => {
      mockPrismaService.board.findUnique.mockResolvedValue(null);

      await expect(service.getListsByBoardId('non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getAllLists', () => {
    it('should return all lists', async () => {
      const lists = [mockList];
      mockPrismaService.list.findMany.mockResolvedValue(lists);

      const result = await service.getAllLists();

      expect(result).toEqual(lists);
    });

    it('should filter lists by boardId', async () => {
      const filter = { boardId: 'board-1' };
      mockPrismaService.list.findMany.mockResolvedValue([mockList]);

      await service.getAllLists(filter);

      expect(mockPrismaService.list.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { boardId: 'board-1' },
        }),
      );
    });

    it('should filter lists by search term', async () => {
      const filter = { search: 'todo' };
      mockPrismaService.list.findMany.mockResolvedValue([mockList]);

      await service.getAllLists(filter);

      expect(mockPrismaService.list.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            title: {
              contains: 'todo',
              mode: 'insensitive',
            },
          },
        }),
      );
    });
  });

  describe('updateList', () => {
    it('should update a list', async () => {
      const updateInput = { title: 'Updated List' };
      const updatedList = { ...mockList, title: 'Updated List' };

      mockPrismaService.list.findUnique.mockResolvedValue(mockList);
      mockPrismaService.list.update.mockResolvedValue(updatedList);

      const result = await service.updateList('list-1', updateInput);

      expect(result).toEqual(updatedList);
      expect(mockPrismaService.list.update).toHaveBeenCalledWith({
        where: { id: 'list-1' },
        data: updateInput,
        include: expect.any(Object),
      });
    });

    it('should throw NotFoundException if list not found', async () => {
      mockPrismaService.list.findUnique.mockResolvedValue(null);

      await expect(
        service.updateList('non-existent', { title: 'Test' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('deleteList', () => {
    it('should delete a list and update positions', async () => {
      mockPrismaService.list.findUnique.mockResolvedValue(mockList);
      mockPrismaService.list.delete.mockResolvedValue(mockList);
      mockPrismaService.list.updateMany.mockResolvedValue({ count: 2 });

      const result = await service.deleteList('list-1');

      expect(result).toEqual(mockList);
      expect(mockPrismaService.list.delete).toHaveBeenCalledWith({
        where: { id: 'list-1' },
      });
      expect(mockPrismaService.list.updateMany).toHaveBeenCalledWith({
        where: {
          boardId: 'board-1',
          position: { gt: 0 },
        },
        data: {
          position: { decrement: 1 },
        },
      });
    });
  });

  describe('moveList', () => {
    it('should move a list to a new position', async () => {
      const moveInput = {
        listId: 'list-1',
        position: 2,
      };

      mockPrismaService.list.findUnique.mockResolvedValue(mockList);
      mockPrismaService.list.updateMany.mockResolvedValue({ count: 1 });
      mockPrismaService.list.update.mockResolvedValue({
        ...mockList,
        position: 2,
      });

      const result = await service.moveList(moveInput);

      expect(result.position).toBe(2);
      expect(mockPrismaService.list.update).toHaveBeenCalled();
    });

    it('should not update if moving to same position', async () => {
      const moveInput = {
        listId: 'list-1',
        position: 0, // same as current
      };

      mockPrismaService.list.findUnique.mockResolvedValue(mockList);
      mockPrismaService.list.update.mockResolvedValue(mockList);

      await service.moveList(moveInput);

      // updateMany should not be called for position updates
      expect(mockPrismaService.list.updateMany).not.toHaveBeenCalled();
    });
  });

  describe('duplicateList', () => {
    it('should duplicate a list with all cards', async () => {
      const cards = [
        {
          id: 'card-1',
          title: 'Card 1',
          description: 'Description',
          position: 0,
          listId: 'list-1',
          userId: 'user-1',
          dueDate: null,
        },
      ];

      mockPrismaService.list.findUnique.mockResolvedValue(mockList);
      mockPrismaService.list.findFirst.mockResolvedValue(mockList);
      mockPrismaService.list.create.mockResolvedValue({
        ...mockList,
        id: 'list-2',
        title: 'To Do (Copy)',
        position: 1,
      });
      mockPrismaService.card.findMany.mockResolvedValue(cards);
      mockPrismaService.card.create.mockResolvedValue(cards[0]);

      await service.duplicateList('list-1');

      expect(mockPrismaService.list.create).toHaveBeenCalled();
      expect(mockPrismaService.card.create).toHaveBeenCalled();
    });

    it('should use custom title if provided', async () => {
      mockPrismaService.list.findUnique.mockResolvedValue(mockList);
      mockPrismaService.list.findFirst.mockResolvedValue(null);
      mockPrismaService.list.create.mockResolvedValue({
        ...mockList,
        id: 'list-2',
        title: 'Custom Title',
      });
      mockPrismaService.card.findMany.mockResolvedValue([]);

      await service.duplicateList('list-1', 'Custom Title');

      expect(mockPrismaService.list.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            title: 'Custom Title',
          }),
        }),
      );
    });
  });

  describe('getListStats', () => {
    it('should return list statistics', async () => {
      mockPrismaService.list.findUnique.mockResolvedValue(mockList);
      mockPrismaService.card.count
        .mockResolvedValueOnce(10) // totalCards
        .mockResolvedValueOnce(6)  // cardsWithDueDate
        .mockResolvedValueOnce(2); // overdueCards

      const result = await service.getListStats('list-1');

      expect(result).toEqual({
        listId: 'list-1',
        totalCards: 10,
        cardsWithDueDate: 6,
        overdueCards: 2,
        cardsWithoutDueDate: 4,
      });
    });
  });

  describe('clearAllCards', () => {
    it('should delete all cards in a list', async () => {
      mockPrismaService.list.findUnique.mockResolvedValue(mockList);
      mockPrismaService.card.deleteMany.mockResolvedValue({ count: 5 });

      const result = await service.clearAllCards('list-1');

      expect(result).toEqual(mockList);
      expect(mockPrismaService.card.deleteMany).toHaveBeenCalledWith({
        where: { listId: 'list-1' },
      });
    });
  });

  describe('moveAllCards', () => {
    it('should move all cards from source to target list', async () => {
      const sourceList = { ...mockList, id: 'list-1' };
      const targetList = { ...mockList, id: 'list-2', position: 1 };
      const cards = [
        { id: 'card-1', position: 0, listId: 'list-1' },
        { id: 'card-2', position: 1, listId: 'list-1' },
      ];

      mockPrismaService.list.findUnique
        .mockResolvedValueOnce(sourceList)
        .mockResolvedValueOnce(targetList)
        .mockResolvedValueOnce(targetList);
      mockPrismaService.card.findMany.mockResolvedValue(cards);
      mockPrismaService.card.findFirst.mockResolvedValue(null);
      mockPrismaService.card.update.mockResolvedValue({});

      await service.moveAllCards('list-1', 'list-2');

      expect(mockPrismaService.card.update).toHaveBeenCalledTimes(2);
    });
  });
});

