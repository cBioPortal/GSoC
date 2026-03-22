import Tooltip from 'rc-tooltip';
import classNames from 'classnames';
import * as React from 'react';

import annotationStyles from './annotation.module.scss';

export function loaderIcon(className?: string) {
    return (
        <span
            className={classNames(
                `${annotationStyles['annotation-item']}`,
                `${annotationStyles['annotation-item-load']}`,
                className
            )}
        >
            <i className="fa fa-spinner fa-pulse" />
        </span>
    );
}

export function errorIcon(errorMessage: string) {
    return (
        <Tooltip
            overlay={<span>{errorMessage}</span>}
            placement="right"
            trigger={['hover', 'focus']}
            destroyTooltipOnHide={true}
        >
            <span className={`${annotationStyles['annotation-item-error']}`}>
                <i className="fa fa-exclamation-triangle text-danger" />
            </span>
        </Tooltip>
    );
}
