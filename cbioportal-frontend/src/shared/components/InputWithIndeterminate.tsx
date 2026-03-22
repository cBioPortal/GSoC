import * as React from 'react';
import { observer } from 'mobx-react';
import { DetailedHTMLProps, InputHTMLAttributes } from 'react';
import { makeObservable, observable } from 'mobx';
import autobind from 'autobind-decorator';

export interface IInputWithIndeterminateCheckboxProps
    extends DetailedHTMLProps<
        InputHTMLAttributes<HTMLInputElement>,
        HTMLInputElement
    > {
    indeterminate?: boolean;
}

@observer
export default class InputWithIndeterminate extends React.Component<
    IInputWithIndeterminateCheckboxProps,
    {}
> {
    constructor(props: IInputWithIndeterminateCheckboxProps) {
        super(props);
        makeObservable(this);
    }
    @observable.ref input: HTMLInputElement | null = null;

    @autobind
    private ref(input: HTMLInputElement | null) {
        this.input = input;
    }

    componentWillReceiveProps(
        nextProps: Readonly<IInputWithIndeterminateCheckboxProps>
    ) {
        if (this.input) {
            this.input.indeterminate = !!nextProps.indeterminate;
        }
    }

    render() {
        const { indeterminate, ref, ...restProps } = this.props;
        return <input ref={this.ref} {...restProps} />;
    }
}
