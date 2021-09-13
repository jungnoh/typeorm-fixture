import FixtureRoot from '.';
import { BaseFixture, Fixture } from '..';
import BaseFactory from '../classes/BaseFactory';
import Factory from '../decorators/Factory';
import Importer from './importer';
import { createConnection, getConnection } from 'typeorm';
import { Type } from '../types';

class TargetEntity {
  public value!: string;
}

class EmptyEntity {}

@Factory(TargetEntity)
class TestFactory extends BaseFactory<TargetEntity> {
  public random(): TargetEntity {
    return {
      value: 'TestFactory',
    };
  }
}

@Factory(TargetEntity, { name: 'alternative' })
class AlternativeFactory extends BaseFactory<TargetEntity> {
  public random(): TargetEntity {
    return {
      value: 'AlternativeFactory',
    };
  }
}

@Factory(EmptyEntity)
class TestingFactory extends BaseFactory<EmptyEntity> {
  public random(): EmptyEntity {
    expect(this.factoryOf(TargetEntity).random()).toMatchObject({ value: 'TestFactory' });
    return {};
  }
}

@Fixture()
class TestFixture extends BaseFixture<string> {
  public async install(): Promise<string> {
    return 'TestValue1';
  }
}

@Fixture({ dependencies: [TestFixture] })
class TestFixture2 extends BaseFixture<string> {
  public async install(): Promise<string> {
    return 'TestValue2';
  }
}

@Fixture({ dependencies: [TestFixture] })
class TestingFixture extends BaseFixture<void> {
  public async install(): Promise<void> {
    expect(this.loadFixtureResult(TestFixture)).toEqual('TestValue1');
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
      expect(instance.getFactoryInstance(TargetEntity)).toBeInstanceOf(TestFactory);
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
      expect(instance.getFixtureResult(TestFixture)).toEqual('TestValue1');
      expect(instance.getFixtureResult(TestFixture2)).toEqual('TestValue2');
    });
    it('loads manually given fixtures', async () => {
      const instance = new FixtureRoot({
        factories: [TestFactory],
        fixtures: [TestFixture, TestFixture2],
      });
      await instance.loadFiles();
      await instance.installFixtures();
      expect(instance.getFixtureResult(TestFixture)).toEqual('TestValue1');
      expect(instance.getFixtureResult(TestFixture2)).toEqual('TestValue2');
      expect(instance.getFactoryInstance(TargetEntity)).not.toBeUndefined();
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      instance.getFactoryInstance(TargetEntity)!.random();
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
      expect(instance.getFixtureResult(TestFixture)).not.toBeUndefined();
      instance.clearFixtureResult();
      expect(instance.getFixtureResult(TestFixture)).toBeUndefined();
    });
  });
  describe('getFactoryInstance', () => {
    it('returns undefined if not found', () => {
      const instance = new FixtureRoot({ filePatterns: [] });
      expect(instance.getFactoryInstance(TargetEntity)).toBeUndefined();
    });
  });
  describe('getFixtureResult', () => {
    it('throws error if given type is not a fixture', () => {
      const instance = new FixtureRoot({ filePatterns: [] });
      expect(() =>
        instance.getFixtureResult(TargetEntity as unknown as Type<BaseFixture<unknown>>)
      ).toThrowError();
    });
    it('returns undefined if not found', () => {
      const instance = new FixtureRoot({ filePatterns: [] });
      expect(instance.getFixtureResult(TestFixture)).toBeUndefined();
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
      const factory = instance.getFactoryInstance(EmptyEntity);
      expect(factory).not.toBeUndefined();
      factory?.random();
    });
  });
  describe('named factories', () => {
    it('resolves named factories', async () => {
      const instance = new FixtureRoot({ factories: [TestFactory, AlternativeFactory] });
      await instance.loadFiles();
      expect(instance.getFactoryInstance(TargetEntity)).toBeInstanceOf(TestFactory);
      expect(instance.getFactoryInstance(TargetEntity, 'default')).toBeInstanceOf(TestFactory);
      expect(instance.getFactoryInstance(TargetEntity, 'alternative')).toBeInstanceOf(
        AlternativeFactory
      );
    });
  });
});
