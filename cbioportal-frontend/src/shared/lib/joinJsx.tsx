import * as React from 'react';

export default function joinJsx(list: JSX.Element[], delimiter: JSX.Element) {
    const elements: JSX.Element[] = [];
    list.forEach((element, index) => {
        elements.push(element);
        if (index < list.length - 1) {
            elements.push(delimiter);
        }
    });
    return <>{elements}</>;
}
