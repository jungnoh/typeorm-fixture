import 'reflect-metadata';
import BaseFixture from '../classes/BaseFixture';
import {
  CLASS_DEPENDENCIES,
  CLASS_IDENTIFIER,
  FIXTURE_MARK,
  FIXTURE_TX_LEVEL,
  MARK_VALUE,
} from './constants';
import Fixture from './Fixture';

@Fixture()
class TestFixture extends BaseFixture<void> {
  public install(): Promise<void> {
    throw new Error('Method not implemented.');
  }
}

@Fixture({ dependencies: [TestFixture] })
class DepTestFixture extends BaseFixture<void> {
  public install(): Promise<void> {
    throw new Error('Method not implemented.');
  }
}

@Fixture({ isolationLevel: 'SERIALIZABLE' })
class TxFixture extends BaseFixture<void> {
  public install(): Promise<void> {
    throw new Error('Method not implemented.');
  }
}

describe('@Fixture', () => {
  it('marks class as factory', () => {
    expect(Reflect.hasMetadata(FIXTURE_MARK, TestFixture.prototype)).toBeTruthy();
    expect(Reflect.getMetadata(FIXTURE_MARK, TestFixture.prototype)).toEqual(MARK_VALUE);
  });
  it('sets class identifier as constructor name', () => {
    expect(Reflect.getMetadata(CLASS_IDENTIFIER, TestFixture.prototype)).toEqual(
      `FIXTURE_STATIC_${TestFixture.name}`
    );
  });
  it('dependencies is empty array if not given', () => {
    expect(Reflect.getMetadata(CLASS_DEPENDENCIES, TestFixture.prototype)).toEqual([]);
  });
  it('dependencies set if given', () => {
    expect(Reflect.getMetadata(CLASS_DEPENDENCIES, DepTestFixture.prototype)).toEqual([
      TestFixture,
    ]);
  });
  it('isolationLevel undefined if not set', () => {
    expect(Reflect.getMetadata(FIXTURE_TX_LEVEL, TestFixture.prototype)).toBeUndefined();
  });
  it('isolationLevel set', () => {
    expect(Reflect.getMetadata(FIXTURE_TX_LEVEL, TxFixture.prototype)).toEqual('SERIALIZABLE');
  });
  it('throws error if decorated twice', () => {
    const test = () => {
      @Fixture()
      @Fixture()
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      class DoubleTestFixture extends BaseFixture {
        public install(): Promise<void> {
          throw new Error('Method not implemented.');
        }
      }
    };
    expect(test).toThrowError();
  });
});
