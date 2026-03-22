import SpyInstance = jest.SpyInstance;

import { restoreRouteAfterRedirect } from './redirectHelpers';

describe('restoreRouteAfterRedirect', () => {
    let getItemStub: SpyInstance;
    let removeItemStub: SpyInstance;
    let stores: any;

    beforeEach(() => {
        stores = {
            routing: {
                query: {
                    key: 'mooo',
                },
                push: jest.fn(),
                updateRoute: () => {},
            },
        };

        // mocking window.localStorage doesn't work, we need to mock the global Storage.prototype instead
        // see https://github.com/facebook/jest/issues/6858
        getItemStub = jest.spyOn(Storage.prototype, 'getItem');
        removeItemStub = jest.spyOn(Storage.prototype, 'removeItem');
    });

    afterEach(() => {
        getItemStub.mockRestore();
        removeItemStub.mockRestore();
    });

    it('calls getItem with appropriate key', () => {
        restoreRouteAfterRedirect(stores as any);
        expect(getItemStub).toBeCalledTimes(1);
        expect(getItemStub).toBeCalledWith('mooo');
    });

    it('if no key is available, we redirect to root route', () => {
        getItemStub.mockImplementation(() => undefined);
        restoreRouteAfterRedirect(stores as any);
        expect(stores.routing.push).toBeCalledWith('/');
        expect(removeItemStub).not.toBeCalled();
    });

    it('if key is available, we redirect to it, sans #, delete key', () => {
        getItemStub.mockImplementation(() => '#one/two');
        restoreRouteAfterRedirect(stores as any);
        expect(removeItemStub).toBeCalledTimes(1);
        expect(stores.routing.push).toBeCalledWith('one/two');
    });
});

// const key = injected.routing.location.query.key;
// let restoreRoute = window.localStorage.getItem(key);
// if (restoreRoute) {
//     restoreRoute = restoreRoute.replace(/^#/, '');
//     window.localStorage.removeItem(key);
//     injected.routing.push(restoreRoute);
//     return null;
// } else {
//     injected.routing.push('/');
// }
