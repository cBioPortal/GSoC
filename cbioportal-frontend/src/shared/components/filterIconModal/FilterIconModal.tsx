import * as React from 'react';
import _ from 'lodash';
import classNames from 'classnames';
import { RootCloseWrapper } from 'react-overlays';
import { Dropdown } from 'react-bootstrap';
import { observer } from 'mobx-react';
import { action, observable, makeObservable } from 'mobx';
import { ICON_FILTER_OFF } from 'shared/lib/Colors';

export interface IFilterIconModalProps {
    id: string;
    filterIsActive: boolean;
    deactivateFilter: () => void;
    setupFilter: () => void;
    menuComponent?: JSX.Element;
}

class FilterIcon extends React.Component<any, {}> {
    render() {
        return (
            <span
                onClick={this.props.onClickFilter}
                style={{
                    color: this.props.isActive ? '#0000ff' : ICON_FILTER_OFF,
                    display: 'inline-block',
                    cursor: 'pointer',
                    visibility: 'hidden',
                    marginLeft: 5,
                    marginTop: -1,
                }}
            >
                <i className="fa fa-filter"></i>
            </span>
        );
    }
}

class FilterMenu extends React.Component<any, {}> {
    @observable private pullRight: boolean = false;

    componentDidUpdate() {
        const rect = document
            .getElementById(this.props.id)!
            .getBoundingClientRect();

        if (rect.right > window.innerWidth) {
            this.pullRight = true;
        }

        let yOffset = 0;
        const height = window.innerHeight;
        if (rect.bottom > height) {
            yOffset = rect.bottom - height + 15;
        }
        window.scroll(window.scrollX, window.scrollY + yOffset);
    }

    render() {
        return (
            <div
                id={this.props.id}
                className={classNames(
                    'dropdown-menu',
                    this.pullRight ? 'pull-right' : 'pull-left'
                )}
                style={{
                    transform: this.pullRight
                        ? 'translateX(10px)'
                        : 'translateX(-5px)',
                    visibility: this.props.isOpen ? 'visible' : 'hidden',
                }}
            >
                <div style={{ margin: '6px', marginBottom: '0px' }}>
                    {this.props.id}

                    <div style={{ marginTop: '10px' }}>
                        {this.props.menuComponent}
                    </div>

                    <button
                        className="btn btn-default btn-xs"
                        onClick={this.props.onClickRemove}
                        disabled={!this.props.isActive}
                        style={{ marginTop: '10px', float: 'right' }}
                    >
                        Remove filter
                    </button>
                </div>
            </div>
        );
    }
}

@observer
export default class FilterIconModal extends React.Component<
    IFilterIconModalProps,
    {}
> {
    @observable private isOpen: boolean = false;

    constructor(props: IFilterIconModalProps) {
        super(props);
        makeObservable(this);
    }

    @action.bound
    private hide() {
        this.isOpen = false;
    }

    @action.bound
    private onClickRemove() {
        this.isOpen = false;
        this.props.deactivateFilter();
    }

    @action.bound
    private onClickFilter() {
        this.isOpen = !this.isOpen;
        if (!this.props.filterIsActive) {
            this.props.setupFilter();
        }
    }

    render() {
        return (
            <RootCloseWrapper onRootClose={this.hide}>
                <Dropdown
                    id={this.props.id + ' filterIconModal'}
                    open={this.isOpen}
                >
                    <FilterIcon
                        bsRole="toggle"
                        isActive={this.props.filterIsActive}
                        onClickFilter={this.onClickFilter}
                    />
                    <FilterMenu
                        bsRole="menu"
                        id={this.props.id}
                        isOpen={this.isOpen}
                        isActive={this.props.filterIsActive}
                        onClickRemove={this.onClickRemove}
                        menuComponent={this.props.menuComponent}
                    />
                </Dropdown>
            </RootCloseWrapper>
        );
    }
}
