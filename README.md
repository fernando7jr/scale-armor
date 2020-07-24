# ScaleArmor

Easy and simple scalable node restful api framework

ScaleArmor runs on top of feathers.js and is still under development

## Install

````npm install scale-armor````

## Setup a basic application

### Congigure your test environment

Create a directory `config` in your project and then create a new file called `default.json`

```json
{
    "host": "localhost",
    "port": 3030
}
```

### Create the first model and route

Create a new file `model.ts`

```typescript
import { Model, MongoDbModel } from 'scale-armor';

export interface Person extends Model {
    name: string;
    age: number;
    address: string;
    isEmployeed: boolean;
}
export class PersonModel extends MongoDbModel<Person> {
    constructor() {
        const collectionName = 'person';
        super(collectionName);
    }
}
```

Then create a new file `route.ts`

```typescript
import { Routing, CRUDMethods, Method } from 'scale-armor';
import { PersonModel } from './model';

@CRUDMethods('/person', PersonModel)
export class MyRoutes extends Routing {
    constructor() {
        const routePath = '/api';
        super(routePath);
    }

    @Routing.Find('/status')
    public async status() {
        return 'ok';
    }
}
```

### Wrap up everything

Finally create the file `index.ts` and wrap everything together

```typescript
import { ScaleArmorServerlet } from 'scale-armor';
import { MyRoutes } from './route';

const serverlet = new ScaleArmorServerlet();
serverlet.setup()
    .installRoutingProvider(new MyRoutes())
    .middleware();
const app = serverlet.app;

const port = app.get('port');
const server = app.listen(port);

process.on('unhandledRejection', (reason, p) => {
    console.error('Unhandled Rejection at: Promise ', p, reason);
});

server.on('listening', () => {
    console.info('Feathers application started on http://%s:%d', app.get('host'), port);
});
```

## Authentication

### Set the Token secret

In any file before start your application set the token secret

```typescript
import { Token } from 'scale-armor';

const secret = 'your super secret string'
Token.registerJwtSecret(secret);
```

### Apply the auth hook

In any route add a `before` property

```typescript
import { Routing, CRUDMethods, Method } from 'scale-armor';
import { PersonModel } from './model';

@CRUDMethods('/person', PersonModel)
export class MyRoutes extends Routing {
    private authRoutes = new AuthRoutes();
    protected before: ServiceHookFunction;
    constructor() {
        const routePath = '/api';
        super(routePath);

        this.before = this.authRoutes.getAuthHook(UserAccessType.Admin);
    }

    @Routing.Find('/status')
    public async status() {
        return 'ok';
    }
}
```
