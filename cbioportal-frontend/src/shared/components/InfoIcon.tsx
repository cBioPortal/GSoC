import * as React from 'react';
import { DefaultTooltip } from 'cbioportal-frontend-commons';

export interface IInfoIconProps {
    tooltip: JSX.Element;
    tooltipPlacement?: string;
    style?: any;
    divStyle?: any;
}

export default class InfoIcon extends React.Component<IInfoIconProps, {}> {
    render() {
        return (
            <DefaultTooltip
                overlay={this.props.tooltip}
                placement={this.props.tooltipPlacement || 'right'}
            >
                <div style={this.props.divStyle}>
                    <i
                        className="fa fa-info-circle"
                        style={Object.assign(
                            {},
                            {
                                color: '#000000',
                                cursor: 'pointer',
                            },
                            this.props.style || {}
                        )}
                        data-test="infoIcon"
                    />
                </div>
            </DefaultTooltip>
        );
    }
}
