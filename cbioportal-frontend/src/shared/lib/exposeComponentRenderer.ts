import * as React from 'react';
import * as ReactDOM from 'react-dom';

export default function(
    name: string,
    Comp: React.ComponentClass<any> | React.StatelessComponent<any>,
    props: any = {}
) {
    const win = window as any;

    if (win) {
        win[name] = (
            mountNode: HTMLElement,
            props: { [k: string]: string | boolean | number }
        ): void => {
            let el = React.createElement(Comp as any, props);

            ReactDOM.render(el, mountNode);
        };
    }
}
