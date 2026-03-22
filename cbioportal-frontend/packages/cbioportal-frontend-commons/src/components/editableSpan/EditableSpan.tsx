import * as React from 'react';
import styles from './styles.module.scss';
import classNames from 'classnames';

export interface IEditableSpanProps
    extends React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLSpanElement>,
        HTMLSpanElement
    > {
    value: string;
    setValue: (val: string) => boolean | void;
    maxChars?: number;
    numericOnly?: boolean;
    isPercentage?: boolean;
    textFieldAppearance?: boolean | 'editing';
    allowEmptyValue?: boolean;
}

export default class EditableSpan extends React.Component<
    IEditableSpanProps,
    {}
> {
    private enterPressedSinceLastBlur = false;
    private spanElt: HTMLSpanElement;
    private dirty: boolean = false;

    constructor(props: IEditableSpanProps) {
        super(props);
        this.onKeyPress = this.onKeyPress.bind(this);
        this.onKeyUp = this.onKeyUp.bind(this);
        this.onBlur = this.onBlur.bind(this);
        this.spanRef = this.spanRef.bind(this);
    }

    private spanRef(span: HTMLSpanElement) {
        this.spanElt = span;
    }

    private onKeyPress(evt: React.KeyboardEvent<HTMLSpanElement>) {
        this.props.onKeyPress && this.props.onKeyPress(evt);

        const newKey = evt.key;

        if (newKey === 'Enter') {
            evt.preventDefault();
            this.enterPressedSinceLastBlur = true;
            evt.currentTarget.blur();
            return;
        }

        if (this.props.numericOnly) {
            const regex = /^[\d.-]$/;
            if (!regex.test(newKey)) {
                evt.preventDefault();
            }
        } else if (this.props.isPercentage) {
            const regex = /^[%\d.]$/;
            if (!regex.test(newKey)) {
                evt.preventDefault();
            }
        }

        // By this point, the new character is acceptable to be typed, if not past max length already

        // If at max length...
        if (
            this.props.maxChars &&
            this.spanElt.innerText.length === this.props.maxChars
        ) {
            // ...dont type unless at least one character selected to be replaced
            const selection = window.getSelection();
            if (
                selection &&
                (!selection.containsNode(this.spanElt, true) ||
                    !selection.toString().length)
            ) {
                evt.preventDefault();
            }
        }
    }

    private onKeyUp(evt: React.KeyboardEvent<HTMLSpanElement>) {
        this.props.onKeyUp && this.props.onKeyUp(evt);

        if (
            this.props.maxChars &&
            this.spanElt.innerText.length > this.props.maxChars
        ) {
            // If something has gone wrong and the input length is longer than allowed, truncate it
            this.spanElt.innerText = this.spanElt.innerText.substring(
                this.spanElt.innerText.length - this.props.maxChars
            );
        }
    }

    private onBlur(evt: React.FocusEvent<HTMLSpanElement>) {
        this.props.onBlur && this.props.onBlur(evt);

        const inputText = evt.currentTarget.innerText;

        if (
            !(inputText.length === 0 && !this.props.allowEmptyValue) &&
            (inputText !== this.props.value || this.enterPressedSinceLastBlur)
        ) {
            // if proposed value is valid, try to submit it
            this.dirty = true;
            const valid = this.props.setValue(inputText);
            if (valid === false) {
                // if the submit failed, revert input box to props.value
                this.dirty = false;
                this.setText(this.props.value);
            }
        } else {
            // otherwise, revert input box to props.value
            this.setText(this.props.value);
        }
        this.enterPressedSinceLastBlur = false;
    }

    private setText(text: string) {
        this.spanElt.innerText = text;
    }

    componentDidMount() {
        this.setText(this.props.value);
    }

    componentWillReceiveProps(nextProps: IEditableSpanProps) {
        if (this.dirty || nextProps.value !== this.props.value) {
            this.dirty = false;
            this.setText(nextProps.value);
        }
    }

    get className() {
        let textfield = '';
        switch (this.props.textFieldAppearance) {
            case true:
                textfield = styles.textfieldAppearance;
                break;
            case 'editing':
                textfield = styles.textfieldAppearanceWhenEditing;
                break;
            default:
                break;
        }
        return textfield;
    }

    render() {
        const {
            contentEditable,
            onKeyPress,
            onKeyUp,
            onBlur,
            value,
            setValue,
            maxChars,
            numericOnly,
            isPercentage,
            textFieldAppearance,
            ...spanProps
        } = this.props;
        return (
            <span
                ref={this.spanRef}
                contentEditable={true}
                onKeyPress={this.onKeyPress}
                onKeyUp={this.onKeyUp}
                onBlur={this.onBlur}
                {...spanProps}
                className={classNames(spanProps.className, this.className)}
            />
        );
    }
}
