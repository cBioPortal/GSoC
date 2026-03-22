import { DefaultTooltip } from 'cbioportal-frontend-commons';
import * as React from 'react';

export type ColumnHeaderProps = {
    headerContent: string | JSX.Element;
    overlay?: JSX.Element;
    className?: string;
};

class ColumnHeader extends React.Component<ColumnHeaderProps> {
    public static defaultProps = {
        className: 'text-wrap',
    };

    public render() {
        let content = this.props.headerContent;

        if (this.props.overlay) {
            content = (
                <DefaultTooltip
                    mouseEnterDelay={0.5}
                    placement="top"
                    overlay={this.props.overlay}
                    destroyTooltipOnHide={true}
                >
                    {content}
                </DefaultTooltip>
            );
        }

        return (
            <span
                className={
                    this.props.className || ColumnHeader.defaultProps.className
                }
            >
                {content}
            </span>
        );
    }
}

export default ColumnHeader;
