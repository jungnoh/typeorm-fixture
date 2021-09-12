import FixtureRoot from '.';
import { BaseFixture, Fixture } from '..';
import BaseFactory from '../classes/BaseFactory';
import Factory from '../decorators/Factory';
import Importer from './importer';
import { createConnection } from 'typeorm';
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
    createConnection({
      type: 'sqlite',
      database: ':memory:',
      dropSchema: true,
      entities: [],
      synchronize: true,
      logging: false,
    });
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
});
