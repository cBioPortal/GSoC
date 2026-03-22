import * as React from 'react';
import { DefaultTooltip } from 'cbioportal-frontend-commons';

export interface ICategoricalColumn {
    displayValue?: string;
    toolTip?: string;
    className: string;
}

export function createToolTip(content: JSX.Element, toolTip: string) {
    content = (
        <DefaultTooltip overlay={<span>{toolTip}</span>} placement="left">
            {content}
        </DefaultTooltip>
    );
    return content;
}
