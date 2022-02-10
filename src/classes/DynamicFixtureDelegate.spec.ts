import { createConnection, EntityManager, getConnection } from 'typeorm';
import { FixtureBridge } from '../root/bridge';
import BaseDynamicFixture from './DynamicFixture';
import DynamicFixtureDelegate from './DynamicFixtureDelegate';

class TestEntity {
  public value!: number;
}

class TestDynamicFixture extends BaseDynamicFixture<void, void> {
  public async install(manager: EntityManager): Promise<void> {
    expect(manager.connection.isConnected).toBe(true);
  }
}

class TestMockingDynamicFixture extends BaseDynamicFixture<TestEntity[], void> {
  public async install(manager: EntityManager): Promise<TestEntity[]> {
    const instances = manager.getRepository(TestEntity).create([{ value: 1 }, { value: 2 }]);
    return await manager.getRepository(TestEntity).save(instances);
  }
}

describe('DynamicFixtureDelegate', () => {
  describe('with real database', () => {
    beforeAll(async () => {
      await createConnection({
        type: 'postgres',
        host: process.env.POSTGRES_HOST ?? 'db',
        database: 'test',
        username: 'foo',
        password: 'foo',
        dropSchema: true,
        entities: [],
        synchronize: true,
        logging: false,
      });
    });
    afterAll(async () => {
      await getConnection().close();
    });
    it('can use manager', async () => {
      const TEST_STRING = 'TEST_STRING';
      const fixture = new TestDynamicFixture({} as unknown as FixtureBridge);
      await new DynamicFixtureDelegate(TestDynamicFixture, fixture, {
        mockDatabase: false,
      }).install(TEST_STRING);
    });
  });
  describe('without real database', () => {
    it('can use manager', async () => {
      const fixture = new TestMockingDynamicFixture({} as unknown as FixtureBridge);
      const result = await new DynamicFixtureDelegate(TestMockingDynamicFixture, fixture, {
        mockDatabase: true,
      }).install({});

      expect(result).toHaveLength(2);
      expect(result[0]).toBeInstanceOf(TestEntity);
      expect(result[0].value).toBe(1);
    });
  });
});
