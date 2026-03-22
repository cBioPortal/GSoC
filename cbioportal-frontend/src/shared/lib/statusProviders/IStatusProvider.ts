import { IUserMessage } from 'shared/components/userMessager/UserMessage';

/**
 * Interface for status page integrations.
 * Each status provider (UptimeRobot, StatusPage.io, etc.) implements this interface
 * to provide status messages that will be displayed as banners.
 */
export interface IStatusProvider {
    /**
     * Fetches active status messages from the provider.
     * @returns Promise resolving to an array of user messages
     */
    fetchMessages(): Promise<IUserMessage[]>;
}
