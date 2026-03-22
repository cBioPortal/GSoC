import * as React from 'react';
import withContext from 'recompose/withContext';

/**
 * Creates a function which validates that a property of an object is an instance of a specific class.
 * For use with <code>React.Component.contextTypes</code>.
 */
function createValidator<O>(
    classDef: new (...args: any[]) => any
): React.Validator<O> {
    return function validator<T extends object>(
        object: T,
        key: string,
        componentName: string
    ): Error | null {
        if (key in object && object[key as keyof T] instanceof classDef)
            return null;
        return new Error(
            `Expecting ${componentName} to receive {${JSON.stringify(key)}: ${
                classDef.name
            }} from context`
        );
    };
}

/**
 * This can be used as a decorator to make a component provide a <code>store</code> context property to its children.
 * Usage:
 *   <code>
 *   @providesStoreContext(MyStore)
 *   export class MyClass extends React.Component&lt;P, S&gt; { }
 *   </code>
 */
export function providesStoreContext<Store>(
    storeClass: new (..._: any[]) => Store
) {
    return withContext(
        { store: createValidator(storeClass) },
        ({ store }: { store: Store }) => ({ store })
    );
}

/**
 * Extends React.Component by adding a <code>store</code> getter which reads the <code>store</code> context property.
 * Usage: <code>class MyComponent extends ComponentGetsStoreContext(MyStore)<P, S> { }</code>
 */
export function ComponentGetsStoreContext<Store>(
    storeClass: new (..._: any[]) => Store
) {
    return class ComponentGetsStoreContext<P, S> extends React.Component<P, S> {
        static contextTypes = {
            store: createValidator(storeClass),
        };

        get store(): Store {
            return this.context.store;
        }
    };
}
