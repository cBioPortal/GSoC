import * as React from 'react';
import { IStatusProvider } from './IStatusProvider';
import { IUserMessage } from 'shared/components/userMessager/UserMessage';
import {
    fetchUptimeRobotEvents,
    getActiveEvents,
    getEventSeverityColor,
    UptimeRobotEvent,
} from './uptimeRobot';

/**
 * Status provider for UptimeRobot integration.
 * Fetches events from UptimeRobot status page and converts them to banner messages.
 */
export class UptimeRobotStatusProvider implements IStatusProvider {
    async fetchMessages(): Promise<IUserMessage[]> {
        try {
            const eventFeed = await fetchUptimeRobotEvents();
            if (!eventFeed || !eventFeed.results) {
                return [];
            }

            const activeEvents = getActiveEvents(eventFeed.results);
            const statusPageUrl = eventFeed.statusPageUrl;

            return activeEvents.map((event: UptimeRobotEvent) => {
                const endTime = event.endDateGMT
                    ? new Date(event.endDateGMT).getTime()
                    : Date.now() + 24 * 60 * 60 * 1000; // Default to 24 hours from now

                return {
                    id: `uptime-robot-${event.id}`,
                    dateEnd: endTime,
                    content: (
                        <div>
                            <strong>{event.title}</strong>
                            {event.description && (
                                <>
                                    {': '}
                                    {event.description}
                                </>
                            )}
                            {statusPageUrl && (
                                <>
                                    {' '}
                                    <a
                                        href={statusPageUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >
                                        View status page
                                    </a>
                                </>
                            )}
                        </div>
                    ),
                    backgroundColor: getEventSeverityColor(event.icon),
                };
            });
        } catch (error) {
            console.error('Error fetching UptimeRobot messages:', error);
            return [];
        }
    }
}
