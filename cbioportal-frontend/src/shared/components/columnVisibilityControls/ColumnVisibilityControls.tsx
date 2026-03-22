import * as React from 'react';
import _ from 'lodash';
import { Dropdown, Checkbox } from 'react-bootstrap';
import { DropdownToggleProps } from 'react-bootstrap/lib/DropdownToggle';
import { DropdownMenuProps } from 'react-bootstrap/lib/DropdownMenu';
import { action, computed } from 'mobx';

export interface IColumnVisibilityDef {
    id: string;
    name: string;
    visible: boolean;
    togglable?: boolean;
}

export interface IColumnVisibilityControlsProps {
    className?: string;
    buttonText?: string | JSX.Element;
    columnVisibility?: IColumnVisibilityDef[];
    onColumnToggled?: (
        columnId: string,
        columnVisibility?: IColumnVisibilityDef[]
    ) => void;
    resetColumnVisibility?: () => void;
    showResetColumnsButton?: boolean;
    customDropdown?: (props: IColumnVisibilityControlsProps) => JSX.Element;
}

/**
 * @author Selcuk Onur Sumer
 * @author Aaron Lisman
 */
export class ColumnVisibilityControls extends React.Component<
    IColumnVisibilityControlsProps,
    {}
> {
    public static defaultProps: IColumnVisibilityControlsProps = {
        className: '',
        buttonText: 'Columns',
    };

    constructor(props: IColumnVisibilityControlsProps) {
        super(props);
        this.handleSelect = this.handleSelect.bind(this);
        this.selectAll = this.selectAll.bind(this);
        this.deselectAll = this.deselectAll.bind(this);
    }

    public render() {
        return (
            <div>
                {this.props.customDropdown
                    ? this.props.customDropdown(this.props)
                    : this.defaultDropdown}
            </div>
        );
    }

    private toggleAllColumns(select: boolean) {
        if (!this.props.columnVisibility) return;

        const toggledColumns = new Set<string>();
        this.props.columnVisibility.forEach(column => {
            if (column.visible !== select) {
                toggledColumns.add(column.id);
            }
        });

        toggledColumns.forEach(columnId => {
            if (this.props.onColumnToggled && columnId) {
                this.props.onColumnToggled(
                    columnId,
                    this.props.columnVisibility
                );
            }
        });
    }

    private selectAll() {
        this.toggleAllColumns(true);
    }

    private deselectAll() {
        this.toggleAllColumns(false);
    }

    get selectDeselectAllButtons() {
        return (
            <div
                style={{
                    display: 'flex',
                    alignItems: 'baseline',
                    gap: '3px',
                }}
            >
                <button
                    className="btn btn-default btn-xs"
                    onClick={this.selectAll}
                >
                    {`Select all`}
                </button>
                <button
                    className="btn btn-default btn-xs"
                    onClick={this.deselectAll}
                >
                    {'Deselect all'}
                </button>
            </div>
        );
    }

    private get defaultDropdown() {
        return (
            <Dropdown className={this.props.className} id="dropdown-custom-1">
                <Dropdown.Toggle
                    {...({ rootCloseEvent: 'click' } as DropdownToggleProps)}
                    className="btn-sm"
                >
                    {this.props.buttonText}
                </Dropdown.Toggle>
                <Dropdown.Menu
                    {...({ bsRole: 'menu' } as DropdownMenuProps)}
                    style={{
                        paddingLeft: 10,
                        overflow: 'auto',
                        maxHeight: 300,
                        whiteSpace: 'nowrap',
                    }}
                >
                    <div style={{ marginTop: 10, marginBottom: 10 }}>
                        {this.selectDeselectAllButtons}
                    </div>
                    <ul className="list-unstyled">
                        {this.props.columnVisibility &&
                            _.map(
                                this.props.columnVisibility,
                                (visibility: IColumnVisibilityDef) => {
                                    return visibility.togglable ? (
                                        <li key={visibility.id}>
                                            <Checkbox
                                                data-id={visibility.id}
                                                onChange={
                                                    this
                                                        .handleSelect as React.FormEventHandler<
                                                        any
                                                    >
                                                }
                                                checked={visibility.visible}
                                                inline
                                            >
                                                {visibility.name}
                                            </Checkbox>
                                        </li>
                                    ) : null;
                                }
                            )}
                    </ul>
                </Dropdown.Menu>
            </Dropdown>
        );
    }

    private handleSelect(evt: React.FormEvent<HTMLInputElement>) {
        const id = evt.currentTarget.getAttribute('data-id');

        if (this.props.onColumnToggled && id) {
            this.props.onColumnToggled(id, this.props.columnVisibility);
        }
    }
}
