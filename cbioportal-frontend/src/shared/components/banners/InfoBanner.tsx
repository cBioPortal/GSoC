import * as React from 'react';
import { observer } from 'mobx-react';

export interface IInfoBannerProps {
    message: string;
    hidden: boolean;
    hide: () => void;
    style?: any;
}

@observer
export default class InfoBanner extends React.Component<IInfoBannerProps, {}> {
    render() {
        return (
            <div
                className="alert alert-info"
                style={Object.assign(
                    { marginTop: '10px', marginBottom: '0' },
                    this.props.style
                )}
            >
                <span>
                    <i className="fa fa-md fa-info-circle" />{' '}
                    {this.props.message}
                </span>
                {!this.props.hidden && (
                    <button
                        className="btn btn-sm btn-default"
                        style={{ marginLeft: 7 }}
                        onClick={this.props.hide}
                    >
                        Hide
                    </button>
                )}
            </div>
        );
    }
}
