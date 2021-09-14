import 'reflect-metadata';
import { EntityManager } from 'typeorm';
import { StaticFixture } from '../decorators/Fixture';
import { FixtureBridge } from '../root/bridge';
import { Type, UnPromisify } from '../types';
import BaseFactory from './BaseFactory';
import BaseStaticFixture from './StaticFixture';

class TestEntity {
  v!: string;
}

@StaticFixture()
class TestTargetFixture extends BaseStaticFixture<string> {
  public async install(manager: EntityManager): Promise<string> {
    return 'asdf';
  }
}

@StaticFixture()
class TestFixture extends BaseStaticFixture<void> {
  public install(manager: EntityManager): Promise<void> {
    throw new Error('Method not implemented.');
  }

  public testFixtureResultOf<FixtureType extends BaseStaticFixture<unknown>>(
    type: Type<FixtureType>
  ): UnPromisify<ReturnType<FixtureType['install']>> {
    return this.fixtureResultOf(type);
  }

  public testFactoryOf<EntityType>(type: Type<EntityType>): BaseFactory<EntityType> {
    return this.factoryOf(type);
  }
}

describe('StaticFixture', () => {
  describe('fixtureResultOf', () => {
    const mockedBridge = {
      getFactoryInstance: jest.fn(),
      fixtureResultOf: jest.fn((type: Type<BaseStaticFixture<unknown>>) => {
        if (type.name === TestTargetFixture.name) return 'asdf';
        return undefined;
      }),
    };
    it('works', () => {
      const fixture = new TestFixture(mockedBridge as unknown as FixtureBridge);
      expect(fixture.testFixtureResultOf(TestTargetFixture as new () => TestTargetFixture)).toEqual(
        'asdf'
      );
    });
    it('fails if does not exist', () => {
      const fixture = new TestFixture(mockedBridge as unknown as FixtureBridge);
      expect(() =>
        fixture.testFixtureResultOf(TestFixture as new () => TestFixture)
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
      fixtureResultOf: jest.fn(),
    };
    it('works', () => {
      const fixture = new TestFixture(mockedBridge as unknown as FixtureBridge);
      expect(fixture.testFactoryOf(TestEntity).random()).toMatchObject({ v: 'hi' });
    });
    it('fails if does not exist', () => {
      const fixture = new TestFixture(mockedBridge as unknown as FixtureBridge);
      expect(() => fixture.testFactoryOf(TestFixture as new () => TestFixture)).toThrowError();
    });
  });
});
