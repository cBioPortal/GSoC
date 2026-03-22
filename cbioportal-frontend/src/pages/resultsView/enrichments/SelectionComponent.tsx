import * as React from 'react';

interface ISelectionComponentProps {
    onRender: () => void;
    // rest supplied by victory
    x?: number;
    y?: number;
    width?: number;
    height?: number;
    style?: any;
}

export default class SelectionComponent extends React.Component<
    ISelectionComponentProps,
    {}
> {
    render() {
        const { onRender, ...props } = this.props;
        if (props.width! > 5 || props.height! > 5) {
            onRender();
        }
        return <rect {...props} />;
    }
}
