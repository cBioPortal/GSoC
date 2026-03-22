import * as React from 'react';
import { observer } from 'mobx-react';

export type GeneSymbolValidationErrorProps = {
    sampleCount: number;
    queryProductLimit: number;
    email: string;
};

@observer
export default class GeneSymbolValidationError extends React.Component<
    GeneSymbolValidationErrorProps,
    {}
> {
    render() {
        return (
            <span>
                Queries are limited by gene and sample count. The product of the
                query's gene and sample count must be less than{' '}
                {this.props.queryProductLimit.toLocaleString()}. You have
                selected {this.props.sampleCount.toLocaleString()} samples, so
                you can have no more than{' '}
                {Math.floor(
                    this.props.queryProductLimit / this.props.sampleCount
                ).toLocaleString()}{' '}
                genes in your query. Please{' '}
                <a
                    style={{ color: '#ccc' }}
                    href={`mailto:${this.props.email}`}
                >
                    let us know
                </a>{' '}
                your use case(s) if you need to query more than that.
            </span>
        );
    }
}
