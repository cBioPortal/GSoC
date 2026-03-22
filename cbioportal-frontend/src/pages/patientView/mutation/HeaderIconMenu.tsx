import React from 'react';
import { DefaultTooltip } from 'cbioportal-frontend-commons';
import Tooltip from 'rc-tooltip';
import { JsxElement } from 'typescript';
import './style.scss';

export interface IHeaderIconMenuProps {
    name: string;
    showIcon?: boolean;
    suppressClickBubble?: boolean;
}

export default class HeaderIconMenu extends React.Component<
    IHeaderIconMenuProps,
    {}
> {
    public static defaultProps = {
        suppressClickBubble: true,
        showIcon: true,
    };

    constructor(props: IHeaderIconMenuProps) {
        super(props);
    }

    // when configured suppress the bubbling of the mouse event to the parent
    iconClicked = (e: React.MouseEvent) => {
        if (this.props.suppressClickBubble) e.stopPropagation();
    };

    render() {
        return (
            <React.Fragment>
                <span style={{ marginRight: '5px' }}>{this.props.name}</span>
                {this.props.showIcon && (
                    <Tooltip trigger={['click']} overlay={this.props.children}>
                        <i
                            className="fa fa-filter"
                            onClick={this.iconClicked}
                            data-test="gene-filter-icon"
                        />
                    </Tooltip>
                )}
            </React.Fragment>
        );
    }
}
