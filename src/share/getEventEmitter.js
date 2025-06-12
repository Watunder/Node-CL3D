import { isNode } from '../utils/environment.js';

/**
 * @returns {import('events').EventEmitter}
 */
let getEventEmitterImpl = () => { return; }

if (isNode) {
    import('events').then((module) => {
        const eventEmitter = new module.EventEmitter();
        eventEmitter.on('error', (err) => {
            console.error(err);
        });

        getEventEmitterImpl = () => {
            return eventEmitter;
        }
    });
}

export const getEventEmitter = () => {
    return getEventEmitterImpl();
}