import * as React from 'react';
import { observer } from 'mobx-react';
import autobind from 'autobind-decorator';
import {
    IDriverAnnotationControlsHandlers,
    IDriverAnnotationControlsState,
} from '../../alterationFiltering/AnnotationFilteringSettings';
import 'rc-tooltip/assets/bootstrap_white.css';
import _ from 'lodash';
import { computed, makeObservable } from 'mobx';

enum EVENT_KEY {
    distinguishDrivers = '0',
    customDriverBinaryAnnotation = '5',
}

export interface DriverTierControlsProps {
    state: Pick<
        IDriverAnnotationControlsState,
        | 'distinguishDrivers'
        | 'annotateCustomDriverBinary'
        | 'customDriverAnnotationTiers'
        | 'selectedCustomDriverAnnotationTiers'
    >;
    handlers: Pick<
        IDriverAnnotationControlsHandlers,
        | 'onSelectDistinguishDrivers'
        | 'onSelectCustomDriverAnnotationBinary'
        | 'onSelectCustomDriverAnnotationTier'
    >;
}

@observer
export default class DriverTierControls extends React.Component<
    DriverTierControlsProps,
    {}
> {
    constructor(props: Readonly<DriverTierControlsProps>) {
        super(props);
        makeObservable(this);
    }

    @autobind
    private onInputClick(event: React.MouseEvent<HTMLInputElement>) {
        switch ((event.target as HTMLInputElement).value) {
            case EVENT_KEY.distinguishDrivers:
                this.props.handlers.onSelectDistinguishDrivers(
                    !this.props.state.distinguishDrivers
                );
                break;
            case EVENT_KEY.customDriverBinaryAnnotation:
                this.props.handlers.onSelectCustomDriverAnnotationBinary &&
                    this.props.handlers.onSelectCustomDriverAnnotationBinary(
                        !this.props.state.annotateCustomDriverBinary
                    );
                break;
        }
    }

    @autobind
    private onCustomDriverTierCheckboxClick(
        event: React.MouseEvent<HTMLInputElement>
    ) {
        this.props.handlers.onSelectCustomDriverAnnotationTier &&
            this.props.handlers.onSelectCustomDriverAnnotationTier(
                (event.target as HTMLInputElement).value,
                !(
                    this.props.state.selectedCustomDriverAnnotationTiers &&
                    this.props.state.selectedCustomDriverAnnotationTiers.get(
                        (event.target as HTMLInputElement).value
                    )
                )
            );
    }

    @computed get tiers() {
        return _.filter(
            this.props.state.customDriverAnnotationTiers || [],
            t => t.toLowerCase() !== 'unknown'
        );
    }

    render() {
        return (
            <div>
                {this.tiers.map(tier => (
                    <div className="checkbox">
                        <label>
                            <input
                                type="checkbox"
                                data-test={tier.replace(' ', '_')}
                                value={tier}
                                checked={
                                    !!(
                                        this.props.state
                                            .selectedCustomDriverAnnotationTiers &&
                                        this.props.state.selectedCustomDriverAnnotationTiers.get(
                                            tier
                                        )
                                    )
                                }
                                onClick={this.onCustomDriverTierCheckboxClick}
                            />{' '}
                            {tier}
                        </label>
                    </div>
                ))}
            </div>
        );
    }
}
