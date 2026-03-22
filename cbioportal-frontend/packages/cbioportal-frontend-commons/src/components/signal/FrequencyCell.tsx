import { observer } from 'mobx-react';
import Tooltip from 'rc-tooltip';
import * as React from 'react';

import 'rc-tooltip/assets/bootstrap_white.css';
import { formatFrequencyValue } from 'cbioportal-utils';

interface IFrequencyCellProps {
    frequency: number | null;
    overlay?: () => JSX.Element;
    style?: React.CSSProperties;
}

@observer
export default class FrequencyCell extends React.Component<
    IFrequencyCellProps
> {
    public render() {
        let content = this.mainContent();

        if (this.props.overlay) {
            content = (
                <Tooltip
                    mouseEnterDelay={0.5}
                    arrowContent={<div className="rc-tooltip-arrow-inner" />}
                    placement="right"
                    overlay={this.props.overlay}
                    destroyTooltipOnHide={true}
                >
                    {content}
                </Tooltip>
            );
        }

        return content;
    }

    private mainContent(): JSX.Element {
        return (
            <span className="pull-right mr-1" style={this.props.style}>
                {formatFrequencyValue(this.props.frequency)}
            </span>
        );
    }
}
