import { DeepPartial, EntityTarget, Repository, SaveOptions } from 'typeorm';
import { Type } from '../types';
import { createMock } from '../util/mock';
import { MockableEntity, MockedRepository } from './Repository';

export class MockedEntityManager {
  private readonly repositories: Record<string, MockedRepository<MockableEntity>> = {};

  public getRepository<T extends MockableEntity>(cls: Type<T>): Repository<T> {
    const repository = this.getRealRepository(cls);
    return createMock<Repository<T>>(repository);
  }

  public async save<Entity extends MockableEntity, T extends DeepPartial<Entity>>(
    targetOrEntity: EntityTarget<Entity>,
    entities: T[],
    options: SaveOptions & {
      reload: false;
    }
  ): Promise<T[]>;
  public async save<Entity extends MockableEntity, T extends DeepPartial<Entity>>(
    targetOrEntity: EntityTarget<Entity>,
    entities: T[],
    options?: SaveOptions
  ): Promise<Entity[]>;
  public async save<Entity extends MockableEntity, T extends DeepPartial<Entity>>(
    targetOrEntity: EntityTarget<Entity>,
    entity: T,
    options: SaveOptions & {
      reload: false;
    }
  ): Promise<T>;
  public async save<Entity extends MockableEntity, T extends DeepPartial<Entity>>(
    targetOrEntity: EntityTarget<Entity>,
    entity: T,
    options?: SaveOptions
  ): Promise<T & Entity>;
  public async save<Entity extends MockableEntity, T extends DeepPartial<Entity>>(
    targetOrEntity: EntityTarget<Entity>,
    entities: T | T[],
    options?: SaveOptions
  ): Promise<T | Entity | (T | Entity)[]> {
    await Promise.resolve();
    if (entities instanceof Array) {
      return (await this.getRealRepository(targetOrEntity).save(entities, options)) as (
        | T
        | Entity
      )[];
    } else {
      return (await this.getRealRepository(targetOrEntity).save(entities, options)) as T | Entity;
    }
  }

  public async create<Entity extends MockableEntity>(
    entityClass: EntityTarget<Entity>,
    plainObject?: DeepPartial<Entity>
  ): Promise<Entity>;
  public async create<Entity extends MockableEntity>(
    entityClass: EntityTarget<Entity>,
    plainObjects?: DeepPartial<Entity>[]
  ): Promise<Entity[]>;
  public async create<Entity extends MockableEntity>(
    entityClass: EntityTarget<Entity>,
    plainObjects?: DeepPartial<Entity> | DeepPartial<Entity>[]
  ): Promise<Entity | Entity[]> {
    if (!plainObjects) {
      return await this.getRealRepository(entityClass).create();
    }
    if (plainObjects instanceof Array) {
      return await this.getRealRepository(entityClass).create(plainObjects);
    } else {
      return await this.getRealRepository(entityClass).create(plainObjects);
    }
  }

  private getRealRepository<T extends MockableEntity>(
    entity: EntityTarget<T>
  ): MockedRepository<T> {
    const { name, constructor } = this.getEntityIdentifier(entity);
    if (!this.repositories[name]) {
      this.repositories[name] = new MockedRepository(constructor);
    }
    return this.repositories[name] as MockedRepository<T>;
  }

  private getEntityIdentifier<Entity>(entityOrTarget: EntityTarget<Entity>): {
    name: string;
    constructor: Type<Entity>;
  } {
    if (typeof entityOrTarget === 'string') {
      throw new Error(
        `Unable to resolve entity type of '${entityOrTarget}' in a mocked environment`
      );
    }
    if ('name' in entityOrTarget) {
      if ('type' in entityOrTarget) {
        return {
          name: entityOrTarget['name'],
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          constructor: (entityOrTarget['type'] as any).__proto__.constructor,
        };
      } else {
        return {
          name: entityOrTarget['name'],
          constructor: entityOrTarget as Type<Entity>,
        };
      }
    }
    throw new Error(`Unable to resolve entity name of '${entityOrTarget}' in a mocked environment`);
  }
}
