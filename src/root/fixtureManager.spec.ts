import { createConnection, EntityManager, getConnection } from 'typeorm';
import { BaseFixture, FixtureRoot } from '..';
import Fixture from '../decorators/Fixture';
import Importer from './importer';

@Fixture()
class NoTransactionFixture extends BaseFixture<number> {
  public async install() {
    return 1;
  }
}

@Fixture({ dependencies: [NoTransactionFixture] })
class DependentFixture extends BaseFixture<number> {
  public async install() {
    return 2;
  }
}

@Fixture({ isolationLevel: 'default' })
class TransactionFixture extends BaseFixture<void> {
  public async install(manager: EntityManager) {
    expect(manager.connection.isConnected).toEqual(true);
    const result = await manager.query('SHOW TRANSACTION ISOLATION LEVEL');
    const level = result[0]['transaction_isolation'];
    expect(level).toEqual('read committed');
  }
}

@Fixture({ isolationLevel: 'SERIALIZABLE' })
class SerializableFixture extends BaseFixture<void> {
  public async install(manager: EntityManager) {
    expect(manager.connection.isConnected).toEqual(true);
    const result = await manager.query('SHOW TRANSACTION ISOLATION LEVEL');
    const level = result[0]['transaction_isolation'];
    expect(level).toEqual('serializable');
  }
}

describe('FixtureManager', () => {
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
  afterEach(() => {
    jest.spyOn(Importer.prototype, 'import').mockRestore();
  });
  it('sets transaction isolation level', async () => {
    const importMock = jest.fn(async () => {
      return {
        factories: [],
        fixtures: [NoTransactionFixture, TransactionFixture, SerializableFixture],
      };
    });
    jest.spyOn(Importer.prototype, 'import').mockImplementation(importMock);
    const instance = new FixtureRoot({ filePatterns: [] });
    await instance.loadFiles();
    await instance.installFixtures();
  });

  describe('filters', () => {
    it('throws error if not propagated', async () => {
      const instance = new FixtureRoot({ fixtures: [NoTransactionFixture, DependentFixture] });
      await instance.loadFiles();
      await expect(
        instance.installFixtures({ only: [DependentFixture], propagateDependencies: false })
      ).rejects.toThrowError();
    });
    it('propagates', async () => {
      const instance = new FixtureRoot({ fixtures: [NoTransactionFixture, DependentFixture] });
      await instance.loadFiles();
      await expect(
        instance.installFixtures({ only: [DependentFixture], propagateDependencies: true })
      ).resolves.not.toThrow();
    });
    it('propagates by default', async () => {
      const instance = new FixtureRoot({ fixtures: [NoTransactionFixture, DependentFixture] });
      await instance.loadFiles();
      await instance.installFixtures({ only: [DependentFixture] });
      await expect(instance.installFixtures({ only: [DependentFixture] })).resolves.not.toThrow();
    });
  });
});
