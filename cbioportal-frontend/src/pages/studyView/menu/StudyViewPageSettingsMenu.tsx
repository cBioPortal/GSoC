import {
    STUDY_VIEW_FILTER_AUTOSUBMIT,
    StudyViewPageStore,
} from 'pages/studyView/StudyViewPageStore';
import * as React from 'react';
import _ from 'lodash';
import { computed, makeObservable, observable, runInAction } from 'mobx';
import classNames from 'classnames';
import styles from 'pages/studyView/styles.module.scss';
import { DefaultTooltip } from 'cbioportal-frontend-commons';
import { observer } from 'mobx-react';
import { AutosubmitToggle } from 'pages/studyView/menu/AutosubmitToggle';

export interface IStudyViewPageSettingsMenuProps {
    store: StudyViewPageStore;
}

@observer
export default class StudyViewPageSettingsMenu extends React.Component<
    IStudyViewPageSettingsMenuProps,
    {}
> {
    constructor(props: Readonly<IStudyViewPageSettingsMenuProps>) {
        super(props);
        makeObservable(this);
    }

    @observable visible = false;

    @computed get menu() {
        return (
            <div>
                <AutosubmitToggle
                    onChange={isManualModeOn => {
                        runInAction(() => {
                            localStorage.setItem(
                                STUDY_VIEW_FILTER_AUTOSUBMIT,
                                '' + isManualModeOn
                            );

                            if (
                                !isManualModeOn &&
                                !_.isEmpty(this.props.store.hesitantPillStore)
                            ) {
                                this.props.store.submitQueuedFilterUpdates();
                            }
                            this.props.store.hesitateUpdate = isManualModeOn;
                        });
                    }}
                    hesitateModeOn={this.props.store.hesitateUpdate}
                />
            </div>
        );
    }

    render() {
        return (
            <div className={classNames(styles.studyViewPageGearMenu)}>
                <DefaultTooltip
                    trigger={'click'}
                    placement="bottom"
                    overlay={this.menu}
                    visible={this.visible}
                    onVisibleChange={visible => {
                        this.visible = !!visible;
                    }}
                >
                    <button
                        className={classNames('btn', 'btn-sm', 'btn-primary', {
                            active: this.visible,
                        })}
                        data-test="study-view-settings-menu"
                        aria-label="Show Settings Menu"
                    >
                        <i className="fa fa-cog" />
                    </button>
                </DefaultTooltip>
            </div>
        );
    }
}
