import { PageSettingsData } from 'shared/api/session-service/sessionServiceModels';
import { PageSettingsIdentifier } from 'shared/userSession/PageSettingsIdentifier';

export interface IPageUserSession<T extends PageSettingsData> {
    /**
     * Changes exist between local and remote userSettings
     */
    isDirty: boolean;

    id: PageSettingsIdentifier;

    userSettings: T | undefined;

    /**
     * Update remote user session with local changes
     */
    saveUserSession: () => void;

    /**
     * The session service must be running
     * to be able to store to the user session
     */
    readonly isSessionServiceEnabled: boolean;

    /**
     * The user must be logged in
     * to be able to store to the user session
     */
    readonly isLoggedIn: boolean;

    /**
     * A user that is logged out, can make changes.
     * When logging in again, there might be differences between
     * the unsaved changes made before logging in and the saved changes.
     */
    readonly hasUnsavedChangesFromBeforeLogin: boolean;

    /**
     * Replace user settings with the changes made before logging in
     */
    restoreUnsavedChangesMadeBeforeLogin: () => Promise<void>;

    /**
     * Discard changes made before logging in
     */
    discardUnsavedChangesMadeBeforeLogin: () => void;
}
