import { expect } from 'chai';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { MongoClient } from 'mongodb';
import { Routing, ConfigStorage, MongoDbModelService, CRUDMethods, PagedData } from './core';


interface Product {
    name: string;
    price: number;
}
const products: Product[] = [
    { name: 'P1', price: 3 },
    { name: 'P2', price: 5 },
    { name: 'P3', price: 7 },
    { name: 'P4', price: 9 },
    { name: 'P5', price: 11 },
    { name: 'P6', price: 13 },
    { name: 'P7', price: 15 },
];
class ProductsModelService extends MongoDbModelService<Product> {
    constructor() {
        super('products');
    }
}

@CRUDMethods('/products', ProductsModelService)
class TestRoutes extends Routing {
    constructor() {
        super('/test');
    }

    @Routing.Find('/status')
    async getStatus() {
        return {message: 'ok'};
    }
}


describe('App', () => {
    let mongod: MongoMemoryServer;

    before(async () => {
        mongod = new MongoMemoryServer();
        const uri = await mongod.getConnectionString();
        const dbName = 'local';
        
        const fakeApp = {
            storage: {
                mongodbUri: uri,
                mongodbDatabaseName: dbName,
            },
            get(key: string): any {
                return (fakeApp.storage as any)[key];
            }
        };
        ConfigStorage.registerApp(fakeApp);
        
        const client = new MongoClient(uri);
        const connection = await client.connect();
        await connection.db(dbName).collection('products').insertMany(products);
        await connection.close();
    });

    let testRoutes: TestRoutes;

    beforeEach(() => {
        testRoutes = new TestRoutes();
    })

    it('should return status', async () => {
        const result = await testRoutes.getStatus();
        expect(result.message).to.be.equals('ok');
    });

    it('should return products first page', async () => {
        const endpoints = await testRoutes.getEndpoints();
        const endpoint = endpoints['/test/products'];
        const result: PagedData<Product> = await endpoint.find({
            query: {
                $page: 0,
                $pageSize: 2
            }
        });
        expect(result.page).to.be.equals(0);
        expect(result.lastPage).to.be.equals(Math.ceil(products.length / 2));
        expect(result.total).to.be.equals(products.length);
        for (let i = 0; i < result.data.length; i += 1) {
            const resultP = result.data[i];
            const p = products[i];
            expect(resultP.name).to.be.equals(p.name);
            expect(resultP.price).to.be.equals(p.price);
        }
    });

    it('should return products second page', async () => {
        const endpoints = await testRoutes.getEndpoints();
        const endpoint = endpoints['/test/products'];
        const result: PagedData<Product> = await endpoint.find({
            query: {
                $page: 1,
                $pageSize: 2
            }
        });
        expect(result.page).to.be.equals(1);
        expect(result.lastPage).to.be.equals(Math.ceil(products.length / 2));
        expect(result.total).to.be.equals(products.length);
        for (let i = 0; i < result.data.length; i += 1) {
            const resultP = result.data[i];
            const p = products[i + 2];
            expect(resultP.name).to.be.equals(p.name);
            expect(resultP.price).to.be.equals(p.price);
        }
    });

    after(async () => {
        await mongod.stop();
        process.exit(0)
    });
});
