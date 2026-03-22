import * as React from 'react';
import { observer } from 'mobx-react';
import { If, Else, Then } from 'react-if';
import TextTruncate from 'react-text-truncate';
import { observable, makeObservable } from 'mobx';

export interface ITextExpanderProps {
    text?: string | JSX.Element | null;
    line?: number;
    expandIndicator?: string | JSX.Element;
    collapseIndicator?: string | JSX.Element;
    truncateText?: string;
}

@observer
export default class TextExpander extends React.Component<
    ITextExpanderProps,
    {}
> {
    @observable protected isTextTruncated: boolean = true;

    public static defaultProps = {
        line: 1,
        expandIndicator: '[...]',
        collapseIndicator: '[^]',
        truncateText: ' ',
    };

    constructor(props: ITextExpanderProps) {
        super(props);

        makeObservable(this);

        this.toggleText = this.toggleText.bind(this);
    }

    public render() {
        let content = this.props.text;

        // TextTruncate can only handle "string", otherwise we get a warning message
        // If "text" is not string we just display it as is
        if (typeof this.props.text === 'string') {
            content = (
                <TextTruncate
                    text={this.props.text}
                    line={this.props.line}
                    truncateText={this.props.truncateText}
                    textTruncateChild={
                        <a
                            onClick={this.toggleText}
                            style={{ cursor: 'pointer' }}
                        >
                            {this.props.expandIndicator}
                        </a>
                    }
                />
            );
        }

        return (
            <If condition={this.isTextTruncated}>
                <Then>{content}</Then>
                <Else>
                    <span>
                        <span>{this.props.text} </span>
                        <span>
                            <a
                                onClick={this.toggleText}
                                style={{ cursor: 'pointer' }}
                            >
                                {this.props.collapseIndicator}
                            </a>
                        </span>
                    </span>
                </Else>
            </If>
        );
    }

    private toggleText() {
        this.isTextTruncated = !this.isTextTruncated;
    }
}
