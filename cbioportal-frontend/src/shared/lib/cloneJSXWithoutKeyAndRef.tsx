import * as React from 'react';

export default function cloneJSXWithoutKeyAndRef(
    jsx: React.ReactChild
): React.ReactChild {
    if (React.isValidElement(jsx)) {
        let element = jsx as React.ReactElement<any>;
        let { children, key, ref, ...rest } = element.props;
        return (
            <element.type {...rest}>
                {React.Children.map(children, cloneJSXWithoutKeyAndRef)}
            </element.type>
        );
    } else {
        return jsx;
    }
}
