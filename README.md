# typeorm-fixture
<p align="center">
  <a href="https://github.com/jungnoh/typeorm-fixture/actions">
    <image src="https://github.com/jungnoh/typeorm-fixture/actions/workflows/test-on-push.yml/badge.svg" alt="test">
  </a>
  <a href="https://github.com/jungnoh/typeorm-fixture/actions">
    <image src="https://github.com/jungnoh/typeorm-fixture/actions/workflows/build.yml/badge.svg" alt="build">
  </a>
  <a href="https://coveralls.io/github/jungnoh/typeorm-fixture?branch=main">
    <img src="https://coveralls.io/repos/github/jungnoh/typeorm-fixture/badge.svg?branch=main" alt="Coverage Status">
  </a>
  <a href="https://www.npmjs.com/package/typeorm-fixture">
    <img src="https://img.shields.io/npm/v/typeorm-fixture" alt="npm shield">
  </a>
</p>

typeorm-fixture provides an easy and consistant way to load test fixtures into a database with TypeORM.

This library provides three constructs:
- **Factories** creates entities with random or partially prepared data.
- **Static fixtures** load entities and data with fixed data when a test suite starts.
- **Dynamic fixtures** load entities and data during a test suite, and can be parameterized to fit your needs.

Along with these, typeorm-fixture has many features that help us spend more time on writing actual tests.

