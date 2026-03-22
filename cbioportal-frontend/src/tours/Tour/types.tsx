/**
 * Represents a step of a tour.
 *
 * @param selector - CSS selector of the element to highlight.
 * @param content - Content of the tour step to display.
 * @param action - Function to execute when the step is reached.
 */
type Step = {
    selector: string;
    content: () => any;
    action?: (node: Element) => void;
};

/**
 * Defines the type of the steps of a tour.
 */
type Steps = Array<Step>;

/**
 * Represents a function to set the lock state of a tour.
 * When the value is true, the tour is locked, and the user cannot go to the next step.
 */
type SetLockTour = (value: React.SetStateAction<boolean>) => void;

/**
 * Represents a function to set the step to go to.
 * For the goToStep function of the Tour component.
 */
type SetGotoStep = (value: React.SetStateAction<number | null>) => void;

/**
 * The props of the getSteps function.
 *
 * @param isLoggedIn - Whether the user is logged in.
 * @param studies - The number of selected studies or samples.
 * @param setLockTour - Function to set the lock state of the tour.
 * @param setGotoStep - Function to set the step to go to.
 * @param endTour - Function to end the tour.
 */
type GetStepsProps = {
    isLoggedIn: boolean;
    studies: number;
    setLockTour: SetLockTour;
    setGotoStep: SetGotoStep;
    endTour: () => void;
};

/**
 * Represents a function to get the steps of a tour.
 */
type GetSteps = (props: GetStepsProps) => Steps;

/**
 * The props of the Tour component.
 *
 * @param hideEntry - Whether to hide the entry button that displays the name of the tour.
 * @param isLoggedIn - Whether the user is logged in.
 * @param studies - The number of selected studies or samples.
 */
type TourProps = {
    hideEntry?: boolean;
    isLoggedIn?: boolean;
    studies?: number;
};

/**
 * The props of the TourMap, which is a map of tours' titles and getSteps functions.
 *
 * @param title - The title of the tour.
 * @param getSteps - The function to get the steps of the tour.
 */
type TourMapProps = {
    [key: string]: {
        title: string;
        getSteps: any;
        className: string;
    };
};

export { GetSteps, TourProps, TourMapProps };
