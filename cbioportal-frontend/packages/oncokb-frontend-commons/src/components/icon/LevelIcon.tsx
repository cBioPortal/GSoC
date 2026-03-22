import Tooltip from 'rc-tooltip';
import * as React from 'react';
import { levelIconClassNames } from '../../util/OncoKbUtils';
import OncoKbHelper from '../OncoKbHelper';

const levelTooltipContent = (level: string) => {
    return (
        <div style={{ maxWidth: '200px' }}>
            {OncoKbHelper.LEVEL_DESC[level]}
        </div>
    );
};

const LevelIcon: React.FunctionComponent<{
    level: string;
    showDescription?: boolean;
}> = props => {
    return (
        <Tooltip
            overlay={levelTooltipContent(props.level)}
            placement="left"
            trigger={['hover', 'focus']}
            destroyTooltipOnHide={true}
        >
            <i className={levelIconClassNames(props.level)} />
        </Tooltip>
    );
};

export default LevelIcon;
