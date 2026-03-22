/**
 * Properties that may be referenced from url_format, like "{studyName}".
 * TECH: all properties are string, since it's easier for the TypeScript indexing operator. E.g. dataLength as string instead of integer.
 */
export type CustomButtonUrlParameters = {
    studyName?: string;
    dataLength?: string;
    [key: string]: string | undefined;
};

/**
 * This interface defines the properties that can be passed to the CustomButton component.
 */
export interface ICustomButtonProps {
    toolConfig: ICustomButtonConfig;
    // this is an object that contains a property map
    baseTooltipProps: any;
    overlayClassName?: string;
    downloadDataAsync?: () => Promise<string | undefined>;
    urlFormatOverrides?: CustomButtonUrlParameters;
}

export interface ICustomButtonConfig {
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

    isAvailable?(): boolean;
}
