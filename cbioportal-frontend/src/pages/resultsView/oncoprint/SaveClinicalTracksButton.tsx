import * as React from 'react';
import { ResultsViewPageStore } from 'pages/resultsView/ResultsViewPageStore';
import { observer } from 'mobx-react';
import { DefaultTooltip } from 'cbioportal-frontend-commons';
import { getServerConfig } from 'config/config';
import { isConfigured } from 'shared/userSession/PageUserSession';

type SaveClinicalTracksButtonProps = {
    store: ResultsViewPageStore;

    // User is logged in:
    isLoggedIn: boolean;

    // Clinical tracks have changed
    isDirty: boolean;
};

@observer
export default class SaveClinicalTracksButton extends React.Component<
    SaveClinicalTracksButtonProps
> {
    constructor(props: SaveClinicalTracksButtonProps) {
        super(props);
    }

    render() {
        const enabled =
            this.props.isDirty &&
            this.props.isLoggedIn &&
            !this.isDefaultState();
        return (
            <>
                <DefaultTooltip
                    overlay={createTooltipMsg(
                        this.props.isLoggedIn,
                        this.props.isDirty,
                        this.isDefaultState()
                    )}
                >
                    <button
                        id="save-oncoprint-config-to-session"
                        style={{
                            width: 'fit-content',
                            position: 'relative',
                            zIndex: 2,
                        }}
                        className={`btn btn-primary btn-xs pull-right ${
                            enabled ? '' : 'disabled'
                        }`}
                        onClick={() => {
                            this.props.store.pageUserSession.saveUserSession();
                        }}
                    >
                        <i
                            className={`fa ${
                                this.isDefaultState() || this.props.isDirty
                                    ? 'fa-thumb-tack'
                                    : 'fa-check-square'
                            }`}
                            aria-hidden="true"
                        />{' '}
                        {this.isDefaultState() || this.props.isDirty
                            ? 'Save tracks'
                            : 'Tracks saved'}
                    </button>
                </DefaultTooltip>
            </>
        );
    }

    /**
     * Are user settings equal to configured defaults?
     */
    private isDefaultState() {
        const sameConfig =
            JSON.stringify(this.props.store.pageUserSession.userSettings) ===
            getServerConfig().oncoprint_clinical_tracks_config_json;
        const bothEmpty =
            !isConfigured(this.props.store.pageUserSession.userSettings) &&
            !isConfigured(
                getServerConfig().oncoprint_clinical_tracks_config_json
            );
        return sameConfig || bothEmpty;
    }
}

function createTooltipMsg(
    isLoggedIn: boolean,
    isDirty: boolean,
    defaultState: boolean
) {
    let msg = '';
    if (defaultState || (isLoggedIn && isDirty)) {
        msg = 'Save clinical tracks.';
    } else if (isLoggedIn && !isDirty) {
        msg = 'All changes saved.';
    } else if (!isLoggedIn) {
        msg = 'Log in to save clinical tracks.';
    }
    return `${msg} The currently visible clinical tracks will be shown by default for future queries in the same study/studies.`;
}
