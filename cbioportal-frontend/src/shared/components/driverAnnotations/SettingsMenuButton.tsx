import { DefaultTooltip, setArrowLeft } from 'cbioportal-frontend-commons';
import * as React from 'react';
import {
    IDriverSettingsProps,
    IExclusionSettings,
} from 'shared/alterationFiltering/AnnotationFilteringSettings';
import { observer } from 'mobx-react';
import { action, computed, makeObservable, observable } from 'mobx';
import InfoIcon from '../InfoIcon';
import { BoldedSpanList } from 'pages/resultsView/ResultsViewPageHelpers';
import SettingsMenu from 'shared/alterationFiltering/SettingsMenu';

export interface SettingsButtonProps {
    store: IDriverSettingsProps &
        IExclusionSettings &
        ISettingsMenuButtonVisible;
    disableInfoIcon?: boolean;
    showOnckbAnnotationControls?: boolean;
    showFilterControls?: boolean;
    showExcludeUnprofiledSamplesControl: boolean;
    disabled?: boolean;
    inFilterPanel?: boolean;
}

export interface ISettingsMenuButtonVisible {
    isSettingsMenuVisible?: boolean;
}

@observer
export default class SettingsMenuButton extends React.Component<
    SettingsButtonProps,
    {}
> {
    constructor(props: Readonly<SettingsButtonProps>) {
        super(props);
        makeObservable(this);
    }

    @observable visible = false;

    // determine whether visibility is controlled
    // by a store component or by local state
    @computed get visibilityState() {
        if (this.props.store.isSettingsMenuVisible !== undefined)
            return this.props.store.isSettingsMenuVisible;
        return this.visible;
    }

    @action
    private setVisibilityState(visible: boolean | undefined) {
        if (visible !== undefined) {
            if (this.props.store.isSettingsMenuVisible !== undefined)
                this.props.store.isSettingsMenuVisible = !!visible;
            else this.visible = !!visible;
        }
    }

    @computed get annotationTitleComponent() {
        return (
            <>
                <h5 style={{ marginTop: 'auto', marginBottom: 'auto' }}>
                    Annotate Data
                </h5>
                {!this.props.disableInfoIcon && (
                    <InfoIcon
                        divStyle={{ display: 'inline-block', marginLeft: 6 }}
                        style={{ color: 'rgb(54, 134, 194)' }}
                        tooltip={
                            <span>
                                This section defines which sources are
                                considered to annotate driver variants in your
                                data. Putative driver vs VUS setings apply to
                                every tab except{' '}
                                <BoldedSpanList
                                    words={['Co-expression', 'CN Segments']}
                                />
                            </span>
                        }
                    />
                )}
            </>
        );
    }

    @computed get overlay() {
        return (
            <SettingsMenu
                store={this.props.store}
                annotationTitleComponent={this.annotationTitleComponent}
                showOnckbAnnotationControls={
                    this.props.showOnckbAnnotationControls
                }
                showFilterControls={this.props.showFilterControls}
                showExcludeUnprofiledSamplesControl={
                    this.props.showExcludeUnprofiledSamplesControl
                }
                disabled={this.props.disabled}
            />
        );
    }

    @computed get trigger() {
        if (this.props.disabled) {
            return 'hover';
        } else {
            return 'click';
        }
    }

    render() {
        if (this.props.inFilterPanel) {
            return (
                <DefaultTooltip
                    trigger={'click'}
                    placement="top"
                    overlay={this.overlay}
                    visible={this.visibilityState}
                    onVisibleChange={visible => {
                        this.setVisibilityState(visible);
                    }}
                >
                    <button
                        data-test="GlobalSettingsButton"
                        style={{
                            marginLeft: 5,
                            marginRight: 5,
                            padding: '0px 4px 0px 4px',
                            height: 18,
                        }}
                        className="btn btn-primary"
                        aria-label="Slider Button"
                    >
                        <i
                            className="fa fa-sliders"
                            style={{
                                fontSize: 12,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}
                        />
                    </button>
                </DefaultTooltip>
            );
        } else {
            return (
                <DefaultTooltip
                    trigger={[this.trigger]}
                    placement="bottomRight"
                    overlay={this.overlay}
                    visible={this.visibilityState}
                    onVisibleChange={visible => {
                        this.setVisibilityState(visible);
                    }}
                    onPopupAlign={tooltipEl => setArrowLeft(tooltipEl, '22px')}
                >
                    <button
                        data-test="GlobalSettingsButton"
                        style={{
                            marginRight: 0,
                            marginLeft: 5,
                        }}
                        className="btn btn-primary"
                        aria-label="Slider Button"
                    >
                        <i className="fa fa-sliders fa-lg" />
                    </button>
                </DefaultTooltip>
            );
        }
    }
}
