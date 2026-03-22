import { getServerConfig } from 'config/config';
import { CustomButtonConfig } from './CustomButtonConfig';
import { ICustomButtonConfig } from './ICustomButton';

/**
 * Lazy initialization from a JSON file configured on the server, which may define an array of CustomButtonConfig objects.
 * @returns The CustomButtonConfigs from the server configuration.
 */
export const getCustomButtonConfigs = (() => {
    let customButtons: ICustomButtonConfig[] | undefined = undefined;

    return (): ICustomButtonConfig[] => {
        if (!customButtons) {
            // Initialize
            const customButtonsJson = getServerConfig()
                .download_custom_buttons_json;
            customButtons = CustomButtonConfig.parseCustomButtonConfigs(
                customButtonsJson
            );
            // console.log('CustomButtons: ' + customButtons.map(button => button.id).join(","));
        }
        return customButtons;
    };
})();
