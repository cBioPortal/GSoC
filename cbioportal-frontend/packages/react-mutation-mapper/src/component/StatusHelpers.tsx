import { DefaultTooltip } from 'cbioportal-frontend-commons';
import classNames from 'classnames';
import * as React from 'react';

import annotationStyles from './column/annotation.module.scss';

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
        <DefaultTooltip
            overlay={<span>{errorMessage}</span>}
            placement="right"
            trigger={['hover', 'focus']}
            destroyTooltipOnHide={true}
        >
            <span className={`${annotationStyles['annotation-item-error']}`}>
                <i className="fa fa-exclamation-triangle text-danger" />
            </span>
        </DefaultTooltip>
    );
}
