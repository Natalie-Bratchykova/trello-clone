import { Test, TestingModule } from '@nestjs/testing';
import { BoardService } from './board.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException, ForbiddenException } from '@nestjs/common';

describe('BoardService', () => {
  let service: BoardService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
    },
    board: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    list: {
      findMany: jest.fn(),
      create: jest.fn(),
      count: jest.fn(),
    },
    card: {
      create: jest.fn(),
      count: jest.fn(),
    },
  };

  const mockUser = {
    id: 'user-1',
    email: 'test@example.com',
    name: 'Test User',
  };

  const mockBoard = {
    id: 'board-1',
    title: 'Test Board',
    color: '#0079bf',
    userId: 'user-1',
    createdAt: new Date(),
    updatedAt: new Date(),
    user: mockUser,
    lists: [],
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BoardService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<BoardService>(BoardService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createBoard', () => {
    it('should create a new board', async () => {
      const createInput = {
        title: 'New Board',
        color: '#ff0000',
        userId: 'user-1',
      };

      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockPrismaService.board.create.mockResolvedValue(mockBoard);

      const result = await service.createBoard(createInput);

      expect(result).toEqual(mockBoard);
      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-1' },
      });
      expect(mockPrismaService.board.create).toHaveBeenCalled();
    });

    it('should throw NotFoundException if user does not exist', async () => {
      const createInput = {
        title: 'New Board',
        userId: 'non-existent-user',
      };

      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.createBoard(createInput)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should use default color if not provided', async () => {
      const createInput = {
        title: 'New Board',
        userId: 'user-1',
      };

      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockPrismaService.board.create.mockResolvedValue(mockBoard);

      await service.createBoard(createInput);

      expect(mockPrismaService.board.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            color: '#0079bf',
          }),
        }),
      );
    });
  });

  describe('getBoardById', () => {
    it('should return a board by id', async () => {
      mockPrismaService.board.findUnique.mockResolvedValue(mockBoard);

      const result = await service.getBoardById('board-1');

      expect(result).toEqual(mockBoard);
      expect(mockPrismaService.board.findUnique).toHaveBeenCalledWith({
        where: { id: 'board-1' },
        include: expect.any(Object),
      });
    });

    it('should throw NotFoundException if board not found', async () => {
      mockPrismaService.board.findUnique.mockResolvedValue(null);

      await expect(service.getBoardById('non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getBoardsByUserId', () => {
    it('should return all boards for a user', async () => {
      const boards = [mockBoard];

      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockPrismaService.board.findMany.mockResolvedValue(boards);

      const result = await service.getBoardsByUserId('user-1');

      expect(result).toEqual(boards);
      expect(mockPrismaService.board.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: 'user-1' },
        }),
      );
    });

    it('should throw NotFoundException if user not found', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.getBoardsByUserId('non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getAllBoards', () => {
    it('should return all boards', async () => {
      const boards = [mockBoard];
      mockPrismaService.board.findMany.mockResolvedValue(boards);

      const result = await service.getAllBoards();

      expect(result).toEqual(boards);
    });

    it('should filter boards by userId', async () => {
      const filter = { userId: 'user-1' };
      mockPrismaService.board.findMany.mockResolvedValue([mockBoard]);

      await service.getAllBoards(filter);

      expect(mockPrismaService.board.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: 'user-1' },
        }),
      );
    });

    it('should filter boards by search term', async () => {
      const filter = { search: 'test' };
      mockPrismaService.board.findMany.mockResolvedValue([mockBoard]);

      await service.getAllBoards(filter);

      expect(mockPrismaService.board.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            title: {
              contains: 'test',
              mode: 'insensitive',
            },
          },
        }),
      );
    });
  });

  describe('updateBoard', () => {
    it('should update a board', async () => {
      const updateInput = { title: 'Updated Board' };
      const updatedBoard = { ...mockBoard, title: 'Updated Board' };

      mockPrismaService.board.findUnique.mockResolvedValue(mockBoard);
      mockPrismaService.board.update.mockResolvedValue(updatedBoard);

      const result = await service.updateBoard('board-1', updateInput);

      expect(result).toEqual(updatedBoard);
      expect(mockPrismaService.board.update).toHaveBeenCalledWith({
        where: { id: 'board-1' },
        data: updateInput,
        include: expect.any(Object),
      });
    });

    it('should throw NotFoundException if board not found', async () => {
      mockPrismaService.board.findUnique.mockResolvedValue(null);

      await expect(
        service.updateBoard('non-existent', { title: 'Test' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('deleteBoard', () => {
    it('should delete a board', async () => {
      mockPrismaService.board.findUnique.mockResolvedValue(mockBoard);
      mockPrismaService.board.delete.mockResolvedValue(mockBoard);

      const result = await service.deleteBoard('board-1');

      expect(result).toEqual(mockBoard);
      expect(mockPrismaService.board.delete).toHaveBeenCalledWith({
        where: { id: 'board-1' },
      });
    });
  });

  describe('verifyBoardOwnership', () => {
    it('should return true if user owns the board', async () => {
      mockPrismaService.board.findUnique.mockResolvedValue(mockBoard);

      const result = await service.verifyBoardOwnership('board-1', 'user-1');

      expect(result).toBe(true);
    });

    it('should throw ForbiddenException if user does not own the board', async () => {
      mockPrismaService.board.findUnique.mockResolvedValue(mockBoard);

      await expect(
        service.verifyBoardOwnership('board-1', 'different-user'),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('getBoardStats', () => {
    it('should return board statistics', async () => {
      mockPrismaService.board.findUnique.mockResolvedValue(mockBoard);
      mockPrismaService.list.count.mockResolvedValue(3);
      mockPrismaService.card.count
        .mockResolvedValueOnce(10)
        .mockResolvedValueOnce(4);

      const result = await service.getBoardStats('board-1');

      expect(result).toEqual({
        boardId: 'board-1',
        listsCount: 3,
        cardsCount: 10,
        completedCards: 4,
        activeCards: 6,
      });
    });
  });

  describe('duplicateBoard', () => {
    it('should duplicate a board with all lists and cards', async () => {
      const lists = [
        {
          id: 'list-1',
          title: 'List 1',
          position: 0,
          boardId: 'board-1',
          cards: [
            {
              id: 'card-1',
              title: 'Card 1',
              description: 'Description',
              position: 0,
              listId: 'list-1',
              userId: 'user-1',
            },
          ],
        },
      ];

      mockPrismaService.board.findUnique.mockResolvedValue(mockBoard);
      mockPrismaService.board.create.mockResolvedValue({
        ...mockBoard,
        id: 'board-2',
        title: 'Test Board (Copy)',
      });
      mockPrismaService.list.findMany.mockResolvedValue(lists);
      mockPrismaService.list.create.mockResolvedValue(lists[0]);
      mockPrismaService.card.create.mockResolvedValue(lists[0].cards[0]);

      await service.duplicateBoard('board-1', 'user-1');

      expect(mockPrismaService.board.create).toHaveBeenCalled();
      expect(mockPrismaService.list.create).toHaveBeenCalled();
      expect(mockPrismaService.card.create).toHaveBeenCalled();
    });
  });
});

