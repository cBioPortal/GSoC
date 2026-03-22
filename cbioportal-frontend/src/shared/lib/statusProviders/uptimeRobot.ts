import { getServerConfig } from 'config/config';

export interface UptimeRobotEvent {
    type: 'announcement' | 'update';
    eventType: string;
    id: number;
    title: string;
    content: string;
    description: string;
    date: string;
    time: string;
    timeGMT: string;
    endDate?: string;
    endDateGMT?: string;
    timestamp: number;
    status: number; // 1 = resolved, 2 = active/ongoing
    icon: string;
}

export interface UptimeRobotEventFeedResponse {
    status: boolean;
    results: UptimeRobotEvent[];
    meta: {
        count: number;
        date_range: {
            from: string;
            to: string;
        };
    };
    statusPageUrl?: string; // Added to track the status page URL
}

/**
 * Fetches the event feed from UptimeRobot status page
 * @returns Promise resolving to the event feed response
 */
export async function fetchUptimeRobotEvents(): Promise<UptimeRobotEventFeedResponse | null> {
    const config = getServerConfig();

    // Check if UptimeRobot is configured (both URL and API key required)
    if (!config.uptime_robot_status_page_url || !config.uptime_robot_api_key) {
        return null;
    }

    try {
        const url = `${config.uptime_robot_status_page_url}/api/getEventFeed/${config.uptime_robot_api_key}`;
        const response = await fetch(url);

        if (!response.ok) {
            console.error(
                'Failed to fetch UptimeRobot events:',
                response.statusText
            );
            return null;
        }

        const data: UptimeRobotEventFeedResponse = await response.json();
        // Add the status page URL to the response so we can link to it
        data.statusPageUrl = config.uptime_robot_status_page_url;
        return data;
    } catch (error) {
        console.error('Error fetching UptimeRobot events:', error);
        return null;
    }
}

/**
 * Filters events to return only active/ongoing events
 * @param events Array of UptimeRobot events
 * @returns Array of active events
 */
export function getActiveEvents(
    events: UptimeRobotEvent[]
): UptimeRobotEvent[] {
    const now = Date.now();

    return events.filter(event => {
        // Status 2 indicates active/ongoing event
        const isActive = event.status === 2;

        // Check if event is still within its time window
        const startTime = event.timestamp * 1000; // Convert to milliseconds
        const hasStarted = startTime <= now;

        // If there's an end date, check if it hasn't passed yet
        let notEnded = true;
        if (event.endDateGMT) {
            const endTime = new Date(event.endDateGMT).getTime();
            notEnded = endTime > now;
        }

        return isActive && hasStarted && notEnded;
    });
}

/**
 * Converts UptimeRobot event severity icon to appropriate CSS class/color
 * @param icon The icon name from UptimeRobot
 * @returns CSS color for the banner
 */
export function getEventSeverityColor(icon: string): string {
    switch (icon) {
        case 'alert-triangle':
        case 'alert-octagon':
            return '#d9534f'; // Red/danger
        case 'alert-circle':
            return '#f0ad4e'; // Orange/warning
        case 'info':
            return '#5bc0de'; // Blue/info
        case 'check-circle':
            return '#5cb85c'; // Green/success
        default:
            return '#f0ad4e'; // Default to warning
    }
}
