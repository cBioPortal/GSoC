import autobind from 'autobind-decorator';
import { CheckedSelect, Option } from 'cbioportal-frontend-commons';
import { action, computed, makeObservable } from 'mobx';
import { observer } from 'mobx-react';
import * as React from 'react';

export type ColumnVisibilityDef = {
    id: string;
    name: string;
    visible: boolean;
    togglable?: boolean;
};

export type ColumnSelectorProps = {
    name?: string;
    placeholder?: string;
    columnVisibility?: ColumnVisibilityDef[];
    onColumnToggled?: (selectedColumnIds: string[]) => void;
    showControls?: boolean;
};

@observer
export class ColumnSelector extends React.Component<ColumnSelectorProps, {}> {
    public static defaultProps: Partial<ColumnSelectorProps> = {
        name: 'dataTableColumns',
        placeholder: 'Columns',
        showControls: false,
    };

    constructor(props: ColumnSelectorProps) {
        super(props);
        makeObservable<ColumnSelector, 'onChange'>(this);
    }

    @computed
    public get selectedValues() {
        return (this.props.columnVisibility || [])
            .filter(c => c.visible)
            .map(c => ({ value: c.id }));
    }

    @computed
    public get options(): Option[] {
        return (this.props.columnVisibility || []).map(c => ({
            label: <span>{c.name}</span>,
            value: c.id,
        }));
    }

    public render() {
        return (
            <CheckedSelect
                name={this.props.name}
                placeholder={this.props.placeholder}
                onChange={this.onChange}
                options={this.options}
                value={this.selectedValues}
                showControls={this.props.showControls}
            />
        );
    }

    @action.bound
    private onChange(values: { value: string }[]) {
        if (this.props.onColumnToggled) {
            this.props.onColumnToggled(values.map(o => o.value));
        }
    }
}

export default ColumnSelector;
