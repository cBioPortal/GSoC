import * as React from 'react';
import { DefaultTooltip } from 'cbioportal-frontend-commons';

export interface IErrorIconProps {
    tooltip: JSX.Element;
    style?: any;
}

export default class ErrorIcon extends React.Component<IErrorIconProps, {}> {
    render() {
        return (
            <DefaultTooltip overlay={this.props.tooltip}>
                <i
                    className="fa fa-md fa-exclamation-triangle"
                    style={Object.assign(
                        {},
                        {
                            color: '#BB1700',
                            cursor: 'pointer',
                        },
                        this.props.style || {}
                    )}
                />
            </DefaultTooltip>
        );
    }
}
