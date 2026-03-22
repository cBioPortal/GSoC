import * as React from 'react';
import _ from 'lodash';
import { observer } from 'mobx-react';
import { action, computed, observable, makeObservable } from 'mobx';
import { Checkbox } from 'react-bootstrap';
import { TruncatedText } from 'cbioportal-frontend-commons';
import { inputBoxChangeTimeoutEvent } from 'shared/lib/EventUtils';

export interface ICategoricalFilterMenuProps {
    id: string;
    emptyFilterString?: boolean;
    currSelections: Set<string>;
    allSelections: Set<string>;
    updateFilterCondition: (newFilterCondition: string) => void;
    updateFilterString: (newFilterString: string) => void;
    toggleSelections: (toggledSelections: Set<string>) => void;
}

@observer
export default class CategoricalFilterMenu extends React.Component<
    ICategoricalFilterMenuProps,
    {}
> {
    @observable private filterString: string = '';

    constructor(props: ICategoricalFilterMenuProps) {
        super(props);
        makeObservable(this);
    }

    componentDidUpdate() {
        if (this.props.emptyFilterString) {
            this.filterString = '';
        }
    }

    @action.bound
    private onChangeFilterCondition(e: any) {
        const newFilterCondition = e.target.value;
        this.props.updateFilterCondition(newFilterCondition);
    }

    @computed get filterConditionDropdown() {
        return (
            <select
                className="form-control input-sm"
                onChange={this.onChangeFilterCondition}
                style={{ width: '160px' }}
            >
                <option value="contains">Contains</option>
                <option value="doesNotContain">Does Not Contain</option>
                <option value="equals">Equals</option>
                <option value="doesNotEqual">Does Not Equal</option>
                <option value="beginsWith">Begins With</option>
                <option value="doesNotBeginWith">Does Not Begin With</option>
                <option value="endsWith">Ends With</option>
                <option value="doesNotEndWith">Does Not End With</option>
                <option value="regex">Regular Expression</option>
            </select>
        );
    }

    @action.bound
    private onChangeFilterString(e: any) {
        const input = e.target.value;
        this.filterString = input;
        window.setTimeout(() => {
            this.props.updateFilterString(input);
        }, 400);
    }

    @computed get filterStringInputBox() {
        return (
            <input
                className="form-control input-sm"
                value={this.filterString}
                onChange={this.onChangeFilterString}
                style={{ width: '160px' }}
                data-test="categorical-filter-menu-search-input"
            />
        );
    }

    @action.bound
    private selectAll() {
        const selections = new Set<string>();
        this.props.allSelections.forEach(selection => {
            if (!this.props.currSelections.has(selection)) {
                selections.add(selection);
            }
        });
        this.props.toggleSelections(selections);
        this.forceUpdate();
    }

    @action.bound
    private deselectAll() {
        const selections = new Set<string>();
        this.props.allSelections.forEach(selection => {
            if (this.props.currSelections.has(selection)) {
                selections.add(selection);
            }
        });
        this.props.toggleSelections(selections);
        this.forceUpdate();
    }

    @computed get selectDeselectAllButtons() {
        const showSelectAll =
            this.props.currSelections.size !== this.props.allSelections.size;
        const showDeselectAll = this.props.currSelections.size !== 0;
        return (
            <div style={{ display: 'flex', alignItems: 'baseline' }}>
                {showSelectAll && (
                    <button
                        className="btn btn-default btn-xs"
                        onClick={this.selectAll}
                    >
                        {`Select all (${this.props.allSelections.size})`}
                    </button>
                )}
                {showDeselectAll && (
                    <button
                        className="btn btn-default btn-xs"
                        onClick={this.deselectAll}
                    >
                        {'Deselect all'}
                    </button>
                )}
            </div>
        );
    }

    @action.bound
    private onChangeSelection(e: any) {
        const id = e.currentTarget.getAttribute('data-id');
        if (id !== undefined) {
            this.props.toggleSelections(new Set([id]));
            this.forceUpdate();
        }
    }

    @computed get sortedSelections() {
        return Array.from(this.props.allSelections).sort();
    }

    @computed get selectionCheckboxes() {
        return this.sortedSelections.map(selection => (
            <Checkbox
                data-id={selection}
                onChange={this.onChangeSelection}
                checked={this.props.currSelections.has(selection)}
            >
                <TruncatedText
                    maxLength={37}
                    text={selection}
                    tooltip={<div style={{ maxWidth: 300 }}>{selection}</div>}
                />
            </Checkbox>
        ));
    }

    render() {
        return (
            <div
                style={{
                    margin: 'auto',
                    display: 'flex',
                    flexDirection: 'column',
                }}
            >
                <div style={{ display: 'flex' }}>
                    {this.filterConditionDropdown}
                    {this.filterStringInputBox}
                </div>

                <div style={{ marginTop: 10 }}>
                    {this.selectDeselectAllButtons}
                </div>

                <div
                    style={{
                        marginTop: 10,
                        paddingLeft: 10,
                        maxHeight: 250,
                        maxWidth: 320,
                        overflow: 'auto',
                        whiteSpace: 'nowrap',
                    }}
                >
                    {this.selectionCheckboxes}
                </div>
            </div>
        );
    }
}
