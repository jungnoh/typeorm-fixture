import { IsolationLevel } from 'typeorm/driver/types/IsolationLevel';
import { FixtureConstructor } from '../classes/types';

export interface FixtureOptions {
  isolationLevel?: IsolationLevel | 'default';
  dependencies?: FixtureConstructor[];
}
