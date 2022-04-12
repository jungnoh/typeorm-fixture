import { DeepPartial, ObjectLiteral, RemoveOptions, SaveOptions } from 'typeorm';
import { Type } from '../types';

export type MockableEntity = ObjectLiteral & { id: number };

export class MockedRepository<Entity extends MockableEntity> {
  constructor(private readonly entityType: Type<Entity>) {}

  private pkCounter = 0;
  private data: Record<number, Entity> = {} as Record<number, Entity>;

  public create(): Entity;
  public create(entityLike: DeepPartial<Entity>): Entity;
  public create(entityLike: DeepPartial<Entity>[]): Entity[];
  public create(entityLike?: DeepPartial<Entity> | DeepPartial<Entity>[]): Entity | Entity[] {
    if (!entityLike) {
      return new this.entityType();
    }
    if (entityLike instanceof Array) {
      return entityLike.map((v) => Object.assign(new this.entityType(), v));
    } else {
      return Object.assign(new this.entityType(), entityLike);
    }
  }

  public async save<T extends DeepPartial<Entity>>(
    entities: T[],
    options: SaveOptions & {
      reload: false;
    }
  ): Promise<T[]>;
  public async save<T extends DeepPartial<Entity>>(
    entities: T[],
    options?: SaveOptions
  ): Promise<Entity[]>;
  public async save<T extends DeepPartial<Entity>>(
    entity: T,
    options: SaveOptions & {
      reload: false;
    }
  ): Promise<T>;
  public async save<T extends DeepPartial<Entity>>(
    entity: T,
    options?: SaveOptions
  ): Promise<T & Entity>;
  public async save<T extends DeepPartial<Entity>>(
    entities: T | T[],
    options?: SaveOptions
  ): Promise<T | Entity | (T | Entity)[]> {
    await Promise.resolve();
    if (entities instanceof Array) {
      return entities.map((v) => this.handleSave(v, options?.reload ?? false));
    } else {
      return this.handleSave(entities, options?.reload ?? false);
    }
  }

  public async remove(entities: Entity[], options?: RemoveOptions): Promise<Entity[]>;
  public async remove(entity: Entity, options?: RemoveOptions): Promise<Entity>;
  public async remove(entities: Entity | Entity[]): Promise<Entity | Entity[]> {
    await Promise.resolve();
    if (entities instanceof Array) {
      for (const entity of entities) {
        delete this.data[entity.id];
      }
    } else {
      delete this.data[entities.id];
    }
    return entities;
  }

  public async findById(id: number): Promise<Entity | undefined> {
    await Promise.resolve();
    return this.data[id] ?? undefined;
  }

  public async findByIds(ids: number[]): Promise<Entity[]> {
    await Promise.resolve();
    return ids.map((v) => this.data[v]).filter((v) => !!v);
  }

  public async clear(): Promise<void> {
    await Promise.resolve();
    this.data = {};
  }

  private handleSave<T extends DeepPartial<Entity>>(entity: T, reload: boolean): T | Entity {
    if (!entity.id) {
      this.pkCounter++;
      this.data[this.pkCounter] = Object.assign(new this.entityType(), entity, {
        id: this.pkCounter,
      });
      return reload ? this.data[this.pkCounter] : { ...entity, id: this.pkCounter };
    } else if (!this.data[entity.id as number]) {
      this.data[entity.id as number] = Object.assign(new this.entityType(), entity);
      return reload ? this.data[entity.id as number] : { ...entity, id: entity.id as number };
    } else {
      this.data[entity.id as number] = Object.assign(this.data[entity.id as number], entity);
      return reload ? this.data[entity.id as number] : entity;
    }
  }
}
