import { BaseFactory } from '../..';
import BaseStaticFixture from '../../classes/StaticFixture';
import Factory from '../../decorators/Factory';
import { StaticFixture } from '../../decorators/Fixture';

export const SOME_LITERAL = 'hi';
export const SOME_OTHER_LITERAL = 'hi2';

export class TargetEntity {}

@StaticFixture()
export class TestFixture extends BaseStaticFixture<void> {
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
