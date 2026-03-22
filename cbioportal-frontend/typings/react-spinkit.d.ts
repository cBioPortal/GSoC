declare module 'react-spinkit' {
    interface SpinnerProps {
        spinnerName?: string;
        style?: React.CSSProperties;
        noFadeIn?: boolean;
        className?: string;
        overrideSpinnerClassName?: string;
    }

    export default class Spinner extends React.Component<SpinnerProps, {}> {}
}
