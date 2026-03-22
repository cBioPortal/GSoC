import { FunctionComponent } from 'react';
import _ from 'lodash';
import * as React from 'react';
import {
    BoxModel,
    IBoxScatterPlotData,
} from 'shared/components/plots/BoxScatterPlot';

type SummaryStatisticsTableProps = {
    data: BoxModel[];
    labels: string[];
};

type DescriptiveDataTableProps = {
    descriptiveData: DataDescriptiveValues[];
    dataBoxplot: BoxModel[];
    labels: string[];
};

type DataDescriptiveValues = {
    mad: number;
    stdDeviation: number;
    median: number;
    mean: number;
    count: number;
    maximum: number;
    minimum: number;
};

export const SummaryStatisticsTable: FunctionComponent<SummaryStatisticsTableProps> = (
    props: SummaryStatisticsTableProps
) => {
    const headers =
        props.labels.length === 1 ? (
            <th colSpan={2}>{props.labels[0]}</th>
        ) : (
            [<th />, props.labels.map(label => <th colSpan={1}>{label}</th>)]
        );
    return (
        <table className="table table-striped" style={{ minWidth: '400px' }}>
            <thead>
                <tr>{headers}</tr>
            </thead>
            <tbody>
                <tr>
                    <td>Maximum</td>
                    {props.data.map(d => (
                        <td>{_.round(d.max, 2)}</td>
                    ))}
                </tr>
                <tr>
                    <td>75% (q3)</td>
                    {props.data.map(d => (
                        <td>{_.round(d.q3, 2)}</td>
                    ))}
                </tr>
                <tr>
                    <td>Median</td>
                    {props.data.map(d => (
                        <td>{_.round(d.median, 2)}</td>
                    ))}
                </tr>
                <tr>
                    <td>25% (q1)</td>
                    {props.data.map(d => (
                        <td>{_.round(d.q1, 2)}</td>
                    ))}
                </tr>
                <tr>
                    <td>Minimum</td>
                    {props.data.map(d => (
                        <td>{_.round(d.min, 2)}</td>
                    ))}
                </tr>
            </tbody>
        </table>
    );
};

export const DescriptiveDataTable: FunctionComponent<DescriptiveDataTableProps> = (
    props: DescriptiveDataTableProps
) => {
    const headers =
        props.labels.length === 1 ? (
            <th colSpan={2}>{props.labels[0]}</th>
        ) : (
            [<th />, props.labels.map(label => <th colSpan={1}>{label}</th>)]
        );
    return (
        <div>
            <h3>Data description</h3>
            <table
                className="table table-striped"
                style={{ minWidth: '400px' }}
            >
                <thead>
                    <tr>{headers}</tr>
                </thead>
                <tbody>
                    <tr>
                        <td>Count</td>
                        {props.descriptiveData.map((d, index) => (
                            <td key={index}>{d.count}</td>
                        ))}
                    </tr>
                    <tr>
                        <td>Minimum</td>
                        {props.descriptiveData.map((d, index) => {
                            return <td key={index}>{_.round(d.minimum, 2)}</td>;
                        })}
                    </tr>
                    <tr>
                        <td>Maximum</td>
                        {props.descriptiveData.map((d, index) => {
                            return <td key={index}>{_.round(d.maximum, 2)}</td>;
                        })}
                    </tr>
                    <tr>
                        <td>Mean</td>
                        {props.descriptiveData.map((d, index) => {
                            return <td key={index}>{_.round(d.mean, 2)}</td>;
                        })}
                    </tr>
                    <tr>
                        <td>Standard Deviation</td>
                        {props.descriptiveData.map((d, index) => {
                            return (
                                <td key={index}>
                                    {_.round(d.stdDeviation, 2)}
                                </td>
                            );
                        })}
                    </tr>
                    <tr>
                        <td>Median</td>
                        {props.descriptiveData.map((d, index) => {
                            return <td key={index}>{_.round(d.median, 2)}</td>;
                        })}
                    </tr>
                    <tr>
                        <td>Mean Absolute Deviation</td>
                        {props.descriptiveData.map((d, index) => {
                            return <td key={index}>{_.round(d.mad, 2)}</td>;
                        })}
                    </tr>
                    <tr>
                        <td>25% (q1)</td>
                        {props.dataBoxplot.map((d, index) => (
                            <td key={index}>{_.round(d.q1, 2)}</td>
                        ))}
                    </tr>
                    <tr>
                        <td>75% (q3)</td>
                        {props.dataBoxplot.map((d, index) => (
                            <td key={index}>{_.round(d.q3, 2)}</td>
                        ))}
                    </tr>
                </tbody>
            </table>
        </div>
    );
};
