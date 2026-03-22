import * as React from 'react';
import { observer } from 'mobx-react';
import autobind from 'autobind-decorator';

interface IHoverablePointProps {
    onMouseOver: (datum: any, x: number, y: number) => void;
    onMouseOut: () => void;
    fill: (datum: any) => string;
    // all optional props given by victory
    datum?: any;
    style?: any;
    x?: number;
    y?: number;
}

export default class HoverablePoint extends React.Component<
    IHoverablePointProps,
    {}
> {
    @autobind private onMouseOver(e: any) {
        e.target.setAttribute('r', 10);
        this.props.onMouseOver(this.props.datum, this.props.x!, this.props.y!);
    }

    @autobind private onMouseOut(e: any) {
        e.target.setAttribute('r', 3);
        this.props.onMouseOut();
    }

    render() {
        return (
            <circle
                cx={this.props.x}
                cy={this.props.y}
                r="3"
                onMouseOver={this.onMouseOver}
                onMouseOut={this.onMouseOut}
                style={Object.assign({}, this.props.style, {
                    fill: this.props.fill(this.props.datum),
                })}
            />
        );
    }
}
