import { expect } from 'chai';
import { MongoClient } from 'mongodb';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { IdOptional, Model } from '../model-service';
import { MongoDbModelService } from './model-service';


interface TestModel extends Model<number> {
    name: string;
    age: number;
}


describe(MongoDbModelService.name, () => {
    let mongoDbServer: MongoMemoryServer;
    let client: MongoClient;
    let modelService: MongoDbModelService<TestModel>;

    const getMockData = () => {
        return [
            {
                _id: 0,
                age: 8,
                name: 'Test 0',
            },
            {
                _id: 1,
                age: 17,
                name: 'Beta'
            },
            {
                _id: 2,
                age: 11,
                name: 'Gamma'
            },
            {
                _id: 3,
                age: 33,
                name: 'All tests'
            },
            {
                _id: 4,
                age: 12,
                name: 'Zeta'
            },
            {
                _id: 5,
                age: 2,
                name: 'YJ'
            }
        ];
    };

    beforeEach(async () => {
        mongoDbServer = new MongoMemoryServer({
            autoStart: true,
            spawn: {
                timeout: 30
            }
        });
        const uri = await mongoDbServer.getUri();
        client = new MongoClient(uri, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        modelService = new MongoDbModelService('test', 'test', client);
    });

    afterEach(async () => {
        await modelService.drop();
        client.removeAllListeners();
        await client.close(true);
        await mongoDbServer.stop();
    });

    // after(() => {
    //     (global as any).asyncDump();
    // });

    it('should create a document', async () => {
        const createdModel = await modelService.create({ name: 'test', age: 2 });
        expect(createdModel?._id).to.not.be.undefined;
        expect(createdModel?._id).to.not.be.null;
        expect(createdModel?.name).to.equals('test');
        expect(createdModel?.age).to.equals(2);

        const result = await modelService.getById(createdModel?._id);
        expect(result).to.deep.equals(createdModel);
    });

    it('should create a document with id', async () => {
        const createdModel = await modelService.create({ _id: 0, name: 'test', age: 2 });
        expect(createdModel?._id).to.equals(0);
        expect(createdModel?.name).to.equals('test');
        expect(createdModel?.age).to.equals(2);

        const result = await modelService.getById(createdModel?._id);
        expect(result).to.deep.equals(createdModel);
    });

    it('should create all documents', async () => {
        const documents: IdOptional<TestModel>[] = getMockData();

        const createdModels = await modelService.createAll(documents);
        for (let i = 0; i < documents.length; i += 1) {
            const createdModel = createdModels[i];
            const document = documents[i];
            expect(createdModel?._id).to.not.be.undefined;
            expect(createdModel?._id).to.not.be.null;
            expect(createdModel?.name).to.equals(document.name);
            expect(createdModel?.age).to.equals(document.age);
            if (document._id !== undefined) {
                expect(createdModel?._id).to.equals(document._id);
            }

            const result = await modelService.getById(createdModel?._id);
            expect(result).to.deep.equals(createdModel);
        };
    });

    it('should get all documents ordered asc', async () => {
        const mockData = getMockData();
        await modelService.createAll(mockData);

        for (const key of ['age', 'name'] as Array<keyof TestModel>) {
            const documents = getMockData().sort((a, b) => {
                return a[key] > b[key] ? 1 : -1;
            });
            const result = await modelService.findAll({}, { sortBy: key, sortType: 1 });
            expect(result.data).to.deep.equals(documents);
        }
    });

    it('should get all documents ordered desc', async () => {
        const mockData = getMockData();
        await modelService.createAll(mockData);

        for (const key of ['age', 'name'] as Array<keyof TestModel>) {
            const documents = getMockData().sort((a, b) => {
                return a[key] < b[key] ? 1 : -1;
            });
            const result = await modelService.findAll({}, { sortBy: key, sortType: -1 });
            expect(result.data).to.deep.equals(documents);
        }
    });

    it('should get all documents paged', async () => {
        const documents = getMockData();
        await modelService.createAll(documents);
        const result = await modelService.findAll({}, { page: 2, pageSize: 2 });
        expect(result.page).to.equals(2);
        expect(result.pageSize).to.equals(2);
        expect(result.total).to.equals(6);
        expect(result.lastPage).to.equals(3);
        expect(result.data).to.deep.equals(documents.slice(2, 4));
    });

    it('should get all documents paged using a filter', async () => {
        const documents = getMockData();
        await modelService.createAll(documents);
        const result = await modelService.findAll({
            $on: { age: { $gt: 12 } }
        }, { page: 1, pageSize: 10 });
        expect(result.page).to.equals(1);
        expect(result.pageSize).to.equals(10);
        expect(result.total).to.equals(2);
        expect(result.lastPage).to.equals(1);
        expect(result.data).to.deep.equals(documents.filter(doc => {
            return doc.age > 12;
        }));
    });

    it('should get all documents paged using an and filter', async () => {
        const documents = getMockData();
        await modelService.createAll(documents);
        const result = await modelService.findAll({
            $and: [
                { $on: { age: { $gt: 12 } } },
                { $on: { name: { $neq: "All tests" } } },
            ]
        }, { page: 1, pageSize: 10 });
        expect(result.page).to.equals(1);
        expect(result.pageSize).to.equals(10);
        expect(result.total).to.equals(1);
        expect(result.lastPage).to.equals(1);
        expect(result.data).to.deep.equals(documents.filter(doc => {
            return doc.age > 12 && doc.name !== "All tests";
        }));
    });

    it('should get all documents paged using an or filter', async () => {
        let documents = getMockData();
        documents.push({
            age: 999,
            name: 'Old',
            _id: 999,
            amount: 2
        } as TestModel);
        await modelService.createAll(documents);
        documents = documents.sort((a, b) => {
            return a.age > b.age ? -1 : 1;
        });

        const result = await modelService.findAll({
            $or: [
                { $on: { age: { $gt: 12 } } },
                { $on: { amount: { $isSet: true } } },
            ]
        }, { page: 1, pageSize: 10, sortBy: 'age', sortType: -1 });
        expect(result.page).to.equals(1);
        expect(result.pageSize).to.equals(10);
        expect(result.total).to.equals(3);
        expect(result.lastPage).to.equals(1);
        expect(result.data).to.deep.equals(documents.filter(doc => {
            return doc.age > 12 || (doc as any).amount !== undefined;
        }));
        expect(result.data[0]).to.deep.equals(documents[0]);
    });

    it('should get all documents paged using an or id filter', async () => {
        let documents = getMockData();
        await modelService.createAll(documents);

        const result = await modelService.findAll({
            $or: [
                { $on: { age: { $gt: 55 } } },
                { $id: 0 },
            ]
        }, { page: 1, pageSize: 10 });
        expect(result.page).to.equals(1);
        expect(result.pageSize).to.equals(10);
        expect(result.total).to.equals(1);
        expect(result.lastPage).to.equals(1);
        expect(result.data).to.deep.equals(documents.filter(doc => {
            return doc.age > 55 || doc._id === 0;
        }));
    });
});
