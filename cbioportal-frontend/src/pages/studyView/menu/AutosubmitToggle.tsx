import { observer } from 'mobx-react';
import * as React from 'react';
import classNames from 'classnames';
import styles from 'pages/studyView/styles.module.scss';
import Tooltip from 'rc-tooltip';

import autobind from 'autobind-decorator';
export type IAutosubmitToggleProps = {
    hesitateModeOn: boolean;
    onChange: (manual: boolean) => void;
};

@observer
export class AutosubmitToggle extends React.Component<
    IAutosubmitToggleProps,
    {}
> {
    @autobind
    public handleChange(e: React.ChangeEvent<HTMLInputElement>) {
        const hesitateMode = e.target.value === 'manual';
        this.props.onChange(hesitateMode);
    }

    render() {
        return (
            <div className={classNames(styles.autosubmitToggle)}>
                <h5>
                    Submitting filters{' '}
                    <Tooltip
                        placement="top"
                        overlayStyle={{
                            maxWidth: 400,
                        }}
                        overlay="Disabling autosubmit is a beta feature still under evaluation"
                    >
                        <i
                            className={classNames(
                                'fa fa-info-circle',
                                styles.hesitateControlsAlign
                            )}
                        />
                    </Tooltip>
                </h5>
                <div className="btn-group">
                    <label>
                        <input
                            onChange={this.handleChange}
                            defaultChecked={!this.props.hesitateModeOn}
                            type="radio"
                            value={'auto'}
                            name={'hesitateMode'}
                        />{' '}
                        Autosubmit
                    </label>
                    <label>
                        <input
                            onChange={this.handleChange}
                            defaultChecked={this.props.hesitateModeOn}
                            type="radio"
                            value={'manual'}
                            name={'hesitateMode'}
                        />{' '}
                        Manually submit
                    </label>
                </div>
            </div>
        );
    }
}
