import * as React from 'react';
import { observer } from 'mobx-react';
import { getServerConfig } from 'config/config';

export interface IErrorMessageProps {
    message?: string;
    disableDefaultContactMessage?: boolean;
}

@observer
export default class ErrorMessage extends React.Component<
    IErrorMessageProps,
    {}
> {
    static defaultProps = {
        message: 'Error encountered.',
    };

    defaultContactMessage() {
        return (
            <>
                Please let us know about this error and how you got here at{' '}
                <b style={{ whiteSpace: 'nowrap' }}>
                    <a href={`mailto:${getServerConfig().skin_email_contact}`}>
                        {getServerConfig().skin_email_contact}
                    </a>
                </b>
            </>
        );
    }

    render() {
        return (
            <span>
                <i
                    className="fa fa-md fa-exclamation-triangle"
                    style={{
                        color: '#BB1700',
                        cursor: 'pointer',
                        marginRight: 7,
                    }}
                />
                {this.props.message!}{' '}
                {!this.props.disableDefaultContactMessage &&
                    this.defaultContactMessage()}
            </span>
        );
    }
}
