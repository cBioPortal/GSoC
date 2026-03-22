import * as React from 'react';
import Tooltip from 'rc-tooltip';
import { oncogenicityIconClassNames } from '../../util/OncoKbUtils';

const OncogenicIcon: React.FunctionComponent<{
    oncogenicity: string;
    showDescription?: boolean;
}> = props => {
    return (
        <Tooltip
            overlay={<span>{props.oncogenicity}</span>}
            placement="left"
            trigger={['hover', 'focus']}
            destroyTooltipOnHide={true}
        >
            <i className={oncogenicityIconClassNames(props.oncogenicity)} />
        </Tooltip>
    );
};

export default OncogenicIcon;
