import 'reflect-metadata';
import { Connection } from 'typeorm';
import Fixture from '../decorators/Fixture';
import { FixtureBridge } from '../root/bridge';
import { Type, UnPromisify } from '../types';
import BaseFactory from './BaseFactory';
import BaseFixture from './BaseFixture';

class TestEntity {
  v!: string;
}

@Fixture()
class TestTargetFixture extends BaseFixture<string> {
  public async install(connection: Connection): Promise<string> {
    return 'asdf';
  }
}

@Fixture()
class TestFixture extends BaseFixture<void> {
  public install(connection: Connection): Promise<void> {
    throw new Error('Method not implemented.');
  }

  public testLoadFixtureResult<FixtureType extends BaseFixture<unknown>>(
    type: Type<FixtureType>
  ): UnPromisify<ReturnType<FixtureType['install']>> {
    return this.loadFixtureResult(type);
  }

  public testFactoryOf<EntityType>(type: Type<EntityType>): BaseFactory<EntityType> {
    return this.factoryOf(type);
  }

  public testGetFixtureName(): string {
    return this.getFixtureName();
  }
}

describe('BaseFixture', () => {
  it('getFixtureName', () => {
    const mockedBridge = {
      getFactoryInstance: jest.fn(),
      getFixtureResult: jest.fn(),
    };
    const fixture = new TestFixture(mockedBridge);
    expect(fixture.testGetFixtureName()).toEqual(TestFixture.name);
  });
  describe('loadFixtureResult', () => {
    const mockedBridge = {
      getFactoryInstance: jest.fn(),
      getFixtureResult: jest.fn((type: Type<BaseFixture<unknown>>) => {
        if (type.name === TestTargetFixture.name) return 'asdf';
        return undefined;
      }),
    };
    it('works', () => {
      const fixture = new TestFixture(mockedBridge as unknown as FixtureBridge);
      expect(
        fixture.testLoadFixtureResult(TestTargetFixture as new () => TestTargetFixture)
      ).toEqual('asdf');
    });
    it('fails if does not exist', () => {
      const fixture = new TestFixture(mockedBridge as unknown as FixtureBridge);
      expect(() =>
        fixture.testLoadFixtureResult(TestFixture as new () => TestFixture)
      ).toThrowError();
    });
  });
  describe('factoryOf', () => {
    const mockedBridge = {
      getFactoryInstance: jest.fn((type: Type<unknown>) => {
        if (type.name === TestEntity.name) {
          return {
            random: () => ({ v: 'hi' }),
          };
        }
        return undefined;
      }),
      getFixtureResult: jest.fn(),
    };
    it('works', () => {
      const fixture = new TestFixture(mockedBridge as unknown as FixtureBridge);
      expect(fixture.testFactoryOf(TestEntity).random()).toMatchObject({ v: 'hi' });
    });
    it('fails if does not exist', () => {
      const fixture = new TestFixture(mockedBridge as unknown as FixtureBridge);
      expect(() =>
        fixture.testFactoryOf(TestFixture as new () => TestFixture)
      ).toThrowError();
    });
  });
});