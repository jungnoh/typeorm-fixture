import { createConnection, EntityManager, getConnection } from 'typeorm';
import { FixtureBridge } from '../root/bridge';
import BaseDynamicFixture from './DynamicFixture';
import DynamicFixtureDelegate from './DynamicFixtureDelegate';

class TestDynamicFixture extends BaseDynamicFixture<void, void> {
  public async install(manager: EntityManager): Promise<void> {
    expect(manager.connection.isConnected).toBe(true);
  }
}

describe('DynamicFixtureDelegate', () => {
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
    await new DynamicFixtureDelegate(TestDynamicFixture, fixture).install(TEST_STRING);
  });
});
