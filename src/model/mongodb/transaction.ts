import { ClientSession } from "mongodb";
import { Transaction } from "../model-service";

export class MongoDbTransaction extends Transaction {
    constructor(private __session: ClientSession) {
        super();
    }

    get session() {
        return this.__session;
    }

    commit(): Promise<void> {
        return this.session.commitTransaction();
    }

    rollback(): Promise<void> {
        return this.session.abortTransaction();
    }

}