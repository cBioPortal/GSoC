import { IStatusProvider } from './IStatusProvider';
import { UptimeRobotStatusProvider } from './UptimeRobotStatusProvider';

/**
 * Registry of all status page providers.
 * Add new status providers here to enable them.
 *
 * Example: To add StatusPage.io integration:
 * 1. Create StatusPageIoProvider.ts that implements IStatusProvider
 * 2. Import it: import { StatusPageIoProvider } from './StatusPageIoProvider';
 * 3. Add to array: new StatusPageIoProvider(),
 */
export const STATUS_PROVIDERS: IStatusProvider[] = [
    new UptimeRobotStatusProvider(),
    // Add additional status providers here
];
