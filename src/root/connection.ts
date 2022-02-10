import { EntityManager, getManager } from 'typeorm';
import { IsolationLevel } from 'typeorm/driver/types/IsolationLevel';
import { FixtureConstructor } from '../classes/types';
import { FIXTURE_TX_LEVEL } from '../decorators/constants';
import { mockManager } from '../util/mockedManager';

export async function runWithScopedConnection<T>(
  fixture: FixtureConstructor,
  func: (entityManager: EntityManager) => Promise<T>
): Promise<T> {
  const isolationLevel = Reflect.getMetadata(FIXTURE_TX_LEVEL, fixture.prototype) as
    | IsolationLevel
    | 'default'
    | undefined;
  const needsTransaction = !!isolationLevel;

  // TODO: Allow custom connections
  if (!needsTransaction) {
    return await func(getManager());
  }

  let result: T;
  if (isolationLevel === 'default') {
    await getManager().transaction(async (entityManager) => {
      result = await func(entityManager);
    });
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    return result!;
  }
  await getManager().transaction(isolationLevel, async (entityManager) => {
    result = await func(entityManager);
  });
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  return result!;
}

export async function runWithNoConnection<T>(
  fixture: FixtureConstructor,
  func: (entityManager: EntityManager) => Promise<T>
): Promise<T> {
  const mockedManager = mockManager();
  return await func(mockedManager);
}
