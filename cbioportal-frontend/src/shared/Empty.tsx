import * as React from 'react';

export class Timeline extends React.Component<any, {}> {
    componentDidMount() {
        this.props.onLoad();
    }

    render() {
        return (
            <div style={{ background: 'blue', padding: 20, color: 'white' }}>
                This is dummy content to replace twitter feed.
            </div>
        );
    }
}
