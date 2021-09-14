import StaticFixture from '../../classes/StaticFixture';
import Fixture from '../../decorators/Fixture';

@Fixture()
export default class Test2 extends StaticFixture<string> {
  public install(): Promise<string> {
    throw new Error('Method not implemented.');
  }
}
