import * as React from 'react';
import { observer } from 'mobx-react';

@observer
export default class OncoprintDropdownCount extends React.Component<
    { count: number | undefined },
    {}
> {
    render() {
        if (this.props.count === undefined) {
            return null;
        }
        return (
            <span className="oncoprintDropdownCount">{this.props.count}</span>
        );
    }
}
