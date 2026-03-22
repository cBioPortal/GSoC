import * as React from 'react';
import { Button, Dropdown, ButtonProps } from 'react-bootstrap';
import RootCloseWrapper from 'react-overlays/lib/RootCloseWrapper';
import classNames from 'classnames';
import { observer } from 'mobx-react';
import { observable, makeObservable } from 'mobx';

export interface ICustomDropdownProps extends ButtonProps {
    titleElement?: JSX.Element;
    styles?: any;
    buttonClassName?: string;
}

class CustomButton extends React.Component<any, {}> {
    // cant type this more specifically because of some typing issues w ES6 classes not having component.replaceState
    render() {
        const { bsRole, title, ...props } = this.props;
        const className = this.props.buttonClassName
            ? this.props.buttonClassName
            : 'btn btn-default';
        return (
            <Button className={className} {...props}>
                {title} {this.props.titleElement} <span className="caret" />
            </Button>
        );
    }
}
class CustomMenu extends React.Component<any, {}> {
    render() {
        const { className, styles, children } = this.props;

        return (
            <div
                className={classNames('dropdown-menu', className)}
                style={{ ...styles, padding: '6px' }}
            >
                {children}
            </div>
        );
    }
}

@observer
export default class CustomDropdown extends React.Component<
    ICustomDropdownProps,
    {}
> {
    @observable private open: boolean = false;

    private toggle: () => void;
    public hide: () => void;

    constructor(props: ButtonProps) {
        super(props);
        makeObservable(this);
        this.toggle = () => {
            this.open = !this.open;
        };
        this.hide = () => {
            this.open = false;
        };
    }

    render() {
        const { children, id, className, styles, ref, ...props } = this.props;
        return (
            <RootCloseWrapper onRootClose={this.hide}>
                <Dropdown id={id + ''} open={this.open}>
                    <CustomButton
                        bsStyle="default"
                        bsRole="toggle"
                        title="Custom Toggle"
                        onClick={this.toggle}
                        {...props}
                    />
                    <CustomMenu
                        bsRole="menu"
                        className={className}
                        styles={styles}
                    >
                        {children}
                    </CustomMenu>
                </Dropdown>
            </RootCloseWrapper>
        );
    }
}
