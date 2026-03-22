import * as React from 'react';
import { observer } from 'mobx-react';

@observer
export default class UnknownStudiesWarning extends React.Component<
    { ids: String[] },
    {}
> {
    render() {
        if (this.props.ids.length > 0) {
            return (
                <div
                    className="alert alert-danger"
                    data-test="unkown-study-warning"
                    style={{ marginBottom: 0 }}
                >
                    <i className="fa fa-exclamation-triangle"></i> The following
                    studies do not exist or you do not have access to them:
                    <ul style={{ margin: '10px 0' }}>
                        {this.props.ids.map(id => (
                            <li>{id}</li>
                        ))}
                    </ul>
                    Please resubmit your query below.
                </div>
            );
        } else {
            return null;
        }
    }
}
