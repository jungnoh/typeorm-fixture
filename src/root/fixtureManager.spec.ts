import { Connection, createConnection, EntityManager, getConnection } from 'typeorm';
import { BaseFixture, FixtureRoot } from '..';
import Fixture from '../decorators/Fixture';
import Importer from './importer';

@Fixture()
class NoTransactionFixture extends BaseFixture<void> {
  public async install(manager: EntityManager) {
    expect(manager.connection.isConnected).toEqual(true);
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
});
