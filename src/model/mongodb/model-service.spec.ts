import { expect } from 'chai';
import { MongoClient } from 'mongodb';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { IdOptional, Model } from '../model-service';
import { MongoDbModelService } from './model-service';


interface TestModel extends Model<number> {
    name: string;
    age: number;
    books?: string[];
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
                name: 'Gamma',
                books: ['Book 1', 'Book 2']
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
        modelService = new MongoDbModelService('testDb', 'testCollection', client);
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

    it('should have the correct dbName, collectionName and serviceName', () => {
        expect(modelService.entityName).to.be.equal('testCollection');
        expect(modelService.dbName).to.be.equal('testDb');
        expect(modelService.serviceName).to.be.equal('mongodb');
    });

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

        for (const key of ['age', 'name'] as Array<'age' | 'name'>) {
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

        for (const key of ['age', 'name'] as Array<'age' | 'name'>) {
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

    it('should patch a document', async () => {
        const documents = getMockData();
        await modelService.createAll(documents);

        let result = await modelService.patch(documents[0]._id, {
            age: 99,
        });
        expect(result).to.deep.equals(Object.assign(documents[0], { age: 99 }));
        result = await modelService.getById(documents[0]._id);
        expect(result).to.deep.equals(Object.assign(documents[0], { age: 99 }));
    });

    it('should put a document that already exists', async () => {
        const documents = getMockData();
        await modelService.createAll(documents);
        const document = Object.assign({ name: "@@" }, documents[0]);

        let result = await modelService.put(document);
        expect(result).to.deep.equals(document);
        result = await modelService.getById(document._id);
        expect(result).to.deep.equals(document);
    });

    it('should put a new document', async () => {
        const documents = getMockData();
        await modelService.createAll(documents);
        const document: TestModel = {
            _id: 999999,
            name: '245',
            age: 5436
        };

        let result = await modelService.getById(document._id);
        expect(result).to.be.undefined;
        result = await modelService.put(document);
        expect(result).to.deep.equals(document);
        result = await modelService.getById(document._id);
        expect(result).to.deep.equals(document);
    });

    it('should update a document', async () => {
        const documents = getMockData();
        await modelService.createAll(documents);

        const updateResult = await modelService.update({
            $id: documents[2]._id
        }, {
            $set: {
                age: 0
            },
            $unset: {
                name: true
            },
            $push: {
                books: 'Book 3'
            }
        });
        expect(updateResult.updated).to.be.true;
        expect(updateResult.matched).to.be.greaterThan(0);

        const result = await modelService.getById(documents[2]._id);
        expect(result?.age).to.equals(0);
        expect(result?.name).to.be.undefined;
        expect(result?.books).to.deep.equals([
            'Book 1',
            'Book 2',
            'Book 3'
        ]);
    });

    it('should update a document with pop', async () => {
        const documents = getMockData();
        await modelService.createAll(documents);

        const updateResult = await modelService.update({
            $id: documents[2]._id
        }, {
            $set: {
                age: 0
            },
            $unset: {
                name: true
            },
            $pop: {
                books: 1
            }
        });
        expect(updateResult.updated).to.be.true;
        expect(updateResult.matched).to.be.greaterThan(0);

        const result = await modelService.getById(documents[2]._id);
        expect(result?.age).to.equals(0);
        expect(result?.name).to.be.undefined;
        expect(result?.books).to.deep.equals([
            'Book 1',
        ]);
    });

    it('should update a document with addToSet', async () => {
        const documents = getMockData();
        await modelService.createAll(documents);

        const updateResult = await modelService.update({
            $id: documents[2]._id
        }, {
            $addToSet: {
                books: 'Book 2'
            }
        });
        expect(updateResult.updated).to.be.false;
        expect(updateResult.matched).to.be.greaterThan(0);

        const result = await modelService.getById(documents[2]._id);
        expect(result?.age).to.equals(documents[2].age);
        expect(result?.name).to.equals(documents[2].name);
        expect(result?.books).to.deep.equals([
            'Book 1',
            'Book 2',
        ]);
    });

    it('should update all documents', async () => {
        const documents = getMockData();
        await modelService.createAll(documents);

        const updateResult = await modelService.updateAll({
            $on: {
                age: { $lte: 20 }
            }
        }, {
            $set: {
                age: 20
            },
            $unset: {
                name: true
            },
            $push: {
                books: 'Crime Story'
            }
        });
        expect(updateResult.updated).to.be.true;
        expect(updateResult.matched).to.equals(5);

        const result = await modelService.findAll({
            $on: {
                age: 20
            }
        });
        expect(result.total).to.equals(5);
        expect(result.data.length).to.equals(5);
        expect(result.data.every(d => !!d.books?.length && d.books.includes('Crime Story'))).to.be.true;
        expect(result.data.every(d => !d.name)).to.be.true;
        expect(result.data.every(d => d.age === 20)).to.be.true;
    });

    it('should upsert the documents', async () => {
        const documents = getMockData();
        await modelService.createAll(documents);

        const updateResult = await modelService.updateOrInsertAll({
            $on: {
                age: { $gte: 12000 }
            }
        }, {
            $set: {
                age: 20,
                name: 'Test',
                books: ['A', 'B']
            }
        });
        expect(updateResult.updated).to.be.false;
        expect(updateResult.inserted).to.true;
        expect(updateResult.insertedId).to.not.be.undefined;
        expect(updateResult.insertedId).to.not.be.null;
        expect(updateResult.insertedId).to.not.be.false;

        const result = await modelService.getById(updateResult.insertedId);
        expect(result).to.deep.equals({
            _id: updateResult.insertedId,
            age: 20,
            name: 'Test',
            books: ['A', 'B']
        });
    });

    it('should upsert all the documents', async () => {
        const documents = getMockData();
        await modelService.createAll(documents);

        const updateResult = await modelService.updateOrInsertAll({
            $on: {
                age: { $gte: 12000 }
            }
        }, {
            $set: {
                age: 20,
                name: 'Test',
                books: ['A', 'B']
            }
        });
        expect(updateResult.updated).to.be.false;
        expect(updateResult.inserted).to.true;
        expect(updateResult.insertedId).to.not.be.undefined;
        expect(updateResult.insertedId).to.not.be.null;
        expect(updateResult.insertedId).to.not.be.false;

        const result = await modelService.getById(updateResult.insertedId);
        expect(result).to.deep.equals({
            _id: updateResult.insertedId,
            age: 20,
            name: 'Test',
            books: ['A', 'B']
        });
    });

    it('should delete all the documents', async () => {
        const documents = getMockData();
        await modelService.createAll(documents);
        const deleteResult = await modelService.deleteAll({
            $on: {
                age: { $lt: 20 }
            }
        });

        expect(deleteResult.deleted).to.be.true;
        expect(deleteResult.matched).to.equals(5);

        let result = await modelService.findAll({
            $on: {
                age: { $lt: 20 }
            }
        });
        expect(result.total).to.equals(0);
        expect(result.data.length).to.equals(0);
        result = await modelService.findAll({});
        expect(result.total).to.equals(1);
        expect(result.data.length).to.equals(1);
    });

    it('should count all documents paged using an or filter', async () => {
        let documents = getMockData();
        documents.push({
            age: 999,
            name: 'Old',
            _id: 999,
            amount: 2
        } as TestModel);
        await modelService.createAll(documents);

        const result = await modelService.count({
            $or: [
                { $on: { age: { $gt: 12 } } },
                { $on: { amount: { $isSet: true } } },
            ]
        });
        expect(result).to.equals(3);
    });
});
