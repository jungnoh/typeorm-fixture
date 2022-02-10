/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  DeepPartial,
  EntityManager,
  EntitySchema,
  EntityTarget,
  Repository,
  SaveOptions,
} from 'typeorm';
import { createMock, PartialFuncReturn } from './mock';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function mockedManagerSave<Entity>(entities: Entity[], options?: SaveOptions): Promise<Entity[]>;
function mockedManagerSave<Entity>(entity: Entity, options?: SaveOptions): Promise<Entity>;
function mockedManagerSave<Entity, T extends DeepPartial<Entity>>(
  targetOrEntity: EntityTarget<Entity>,
  entities: T[],
  options: SaveOptions & {
    reload: false;
  }
): Promise<T[]>;
function mockedManagerSave<Entity, T extends DeepPartial<Entity>>(
  targetOrEntity: EntityTarget<Entity>,
  entities: T[],
  options?: SaveOptions
): Promise<(T & Entity)[]>;
function mockedManagerSave<Entity, T extends DeepPartial<Entity>>(
  targetOrEntity: EntityTarget<Entity>,
  entity: T,
  options: SaveOptions & {
    reload: false;
  }
): Promise<T>;
function mockedManagerSave<Entity, T extends DeepPartial<Entity>>(
  targetOrEntity: EntityTarget<Entity>,
  entity: T,
  options?: SaveOptions
): Promise<T & Entity>;
async function mockedManagerSave(
  targetOrEntity: unknown,
  maybeEntityOrOptions: unknown,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  maybeOptions?: unknown
): Promise<unknown> {
  // normalize mixed parameters
  const target =
    arguments.length > 1 &&
    (targetOrEntity instanceof Function ||
      targetOrEntity instanceof EntitySchema ||
      typeof targetOrEntity === 'string')
      ? targetOrEntity
      : undefined;
  const entity = target ? maybeEntityOrOptions : targetOrEntity;
  return entity;
}

function mockedRepoSave<Entity, T extends DeepPartial<Entity>>(
  entities: T[],
  options: SaveOptions & {
    reload: false;
  }
): Promise<T[]>;
/**
 * Saves all given entities in the database.
 * If entities do not exist in the database then inserts, otherwise updates.
 */
function mockedRepoSave<Entity, T extends DeepPartial<Entity>>(
  entities: T[],
  options?: SaveOptions
): Promise<(T & Entity)[]>;
/**
 * Saves a given entity in the database.
 * If entity does not exist in the database then inserts, otherwise updates.
 */
function mockedRepoSave<Entity, T extends DeepPartial<Entity>>(
  entity: T,
  options: SaveOptions & {
    reload: false;
  }
): Promise<T>;
/**
 * Saves a given entity in the database.
 * If entity does not exist in the database then inserts, otherwise updates.
 */
function mockedRepoSave<Entity, T extends DeepPartial<Entity>>(
  entity: T,
  options?: SaveOptions
): Promise<T & Entity>;
async function mockedRepoSave(entityOrEntities: unknown, options?: unknown): Promise<unknown> {
  return entityOrEntities;
}

type ClassType<T> = { new (...args: any[]): T };

function mockedManagerCreate<Entity>(
  entityClass: ClassType<Entity>,
  plainObject?: DeepPartial<Entity>
): Entity;
function mockedManagerCreate<Entity>(
  entityClass: ClassType<Entity>,
  plainObjects?: DeepPartial<Entity>[]
): Entity[];
function mockedManagerCreate<Entity>(
  entityClass: ClassType<Entity>,
  plainObjects?: DeepPartial<Entity> | DeepPartial<Entity>[]
): Entity | Entity[] {
  const objects = [plainObjects ?? []].flat();
  const converted = objects.map((v) => {
    const cls = new entityClass();
    return Object.assign(cls, v);
  });
  if (plainObjects instanceof Array) {
    return converted;
  }
  return converted[0];
}

export function mockRepository<T>(cls: ClassType<T>): Repository<T> {
  return createMock<Repository<T>>({
    save: mockedRepoSave,
    create: (plainObjectOrObjects) => mockedManagerCreate(cls, plainObjectOrObjects),
  });
}

export function mockManager(): EntityManager {
  return createMock<EntityManager>({
    save: mockedManagerSave,
    getRepository: <Entity>(target: EntityTarget<Entity>) =>
      mockRepository(target as unknown as ClassType<Entity>) as PartialFuncReturn<Entity>,
  });
}
