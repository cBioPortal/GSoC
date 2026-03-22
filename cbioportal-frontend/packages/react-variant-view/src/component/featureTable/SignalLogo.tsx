import { DefaultTooltip } from 'cbioportal-frontend-commons';
import * as React from 'react';

export const signalLogoInTable = (
    <DefaultTooltip
        placement="top"
        overlay={
            <span>
                Data comes from SIGNAL{' '}
                <i className="fa fa-arrow-up" style={{ color: '#FF9900' }} />
            </span>
        }
    >
        <i
            className="fa fa-arrow-up"
            style={{
                color: '#FF9900',
                marginBottom: 'auto',
                marginTop: 'auto',
            }}
        />
    </DefaultTooltip>
);
