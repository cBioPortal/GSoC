import { FunctionComponent } from 'react';
import * as React from 'react';
import { PageUserSession } from 'shared/userSession/PageUserSession';

export type RestoreCLinicalTracksMenuProps = {
    pageUserSession: PageUserSession<any>;
};

export const RestoreClinicalTracksMenu: FunctionComponent<RestoreCLinicalTracksMenuProps> = props => {
    return (
        <div>
            <div className="alert alert-info">
                <button
                    type="button"
                    className="close"
                    onClick={
                        props.pageUserSession
                            .discardUnsavedChangesMadeBeforeLogin
                    }
                >
                    &times;
                </button>
                Your previously saved clinical tracks have been applied.
                <button
                    className="btn btn-primary btn-sm"
                    onClick={
                        props.pageUserSession
                            .discardUnsavedChangesMadeBeforeLogin
                    }
                    style={{ marginLeft: '10px' }}
                >
                    Keep Saved Tracks
                </button>
                <button
                    className="btn btn-primary btn-sm"
                    onClick={
                        props.pageUserSession
                            .restoreUnsavedChangesMadeBeforeLogin
                    }
                    style={{ marginLeft: '10px' }}
                >
                    Revert to Previous Tracks
                </button>
            </div>
        </div>
    );
};
