import { Test, TestingModule } from '@nestjs/testing';
import { CardService } from './card.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('CardService', () => {
  let service: CardService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
    },
    list: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
    },
    card: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      delete: jest.fn(),
    },
  };

  const mockUser = {
    id: 'user-1',
    email: 'test@example.com',
    name: 'Test User',
  };

  const mockList = {
    id: 'list-1',
    title: 'To Do',
    position: 0,
    boardId: 'board-1',
    board: {
      id: 'board-1',
      title: 'Test Board',
      userId: 'user-1',
    },
  };

  const mockCard = {
    id: 'card-1',
    title: 'Test Card',
    description: 'Test Description',
    position: 0,
    dueDate: null,
    listId: 'list-1',
    userId: 'user-1',
    createdAt: new Date(),
    updatedAt: new Date(),
    list: mockList,
    user: mockUser,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CardService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<CardService>(CardService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createCard', () => {
    it('should create a new card', async () => {
      const createInput = {
        title: 'New Card',
        description: 'Description',
        listId: 'list-1',
        userId: 'user-1',
      };

      mockPrismaService.list.findUnique.mockResolvedValue(mockList);
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockPrismaService.card.findFirst.mockResolvedValue(null);
      mockPrismaService.card.create.mockResolvedValue(mockCard);

      const result = await service.createCard(createInput);

      expect(result).toEqual(mockCard);
      expect(mockPrismaService.list.findUnique).toHaveBeenCalledWith({
        where: { id: 'list-1' },
        include: { board: true },
      });
      expect(mockPrismaService.card.create).toHaveBeenCalled();
    });

    it('should throw NotFoundException if list does not exist', async () => {
      const createInput = {
        title: 'New Card',
        listId: 'non-existent-list',
      };

      mockPrismaService.list.findUnique.mockResolvedValue(null);

      await expect(service.createCard(createInput)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw NotFoundException if user does not exist', async () => {
      const createInput = {
        title: 'New Card',
        listId: 'list-1',
        userId: 'non-existent-user',
      };

      mockPrismaService.list.findUnique.mockResolvedValue(mockList);
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.createCard(createInput)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should auto-calculate position if not provided', async () => {
      const createInput = {
        title: 'New Card',
        listId: 'list-1',
      };

      const lastCard = { ...mockCard, position: 5 };

      mockPrismaService.list.findUnique.mockResolvedValue(mockList);
      mockPrismaService.card.findFirst.mockResolvedValue(lastCard);
      mockPrismaService.card.create.mockResolvedValue({
        ...mockCard,
        position: 6,
      });

      await service.createCard(createInput);

      expect(mockPrismaService.card.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            position: 6,
          }),
        }),
      );
    });
  });

  describe('getCardById', () => {
    it('should return a card by id', async () => {
      mockPrismaService.card.findUnique.mockResolvedValue(mockCard);

      const result = await service.getCardById('card-1');

      expect(result).toEqual(mockCard);
      expect(mockPrismaService.card.findUnique).toHaveBeenCalledWith({
        where: { id: 'card-1' },
        include: expect.any(Object),
      });
    });

    it('should throw NotFoundException if card not found', async () => {
      mockPrismaService.card.findUnique.mockResolvedValue(null);

      await expect(service.getCardById('non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getCardsByListId', () => {
    it('should return all cards in a list', async () => {
      const cards = [mockCard];

      mockPrismaService.list.findUnique.mockResolvedValue(mockList);
      mockPrismaService.card.findMany.mockResolvedValue(cards);

      const result = await service.getCardsByListId('list-1');

      expect(result).toEqual(cards);
      expect(mockPrismaService.card.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { listId: 'list-1' },
          orderBy: { position: 'asc' },
        }),
      );
    });

    it('should throw NotFoundException if list not found', async () => {
      mockPrismaService.list.findUnique.mockResolvedValue(null);

      await expect(service.getCardsByListId('non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getCardsByUserId', () => {
    it('should return all cards assigned to a user', async () => {
      const cards = [mockCard];

      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockPrismaService.card.findMany.mockResolvedValue(cards);

      const result = await service.getCardsByUserId('user-1');

      expect(result).toEqual(cards);
    });

    it('should throw NotFoundException if user not found', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.getCardsByUserId('non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getAllCards', () => {
    it('should return all cards', async () => {
      const cards = [mockCard];
      mockPrismaService.card.findMany.mockResolvedValue(cards);

      const result = await service.getAllCards();

      expect(result).toEqual(cards);
    });

    it('should filter cards by listId', async () => {
      const filter = { listId: 'list-1' };
      mockPrismaService.card.findMany.mockResolvedValue([mockCard]);

      await service.getAllCards(filter);

      expect(mockPrismaService.card.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { listId: 'list-1' },
        }),
      );
    });

    it('should filter cards by search term', async () => {
      const filter = { search: 'test' };
      mockPrismaService.card.findMany.mockResolvedValue([mockCard]);

      await service.getAllCards(filter);

      expect(mockPrismaService.card.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            OR: expect.arrayContaining([
              expect.objectContaining({
                title: expect.any(Object),
              }),
              expect.objectContaining({
                description: expect.any(Object),
              }),
            ]),
          },
        }),
      );
    });

    it('should filter overdue cards', async () => {
      const filter = { overdue: true };
      mockPrismaService.card.findMany.mockResolvedValue([mockCard]);

      await service.getAllCards(filter);

      expect(mockPrismaService.card.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            dueDate: {
              lt: expect.any(Date),
            },
          },
        }),
      );
    });
  });

  describe('updateCard', () => {
    it('should update a card', async () => {
      const updateInput = { title: 'Updated Card' };
      const updatedCard = { ...mockCard, title: 'Updated Card' };

      mockPrismaService.card.findUnique.mockResolvedValue(mockCard);
      mockPrismaService.card.update.mockResolvedValue(updatedCard);

      const result = await service.updateCard('card-1', updateInput);

      expect(result).toEqual(updatedCard);
      expect(mockPrismaService.card.update).toHaveBeenCalledWith({
        where: { id: 'card-1' },
        data: updateInput,
        include: expect.any(Object),
      });
    });

    it('should throw NotFoundException if card not found', async () => {
      mockPrismaService.card.findUnique.mockResolvedValue(null);

      await expect(
        service.updateCard('non-existent', { title: 'Test' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('deleteCard', () => {
    it('should delete a card', async () => {
      mockPrismaService.card.findUnique.mockResolvedValue(mockCard);
      mockPrismaService.card.delete.mockResolvedValue(mockCard);

      const result = await service.deleteCard('card-1');

      expect(result).toEqual(mockCard);
      expect(mockPrismaService.card.delete).toHaveBeenCalledWith({
        where: { id: 'card-1' },
      });
    });
  });

  describe('moveCard', () => {
    it('should move a card within the same list', async () => {
      const moveInput = {
        cardId: 'card-1',
        targetListId: 'list-1',
        position: 2,
      };

      mockPrismaService.card.findUnique.mockResolvedValue(mockCard);
      mockPrismaService.list.findUnique.mockResolvedValue(mockList);
      mockPrismaService.card.updateMany.mockResolvedValue({ count: 1 });
      mockPrismaService.card.update.mockResolvedValue({
        ...mockCard,
        position: 2,
      });

      const result = await service.moveCard(moveInput);

      expect(result.position).toBe(2);
      expect(mockPrismaService.card.update).toHaveBeenCalled();
    });

    it('should move a card to a different list', async () => {
      const targetList = {
        id: 'list-2',
        title: 'In Progress',
        position: 1,
        boardId: 'board-1',
      };

      const moveInput = {
        cardId: 'card-1',
        targetListId: 'list-2',
        position: 0,
      };

      mockPrismaService.card.findUnique.mockResolvedValue(mockCard);
      mockPrismaService.list.findUnique.mockResolvedValue(targetList);
      mockPrismaService.card.updateMany.mockResolvedValue({ count: 1 });
      mockPrismaService.card.update.mockResolvedValue({
        ...mockCard,
        listId: 'list-2',
        position: 0,
      });

      const result = await service.moveCard(moveInput);

      expect(result.listId).toBe('list-2');
      expect(mockPrismaService.card.updateMany).toHaveBeenCalledTimes(2);
    });

    it('should throw NotFoundException if target list not found', async () => {
      const moveInput = {
        cardId: 'card-1',
        targetListId: 'non-existent',
        position: 0,
      };

      mockPrismaService.card.findUnique.mockResolvedValue(mockCard);
      mockPrismaService.list.findUnique.mockResolvedValue(null);

      await expect(service.moveCard(moveInput)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('duplicateCard', () => {
    it('should duplicate a card in the same list', async () => {
      mockPrismaService.card.findUnique.mockResolvedValue(mockCard);
      mockPrismaService.card.findFirst.mockResolvedValue(mockCard);
      mockPrismaService.card.create.mockResolvedValue({
        ...mockCard,
        id: 'card-2',
        title: 'Test Card (Copy)',
        position: 1,
      });

      const result = await service.duplicateCard('card-1');

      expect(result.title).toBe('Test Card (Copy)');
      expect(mockPrismaService.card.create).toHaveBeenCalled();
    });

    it('should duplicate a card to a different list', async () => {
      const targetList = {
        id: 'list-2',
        title: 'In Progress',
      };

      mockPrismaService.card.findUnique.mockResolvedValue(mockCard);
      mockPrismaService.list.findUnique.mockResolvedValue(targetList);
      mockPrismaService.card.findFirst.mockResolvedValue(null);
      mockPrismaService.card.create.mockResolvedValue({
        ...mockCard,
        id: 'card-2',
        listId: 'list-2',
      });

      const result = await service.duplicateCard('card-1', 'list-2');

      expect(result.listId).toBe('list-2');
    });
  });

  describe('assignUser', () => {
    it('should assign a user to a card', async () => {
      mockPrismaService.card.findUnique.mockResolvedValue(mockCard);
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockPrismaService.card.update.mockResolvedValue({
        ...mockCard,
        userId: 'user-1',
      });

      const result = await service.assignUser('card-1', 'user-1');

      expect(result.userId).toBe('user-1');
    });

    it('should unassign a user from a card', async () => {
      mockPrismaService.card.findUnique.mockResolvedValue(mockCard);
      mockPrismaService.card.update.mockResolvedValue({
        ...mockCard,
        userId: null,
      });

      const result = await service.assignUser('card-1', null);

      expect(result.userId).toBeNull();
    });
  });

  describe('getOverdueCards', () => {
    it('should return overdue cards', async () => {
      const overdueCard = {
        ...mockCard,
        dueDate: new Date('2020-01-01'),
      };

      mockPrismaService.card.findMany.mockResolvedValue([overdueCard]);

      const result = await service.getOverdueCards();

      expect(result).toEqual([overdueCard]);
      expect(mockPrismaService.card.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            dueDate: {
              lt: expect.any(Date),
            },
          },
        }),
      );
    });
  });

  describe('getUpcomingCards', () => {
    it('should return upcoming cards', async () => {
      const upcomingCard = {
        ...mockCard,
        dueDate: new Date(Date.now() + 86400000), // tomorrow
      };

      mockPrismaService.card.findMany.mockResolvedValue([upcomingCard]);

      const result = await service.getUpcomingCards(undefined, 7);

      expect(result).toEqual([upcomingCard]);
    });
  });

  describe('searchCards', () => {
    it('should search cards by query', async () => {
      mockPrismaService.card.findMany.mockResolvedValue([mockCard]);

      const result = await service.searchCards('test');

      expect(result).toEqual([mockCard]);
      expect(mockPrismaService.card.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            OR: expect.any(Array),
          },
        }),
      );
    });
  });
});

