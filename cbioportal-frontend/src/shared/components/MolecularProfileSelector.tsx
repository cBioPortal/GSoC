import { observer } from 'mobx-react';
import * as React from 'react';
import { MolecularProfile } from 'cbioportal-ts-api-client';
import Select from 'react-select1';
import { getProfileOptions } from 'pages/resultsView/coExpression/CoExpressionTabUtils';

export interface IMolecularProfileSelector {
    name?: string;
    className?: string;
    value: string;
    onChange: (option: { label: string; value: string }) => void;
    molecularProfiles: MolecularProfile[];
}

@observer
export default class MolecularProfileSelector extends React.Component<
    IMolecularProfileSelector,
    {}
> {
    render() {
        return (
            <Select
                name={this.props.name}
                value={this.props.value}
                onChange={this.props.onChange}
                options={getProfileOptions(this.props.molecularProfiles)}
                searchable={false}
                clearable={false}
                className={this.props.className}
            />
        );
    }
}
