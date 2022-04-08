import { MockedEntityManager } from './EntityManager';

class TestEntity {
  public id!: number;
  public a!: number;
  public b!: number;
}

describe('MockedEntityManager', () => {
  let manager: MockedEntityManager;
  beforeEach(() => {
    manager = new MockedEntityManager();
  });
  describe('getRepository', () => {
    it('returns mocked repository', async () => {
      const repository = manager.getRepository(TestEntity);
      expect(repository.create()).toBeInstanceOf(TestEntity);
    });
  });
  describe('save', () => {
    it('saves to repository', async () => {
      const created = await manager.save(TestEntity, { a: 1, b: 2 });

      const saved = (await manager.getRepository(TestEntity).findByIds([created.id]))[0];
      expect(saved).toMatchObject(created);
    });
  });
  describe('create', () => {
    it('creates well', async () => {
      const created = await manager.create(TestEntity, { a: 1, b: 2 });
      expect(created).toMatchObject({ a: 1, b: 2 });
    });
  });
});