## Installation
With npm
```bash
npm install --dev typeorm-fixture
```
or with yarn
```bash
yarn add -D typeorm-fixture
```
[TypeORM](https://www.npmjs.com/package/typeorm) is a peer dependency.
`experimentalDecorators` must be set to true in `tsconfig.json`, although this already should have been set if TypeORM is installed.

## Features
For demonstration, let's load some test data for this model.
```typescript
// src/models.ts
@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id!: number;
  @Column()
  name!: string;
  @Column()
  point!: number;
}

@Entity()
export class Article {
  @PrimaryGeneratedColumn()
  id!: number;
  @Column()
  content!: string;
  @CreateDateColumn()
  createdAt!: Date;
  @ManyToOne(() => User, { nullable: false }) @JoinColumn()
  author!: User;
  @Column({ nullable: false })
  authorId!: number;
  @Column({ default: 0 })
  likeCount!: number;
}

@Entity()
export class ArticleLike {
  @PrimaryGeneratedColumn() id!: number;
  @ManyToOne(() => User, { nullable: false }) @JoinColumn()
  user!: User;
  @Column({ nullable: false })
  userId!: number;
  @ManyToOne(() => Article, { nullable: false }) @JoinColumn()
  article!: Article;
  @Column({ nullable: false })
  articleId!: number;
}
```
### Factories
Factories create entities with random or partially prepared data. Only the `createRandom()` abstract method need to be implemented, and the `BaseFactory` takes care of everything else. After defining `createRandom()`, factories can be used in fixtures or in test cases.

Factories should not have access to the database, as its role is only to create entity instances. <br />All factories should be created by extending `BaseFactory<EntityType>`, and with the `@Factory(EntityType)` decorator.

```typescript
// src/test/factory/User.ts
import faker from 'faker';

@Factory(User)
export default class UserFactory extends BaseFactory<User> {
  protected createRandom(): User {
    return {
      name: faker.name.firstName(),
      point: faker.datatype.number({min: 0, max: 1000}),
    };
  }
}
```
Even though `createRandom` returns a plain object and not an `User` instance, `BaseFactory` will convert the object and return an `User` instance when `random` is used.

We need another factory for the Article entity.
```typescript
// src/test/factory/Article.ts
import faker from 'faker';

@Factory(Article)
export default class ArticleFactory extends BaseFactory<Article> {
  protected createRandom(): Article {
    return {
      const article = new Article();
      article.content = faker.sentence();
      return article;
    }
  }
}
```

### Static Fixtures
Factories alone cannot manipulate databases. Static fixtures provide a pattern to load fixed entities and data when a test suite starts. 

We can start by creating and inserting 10 random users.
```typescript
// src/test/fixture/User.ts
@StaticFixture()
export default class UserFixture extends BaseStaticFixture<User[]> {
  public async install(manager: EntityManager): Promise<User[]> {
    let users = this.factoryOf(User).randomMany(10);
    users = await manager.getRepository(User).save(user);
    return users;
  }
}
```
Some things to notice:
- `EntityManager` is the entity manager provided by TypeORM.
- `this.factoryOf(User)` returns a factory instance for `User`. This would be the UserFactory we have defined earlier.
- `.randomMany(10)` is a handy method defined in `BaseFactory` for creating multiple random entites at once.
- The users returned by `install` will be cached and be available for other fixtures that may depend on `UserFixture`. The type of the cached value can be freely chosen, such as `Record<string, User>` for mapping on a key or simply `void` when caching isn't needed.

Now that we have setup users, we can create articles.
```typescript
// src/test/fixture/Article.ts
@StaticFixture({ dependencies: [UserFixture] })
export default class ArticleFixture extends BaseStaticFixture<Article[]> {
  public async install(manager: EntityManager): Promise<Article[]> {
    const users = this.fixtureResultOf(UserFixture);
    let articles = users.map((user) => this.factoryOf(Article).partial({author: user}));
    articles = await manager.getRepository(Article).save(articles);
    return articles;
  }
}
```
In ArticleFixture, dependencies are provided in `@StaticFixture`. This ensures that `UserFixture` will be installed before `ArticleFixture`. By adding UserFixture into the dependency, the cached result provided by UserFixture can safely be loaded by calling `this.fixtureResultOf(UserFixture)`.

We can also see that `this.factoryOf(Article).partial` is called. `partial` is also a method defined in `BaseFactory`, allowing us to override some properties over a random entity made in `createRandom`.

### Dynamic Fixtures
Because static fixtures are intended to be used only before starting any test cases, they have little flexibility.
They are only used once, so they don't accept parameters.
We can't obtain instances of static fixtures as they aren't meant to be used multiple times.
However, there always is a time when you need to add additional test data during test suites.
Factories can be used during testing, but they are tied to a single entity and cannot do database operations. 

Dynamic fixtures provide a reusable and consistant with static fixtures to create data, while having the flexibility to accept parameters.
For example, creating a group of entities that have one-to-one relationships with each other is a good fit for using dynamic fixtures.

In our example, we can create a dynamic fixture for creating ArticleLike entities.

```typescript
/// src/test/fixture/ArticleLike.ts
interface ArticleLikeOptions {
  article: Article;
  user: User;
}

@DynamicFixture({ isolationLevel: 'SERIALIZABLE' })
export default class ArticleLikeFixture extends BaseDynamicFixture<ArticleLike, ArticleLikeOptions> {
  public async install(manager: EntityManager, options: ArticleLikeOptions): Promise<ArticleLike> {
    const articleLike = new ArticleLike();
    articleLike.article = options.article;
    articleLike.user = options.user;
    await manager.getRepository(ArticleLike).save(articleLike);

    article.likeCount += 1;
    await manager.getRepository(Article).save(article);
    return articleLike;
  }
}
```
Some things to keep in mind are:
- Dynamic fixtures and static fixtures are both fixtures. They can both be dependent on each other, and obtain instances/results of each other.
- If the `isolationLevel` field is provided, the whole fixture is run within a single transaction. `isolationLevel` can be one of the values in TypeORM's `IsolationLevel` type, or `default` (using the default database isolation level). This can also used in static fixtures.

### Bringing everything together
We haven't described how we can use the classes we've created. Everything we made can be imported and used though the `FixtureContainer`.

A FixtureContainer should be kept somewhere you can always access during tests. For instance in jest, this could be a variable inside the outermost `describe` block.

```typescript
describe('My database', () => {
  let fixtureContainer;
  beforeAll(async () => {
    // After establishing a database connection..
    fixtureContainer = new FixtureContainer({
      filePatterns: ["src/test/**/*.ts"],
    });
    await fixtureContainer.loadFiles();
    await fixtureContainer.installFixtures();
  });
});
```
`.loadFiles()` reads the files given in the glob pattern, and `.installFixtures()` executes (installs) the static fixtures. Note that even if you don't have any static fixtures, you must run `.loadFiles()` to use factories and dynamic fixtures.

FixtureContainers can also accept direct class constructors, or both.
```typescript
fixtureContainer = new FixtureContainer({
  filePatterns: ["src/test/**/*.ts"],
  fixtures: [SomeOtherFixture, SomeDynamicFixture],
  factories: [MyFactory],
});
```
After initializing the container, we can use the loaded classes/results.
- `.factoryOf(EntityType)` returns a factory instance for `EntityType`.
- `.fixtureResultOf(StaticFixtureType)` returns the cached result of the `StaticFixtureType` static fixture.
- `.dynamicFixtureOf(DynamicFixtureType)` returns a dynamic fixture instance for `DynamicFixtureType`.

### Reusing a single fixture container
If reusing (reinstalling) static fixtures is necessary, we can do so by clearing the container cache and reinstalling fixtures.

```typescript
describe('My database', () => {
  let fixtureContainer;
  beforeAll(async () => {
    // After establishing a database connection..
    fixtureContainer = new FixtureContainer({
      filePatterns: ["src/test/**/*.ts"],
    });
    await fixtureContainer.loadFiles();
    await fixtureContainer.installFixtures();
  });
  afterEach(async () => {
    await fixtureContainer.clearFixtureResult();
    await fixtureContainer.installFixtures();
  });
});
```

## License
MIT