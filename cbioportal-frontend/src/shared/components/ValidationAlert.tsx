import * as React from 'react';

export interface IValidationAlertProps {
    urlValidationError: string;
}

export default class ValidationAlert extends React.Component<
    IValidationAlertProps,
    {}
> {
    public render() {
        return (
            <div className="alert alert-danger urlError" role="alert">
                <i className="fa fa-warning" aria-hidden="true"></i>
                <h3>The URL is invalid</h3>
                <ul>
                    {this.props.urlValidationError
                        .split('.')
                        .map((message: string) =>
                            message.length > 0 ? <li>{message}</li> : null
                        )}
                </ul>
            </div>
        );
    }
}
