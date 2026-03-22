import { FontDetector } from './utils/FontDetector';
import { ICustomButtonConfig } from './ICustomButton';
import memoize from 'memoize-weak-decorator';

/**
 * Define a CustomButton to display (in CopyDownloadButtons).
 * Clicking on the button will launch it using the url_format
 */
export class CustomButtonConfig implements ICustomButtonConfig {
    id: string;
    name: string;
    tooltip: string;
    image_src: string;
    required_user_agent?: string;
    required_installed_font_family?: string;
    url_format: string;
    visualize_href?: string;
    visualize_title?: string;
    visualize_description?: string;
    visualize_image_src?: string;

    public static parseCustomButtonConfigs(
        customButtonsJson: string
    ): ICustomButtonConfig[] {
        if (!customButtonsJson) {
            return [];
        } else {
            return JSON.parse(customButtonsJson).map(
                (item: any) =>
                    new CustomButtonConfig(item as ICustomButtonConfig)
            );
        }
    }

    /**
     * Creates a new instance of the CustomButtonConfig class.
     * @param config - The configuration object for the custom button.
     */
    constructor(config: ICustomButtonConfig) {
        this.id = config.id;
        this.name = config.name;
        this.tooltip = config.tooltip;
        this.image_src = config.image_src;
        this.required_user_agent = config.required_user_agent;
        this.required_installed_font_family =
            config.required_installed_font_family;
        this.url_format = config.url_format;
        this.visualize_href = config.visualize_href;
        this.visualize_title = config.visualize_title;
        this.visualize_description = config.visualize_description;
        this.visualize_image_src = config.visualize_image_src;
    }

    /**
     * Checks if the CustomButton is available in the current context per the defined reuqirements.
     * @returns A boolean value indicating if is available.
     */
    isAvailable(): boolean {
        const resultComputed = this.computeIsCustomButtonAvailable();
        // console.log(toolConfig.id + '.isAvailable.Computed:' + resultComputed);
        return resultComputed;
    }

    @memoize
    checkToolRequirementsPlatform(
        required_userAgent: string | undefined
    ): boolean {
        if (!required_userAgent) {
            return true;
        }

        return navigator.userAgent.indexOf(required_userAgent) >= 0;
    }

    // OPTIMIZE: want to @memoize, but if user installs font, it wouldn't be detected.
    checkToolRequirementsFontFamily(fontFamily: string | undefined): boolean {
        if (!fontFamily) {
            return true;
        }

        const detector = new FontDetector();
        const result = detector.detect(fontFamily);
        return result;
    }

    computeIsCustomButtonAvailable(): boolean {
        if (!this.checkToolRequirementsPlatform(this.required_user_agent)) {
            return false;
        }

        if (
            !this.checkToolRequirementsFontFamily(
                this.required_installed_font_family
            )
        ) {
            return false;
        }

        return true;
    }
}
