import { MockedRepository } from './Repository';

class TestEntity {
  public id!: number;
  public a!: number;
  public b!: number;
}

describe('MockedRepository', () => {
  describe('create', () => {
    it('creates new entity if no object given', () => {
      const repo = new MockedRepository(TestEntity);
      const created = repo.create();

      expect(created).toBeInstanceOf(TestEntity);
    });
    it('creates new entity with object fields set', () => {
      const repo = new MockedRepository(TestEntity);
      const created = repo.create({ a: 1, b: 2 });

      expect(created).toBeInstanceOf(TestEntity);
      expect(created).toMatchObject({ a: 1, b: 2 });
    });
    it('creates new entities with object fields set', () => {
      const repo = new MockedRepository(TestEntity);
      const created = repo.create([
        { a: 1, b: 2 },
        { a: 2, b: 3 },
        { a: 3, b: 4 },
      ]);

      expect(created).toEqual([
        { a: 1, b: 2 },
        { a: 2, b: 3 },
        { a: 3, b: 4 },
      ]);
      for (const it of created) {
        expect(it).toBeInstanceOf(TestEntity);
      }
    });
  });
  describe('save', () => {
    it('increments id number', async () => {
      const repo = new MockedRepository(TestEntity);
      const created = await repo.save([
        { a: 1, b: 2 },
        { a: 2, b: 3 },
        { a: 3, b: 4 },
      ]);
      for (let i = 0; i < created.length; i++) {
        expect(created[i].id).toBe(i + 1);
      }
    });
  });
  describe('findById', () => {
    it('returns object if found', async () => {
      const repo = new MockedRepository(TestEntity);
      const created = await repo.save({ a: 3, b: 4 });

      expect(await repo.findById(created.id)).toMatchObject(created);
    });
    it('returns undefined if not found', async () => {
      const repo = new MockedRepository(TestEntity);

      expect(await repo.findById(10000)).toBeUndefined();
    });
  });
  describe('findByIds', () => {
    it('returns only found items', async () => {
      const repo = new MockedRepository(TestEntity);
      const created = await repo.save([
        { a: 1, b: 2 },
        { a: 3, b: 4 },
      ]);

      expect(await repo.findByIds([...created.map((v) => v.id), 19999])).toIncludeSameMembers(
        created
      );
    });
    it('returns objects if found', async () => {
      const repo = new MockedRepository(TestEntity);
      const created = await repo.save([
        { a: 1, b: 2 },
        { a: 2, b: 3 },
        { a: 3, b: 4 },
      ]);

      expect(await repo.findByIds(created.map((v) => v.id))).toIncludeSameMembers(created);
    });
  });
  describe('clear', () => {
    it('erases everything', async () => {
      const repo = new MockedRepository(TestEntity);
      const created = await repo.save([
        { a: 1, b: 2 },
        { a: 3, b: 4 },
      ]);

      await repo.clear();
      expect(await repo.findByIds(created.map((v) => v.id))).toEqual([]);
    });
  });
});
