import { action, makeObservable, observable } from 'mobx';
import { observer } from 'mobx-react';
import * as React from 'react';
import { ComparisonGroup } from 'pages/groupComparison/GroupComparisonUtils';
import numeral from 'numeral';

interface IMutationOverlapOverlayProps {
    groupAMutatedCount: number;
    groupBMutatedCount: number;
    hugoGeneSymbol: string;
    proteinChange?: string;
    profiledPatientCounts: number[];
    groups: ComparisonGroup[];
    note?: string;
}

export const MutationOverlapOverlay: React.FC<IMutationOverlapOverlayProps> = observer(
    ({
        groupAMutatedCount,
        groupBMutatedCount,
        hugoGeneSymbol,
        proteinChange,
        profiledPatientCounts,
        groups,
    }: IMutationOverlapOverlayProps) => {
        return (
            <div>
                <h3>
                    {proteinChange
                        ? `${hugoGeneSymbol} mutations for ${proteinChange} in:`
                        : `${hugoGeneSymbol} mutations in:`}
                </h3>
                <table className={'table table-striped'}>
                    <tbody>
                        <tr>
                            <td>
                                <strong>{groups[0].nameWithOrdinal}: </strong>
                            </td>
                            <td>
                                {groupAMutatedCount} of{' '}
                                {profiledPatientCounts[0]} profiled {'patients'}{' '}
                                (
                                {numeral(
                                    (groupAMutatedCount /
                                        profiledPatientCounts[0]) *
                                        100
                                ).format('0.0')}
                                %)
                            </td>
                        </tr>
                        <tr>
                            <td>
                                <strong>{groups[1].nameWithOrdinal}: </strong>
                            </td>
                            <td>
                                {groupBMutatedCount} of{' '}
                                {profiledPatientCounts[1]} profiled {'patients'}{' '}
                                (
                                {numeral(
                                    (groupBMutatedCount /
                                        profiledPatientCounts[1]) *
                                        100
                                ).format('0.0')}
                                %)
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        );
    }
);
