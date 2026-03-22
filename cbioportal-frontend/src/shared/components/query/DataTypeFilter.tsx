import * as React from 'react';
import { FunctionComponent, useRef } from 'react';
import { Dropdown } from 'react-bootstrap';
import { DropdownToggleProps } from 'react-bootstrap/lib/DropdownToggle';

import { DropdownMenuProps } from 'react-bootstrap/lib/DropdownMenu';
import { QueryStore } from 'shared/components/query/QueryStore';

export interface IFilterDef {
    id: string;
    name: string;
    checked: boolean;
}

export type IDataTypeFilterProps = {
    dataFilter: string[];
    isChecked: boolean;
    buttonText: string | JSX.Element;
    dataFilterActive?: IFilterDef[];
    store: QueryStore;
    samplePerFilter: number[];
    studyPerFilter: number[];
    toggleFilter: (id: string) => void;
    isLoading?: boolean;
};

export const DataTypeFilter: FunctionComponent<IDataTypeFilterProps> = props => {
    const initialStudyCountsRef = useRef<number[]>([]);
    const initialSampleCountsRef = useRef<number[]>([]);

    // Only set initial counts once
    if (
        initialStudyCountsRef.current.length === 0 &&
        props.studyPerFilter.length > 0
    ) {
        initialStudyCountsRef.current = props.studyPerFilter;
        initialSampleCountsRef.current = props.samplePerFilter;
    }

    // Create sorted indices based on INITIAL study count (desc), then sample count (desc)
    // This ensures the order stays stable even when filters are selected
    const sortedIndicesRef = useRef<number[]>([]);
    if (
        sortedIndicesRef.current.length === 0 &&
        props.dataFilterActive?.length
    ) {
        sortedIndicesRef.current = props.dataFilterActive
            .map((_, index) => index)
            .sort((a, b) => {
                const studyDiff =
                    (initialStudyCountsRef.current[b] || 0) -
                    (initialStudyCountsRef.current[a] || 0);
                if (studyDiff !== 0) return studyDiff;
                return (
                    (initialSampleCountsRef.current[b] || 0) -
                    (initialSampleCountsRef.current[a] || 0)
                );
            });
    }

    return (
        <div data-test="dropdown-data-type-filter" style={{ paddingRight: 5 }}>
            <div className="input-group input-group-sm input-group-toggle">
                <Dropdown id="dropdown-study-data-filter">
                    <Dropdown.Toggle
                        {...({
                            rootCloseEvent: 'click',
                        } as DropdownToggleProps)}
                        className="btn-sm"
                        style={{
                            width: 150,
                            textAlign: 'right',
                            float: 'right',
                            paddingRight: 5,
                        }}
                    >
                        <span
                            style={{
                                float: 'left',
                                paddingLeft: 0,
                                marginLeft: 0,
                            }}
                        >
                            {props.buttonText}
                        </span>
                        {props.store.dataTypeFilters!.length > 0 && (
                            <span
                                className="oncoprintDropdownCount"
                                style={{ marginLeft: 5 }}
                            >
                                {props.store.dataTypeFilters!.length} /{' '}
                                {props.dataFilterActive!.length}
                            </span>
                        )}
                    </Dropdown.Toggle>
                    <Dropdown.Menu
                        {...({ bsRole: 'menu' } as DropdownMenuProps)}
                        style={{
                            paddingLeft: 10,
                            paddingRight: 10,
                            overflowY: 'auto',
                            overflowX: 'hidden',
                            maxHeight: 500,
                            width: 450,
                        }}
                    >
                        <div style={{ paddingTop: 8, paddingBottom: 8 }}>
                            Filter studies with selected data types
                        </div>
                        {props.isLoading ? (
                            <div
                                style={{
                                    padding: '20px',
                                    textAlign: 'center',
                                    color: '#999',
                                }}
                            >
                                <i
                                    className="fa fa-spinner fa-spin"
                                    style={{ marginRight: 5 }}
                                ></i>
                                Loading data types...
                            </div>
                        ) : (
                            <table
                                className="table table-sm"
                                style={{ marginBottom: 0 }}
                            >
                                <thead>
                                    <tr>
                                        <th
                                            style={{
                                                color: '#3786C2',
                                                borderTop: 'none',
                                            }}
                                        >
                                            Data type
                                        </th>
                                        <th
                                            style={{
                                                textAlign: 'right',
                                                color: '#999',
                                                borderTop: 'none',
                                            }}
                                        >
                                            Studies
                                        </th>
                                        <th
                                            style={{
                                                textAlign: 'right',
                                                color: '#999',
                                                borderTop: 'none',
                                            }}
                                        >
                                            Samples
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {sortedIndicesRef.current.map(i => {
                                        const type = props.dataFilterActive![i];
                                        const isZero =
                                            props.studyPerFilter![i] === 0 &&
                                            props.samplePerFilter![i] === 0;
                                        return (
                                            <tr
                                                key={type.id}
                                                style={
                                                    isZero
                                                        ? { color: '#ccc' }
                                                        : undefined
                                                }
                                            >
                                                <td
                                                    style={{
                                                        paddingTop: 8,
                                                        paddingBottom: 8,
                                                    }}
                                                >
                                                    <label
                                                        style={{
                                                            marginBottom: 0,
                                                            fontWeight:
                                                                'normal',
                                                            color: isZero
                                                                ? '#ccc'
                                                                : undefined,
                                                            cursor: isZero
                                                                ? 'not-allowed'
                                                                : 'pointer',
                                                        }}
                                                    >
                                                        <input
                                                            type="checkbox"
                                                            style={{
                                                                marginRight: 5,
                                                            }}
                                                            checked={
                                                                type.checked
                                                            }
                                                            disabled={isZero}
                                                            onClick={() => {
                                                                props.toggleFilter(
                                                                    type.id
                                                                );
                                                                props.store.dataTypeFilters = createDataTypeUpdate(
                                                                    props.dataFilterActive!
                                                                );
                                                            }}
                                                        />
                                                        {type.name}
                                                    </label>
                                                </td>
                                                <td
                                                    style={{
                                                        textAlign: 'right',
                                                        color: isZero
                                                            ? '#ccc'
                                                            : '#999',
                                                        paddingTop: 8,
                                                        paddingBottom: 8,
                                                    }}
                                                >
                                                    {props.studyPerFilter![i]}
                                                </td>
                                                <td
                                                    style={{
                                                        textAlign: 'right',
                                                        color: isZero
                                                            ? '#ccc'
                                                            : '#999',
                                                        paddingTop: 8,
                                                        paddingBottom: 8,
                                                    }}
                                                >
                                                    {props.samplePerFilter![i]}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        )}
                    </Dropdown.Menu>
                </Dropdown>
            </div>
        </div>
    );
};

export function createDataTypeUpdate(allFilters: IFilterDef[]): string[] {
    const toAdd: string[] = [];
    allFilters.map((subDataFilter: IFilterDef) =>
        subDataFilter.checked ? toAdd.push(subDataFilter.id) : ''
    );
    return toAdd;
}
