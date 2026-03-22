import * as React from 'react';
import { ThreeBounce } from 'better-react-spinkit';
import { If, Else } from 'react-if';
import { CSSProperties, DetailedHTMLProps } from 'react';
import LoadingIndicator from '../loadingIndicator/LoadingIndicator';

export interface IFeatureTitleProps {
    isLoading: boolean;
    title: string;
    className?: string;
    style?: CSSProperties;
    isHidden?: boolean;
}

const style: CSSProperties = {
    marginTop: 0,
};

export default class FeatureTitle extends React.Component<
    IFeatureTitleProps,
    {}
> {
    public render() {
        return (
            <If condition={this.props.isHidden}>
                <Else>
                    <h2
                        style={this.props.style || style}
                        className={this.props.className || ''}
                    >
                        {this.props.title}
                        <LoadingIndicator
                            isLoading={this.props.isLoading}
                            small={true}
                        />
                    </h2>
                </Else>
            </If>
        );
    }
}
