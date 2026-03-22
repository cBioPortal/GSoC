import * as React from 'react';
import { DropdownButtonProps, DropdownButton } from 'react-bootstrap';
import { observer } from 'mobx-react';
import { computed, makeObservable, observable } from 'mobx';

@observer
export default class NonClosingDropdown extends React.Component<
    DropdownButtonProps,
    {}
> {
    private _forceOpen: boolean = false;
    @observable private open: boolean = false;

    constructor(props: any) {
        super(props);
        makeObservable(this);
    }

    @computed private get onToggle() {
        return (newVal: boolean) => {
            if (this._forceOpen) {
                this._forceOpen = false;
            } else {
                this.open = newVal;
            }
            this.props.onToggle && this.props.onToggle(newVal);
        };
    }

    render() {
        const { children, open, onToggle, ...props } = this.props;
        return (
            <DropdownButton
                open={this.open}
                onToggle={this.onToggle}
                {...props}
            >
                {React.Children.toArray(children).map(
                    (x: React.ReactElement<{ onClick?: () => void }>) => {
                        const onClick = x.props.onClick || (() => {});
                        return React.cloneElement(x, {
                            onClick: () => {
                                this._forceOpen = true;
                                onClick();
                            },
                        } as { onClick?: () => void });
                    }
                )}
            </DropdownButton>
        );
    }
}
