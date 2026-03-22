import * as React from 'react';
import styles from './styles.module.scss';
import { makeObservable, observable } from 'mobx';
import { observer } from 'mobx-react';
import autobind from 'autobind-decorator';
import classnames from 'classnames';
import ReactDOM from 'react-dom';

interface IInfoBeaconProps {
    top: number;
    left?: number;
    right?: number;
    interaction: 'click' | 'mouseover';
    color?: string;
    id: string;
}

@observer
export default class InfoBeacon extends React.Component<IInfoBeaconProps, {}> {
    @observable infoShown = false;

    constructor(props: IInfoBeaconProps) {
        super(props);
        makeObservable(this);
    }

    @autobind
    showInfo() {
        if (!this.infoShown) {
            this.infoShown = true;
        }
        this.markAsShown();
    }

    markAsShown() {
        // we do this so as not to prevent the initial show
        setTimeout(() => {
            localStorage.setItem(this.props.id, 'true');
        }, 100);
    }

    get alreadyShown() {
        return localStorage.getItem(this.props.id) === 'true';
    }

    @autobind
    handleInteraction() {
        switch (this.props.interaction) {
            case 'click':
                this.showInfo();
                break;
            case 'mouseover':
                this.showInfo();
                break;
        }
    }

    render() {
        if (this.alreadyShown) {
            return null;
        } else {
            const style: any = {
                top: this.props.top,
            };

            if (this.props.color) {
                style.backgroundColor = this.props.color;
            }

            if (this.props.left) {
                style.left = this.props.left;
            }

            if (this.props.right) {
                style.right = this.props.right;
            }

            return (
                <div
                    className={classnames({ [styles.beacon]: !this.infoShown })}
                    style={style}
                    onClick={this.handleInteraction}
                    onMouseOver={this.handleInteraction}
                >
                    {this.infoShown &&
                        ReactDOM.createPortal(
                            this.props.children,
                            document.body
                        )}
                </div>
            );
        }
    }
}
