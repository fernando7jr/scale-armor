'use strict';

const { createHook } = require('async_hooks');
const { stackTraceFilter } = require('mocha/lib/utils');
const allResources = new Map();

// this will pull Mocha internals out of the stacks
const filterStack = stackTraceFilter();

const hook = createHook({
    init(asyncId, type, triggerAsyncId) {
        allResources.set(asyncId, { type, triggerAsyncId, stack: (new Error()).stack });
    },
    destroy(asyncId) {
        allResources.delete(asyncId);
    }
}).enable();

global.asyncDump = module.exports = () => {
    hook.disable();
    if (allResources.size > 0) {
        console.error('Unresolved Promises', allResources.size);
    }
    allResources.forEach(value => {
        console.error(`\nType: ${value.type}`);
        console.error(filterStack(value.stack));
        console.error('\n');
    });
};
