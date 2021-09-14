import FixtureRoot from '.';
import BaseFactory from '../classes/BaseFactory';
import Factory from '../decorators/Factory';
import Importer from './importer';
import { createConnection, getConnection } from 'typeorm';
import { Type } from '../types';
import StaticFixture from '../classes/StaticFixture';
import Fixture from '../decorators/Fixture';

class TargetEntity {
  public value!: string;
}

class EmptyEntity {}

@Factory(TargetEntity)
class TestFactory extends BaseFactory<TargetEntity> {
  protected createRandom(): TargetEntity {
    return {
      value: 'TestFactory',
    };
  }
}

@Factory(TargetEntity, { name: 'alternative' })
class AlternativeFactory extends BaseFactory<TargetEntity> {
  protected createRandom(): TargetEntity {
    return {
      value: 'AlternativeFactory',
    };
  }
}

@Factory(EmptyEntity)
class TestingFactory extends BaseFactory<EmptyEntity> {
  protected createRandom(): EmptyEntity {
    expect(this.factoryOf(TargetEntity).random()).toMatchObject({ value: 'TestFactory' });
    return {};
  }
}

@Fixture()
class TestFixture extends StaticFixture<string> {
  public async install(): Promise<string> {
    return 'TestValue1';
  }
}

@Fixture({ dependencies: [TestFixture] })
class TestFixture2 extends StaticFixture<string> {
  public async install(): Promise<string> {
    return 'TestValue2';
  }
}

@Fixture({ dependencies: [TestFixture] })
class TestingFixture extends StaticFixture<void> {
  public async install(): Promise<void> {
    expect(this.fixtureResultOf(TestFixture)).toEqual('TestValue1');
    expect(this.factoryOf(TargetEntity).random()).toMatchObject({ value: 'TestFactory' });
  }
}

describe('FixtureRoot', () => {
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
  describe('loadFiles', () => {
    it('loads', async () => {
      jest.spyOn(Importer.prototype, 'import').mockImplementation(async () => {
        return {
          factories: [TestFactory],
          fixtures: [],
        };
      });
      const instance = new FixtureRoot({ filePatterns: [] });
      await instance.loadFiles();
      expect(instance.factoryOf(TargetEntity)).toBeInstanceOf(TestFactory);
    });
    it("doesn't run if constructors are cached", async () => {
      const importMock = jest.fn(async () => {
        return {
          factories: [],
          fixtures: [],
        };
      });
      jest.spyOn(Importer.prototype, 'import').mockImplementation(importMock);
      const instance = new FixtureRoot({ filePatterns: [] });
      await instance.loadFiles();
      await instance.loadFiles();
      expect(importMock).toBeCalledTimes(1);
    });
  });
  describe('installFixtures', () => {
    afterEach(() => {
      jest.spyOn(Importer.prototype, 'import').mockRestore();
    });
    it('throws if not loaded', async () => {
      const instance = new FixtureRoot({ filePatterns: [] });
      await expect(instance.installFixtures()).rejects.toThrowError();
    });
    it('successfully loads and runs all fixtures', async () => {
      const importMock = jest.fn(async () => {
        return {
          factories: [],
          fixtures: [TestFixture, TestFixture2],
        };
      });
      jest.spyOn(Importer.prototype, 'import').mockImplementation(importMock);
      const instance = new FixtureRoot({ filePatterns: [] });
      await instance.loadFiles();
      await instance.installFixtures();
      expect(instance.fixtureResultOf(TestFixture)).toEqual('TestValue1');
      expect(instance.fixtureResultOf(TestFixture2)).toEqual('TestValue2');
    });
    it('loads manually given fixtures', async () => {
      const instance = new FixtureRoot({
        factories: [TestFactory],
        fixtures: [TestFixture, TestFixture2],
      });
      await instance.loadFiles();
      await instance.installFixtures();
      expect(instance.fixtureResultOf(TestFixture)).toEqual('TestValue1');
      expect(instance.fixtureResultOf(TestFixture2)).toEqual('TestValue2');
      expect(instance.factoryOf(TargetEntity)).not.toBeUndefined();
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      instance.factoryOf(TargetEntity)!.random();
    });
    it('can use filter', async () => {
      const instance = new FixtureRoot({
        factories: [],
        fixtures: [TestFixture, TestFixture2],
      });
      await instance.loadFiles();
      await expect(
        instance.installFixtures({ only: [TestFixture2], propagateDependencies: false })
      ).rejects.toThrowError();
    });
  });
  describe('clearFixtureResult', () => {
    it('clears cache', async () => {
      const instance = new FixtureRoot({ fixtures: [TestFixture] });
      await instance.loadFiles();
      await instance.installFixtures();
      expect(instance.fixtureResultOf(TestFixture)).not.toBeUndefined();
      instance.clearFixtureResult();
      expect(instance.fixtureResultOf(TestFixture)).toBeUndefined();
    });
  });
  describe('getFactoryInstance', () => {
    it('returns undefined if not found', () => {
      const instance = new FixtureRoot({ filePatterns: [] });
      expect(instance.factoryOf(TargetEntity)).toBeUndefined();
    });
  });
  describe('fixtureResultOf', () => {
    it('throws error if given type is not a fixture', () => {
      const instance = new FixtureRoot({ filePatterns: [] });
      expect(() =>
        instance.fixtureResultOf(TargetEntity as unknown as Type<StaticFixture<unknown>>)
      ).toThrowError();
    });
    it('returns undefined if not found', () => {
      const instance = new FixtureRoot({ filePatterns: [] });
      expect(instance.fixtureResultOf(TestFixture)).toBeUndefined();
    });
  });
  describe('instance bridge', () => {
    // All expect() statements are in the test factory/fixtures
    it('fixture', async () => {
      const importMock = jest.fn(async () => {
        return {
          factories: [TestFactory],
          fixtures: [TestFixture, TestFixture2, TestingFixture],
        };
      });
      jest.spyOn(Importer.prototype, 'import').mockImplementation(importMock);
      const instance = new FixtureRoot({ filePatterns: [] });
      await instance.loadFiles();
      await instance.installFixtures();
    });
    it('factory', async () => {
      const importMock = jest.fn(async () => {
        return {
          factories: [TestFactory, TestingFactory],
          fixtures: [],
        };
      });
      jest.spyOn(Importer.prototype, 'import').mockImplementation(importMock);
      const instance = new FixtureRoot({ filePatterns: [] });
      await instance.loadFiles();
      const factory = instance.factoryOf(EmptyEntity);
      expect(factory).not.toBeUndefined();
      factory?.random();
    });
  });
  describe('named factories', () => {
    it('resolves named factories', async () => {
      const instance = new FixtureRoot({ factories: [TestFactory, AlternativeFactory] });
      await instance.loadFiles();
      expect(instance.factoryOf(TargetEntity)).toBeInstanceOf(TestFactory);
      expect(instance.factoryOf(TargetEntity, 'default')).toBeInstanceOf(TestFactory);
      expect(instance.factoryOf(TargetEntity, 'alternative')).toBeInstanceOf(AlternativeFactory);
    });
  });
});
