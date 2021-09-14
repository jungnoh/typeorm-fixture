import { BaseFactory, BaseFixture } from '../..';
import Factory from '../../decorators/Factory';
import Fixture from '../../decorators/Fixture';

export const SOME_LITERAL = 'hi';
export const SOME_OTHER_LITERAL = 'hi2';

export class TargetEntity {}

@Fixture()
export class TestFixture extends BaseFixture<void> {
  public install(): Promise<void> {
    throw new Error('Method not implemented.');
  }
}

@Factory(TargetEntity)
export class TestFactory extends BaseFactory<TargetEntity> {
  protected createRandom(): TargetEntity {
    throw new Error('Method not implemented.');
  }
}
