export type ClassType = (Function | Object) & { name: string; };

export type ClassConstructor<T> = ClassType & { new(...args: any): T; };
