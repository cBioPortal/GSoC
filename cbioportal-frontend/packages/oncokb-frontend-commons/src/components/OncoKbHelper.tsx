import * as React from 'react';
import {
    normalizeLevel,
    mergeAlterations,
    getPositionalVariant,
} from '../util/OncoKbUtils';
import Tooltip from 'rc-tooltip';
import _ from 'lodash';
import {
    defaultArraySortMethod,
    defaultSortMethod,
    LEVELS,
} from '../util/OncoKbUtils';
import { OncoKbCardDataType } from '../model/OncoKB';
import LevelIcon from './icon/LevelIcon';

export default class OncoKbHelper {
    public static get TX_LEVELS(): string[] {
        return ['1', '2', '3A', '3B', '4', 'R1', 'R2'];
    }

    public static get DX_LEVELS(): string[] {
        return ['Dx1', 'Dx2', 'Dx3'];
    }

    public static get PX_LEVELS(): string[] {
        return ['Px1', 'Px2', 'Px3'];
    }

    public static get LEVELS(): string[] {
        return [...this.TX_LEVELS, ...this.DX_LEVELS, ...this.PX_LEVELS];
    }

    public static getLevelsDesc(dataType: OncoKbCardDataType) {
        switch (dataType) {
            case OncoKbCardDataType.TXS:
            case OncoKbCardDataType.TXR:
                return _.pick(this.LEVEL_DESC, this.TX_LEVELS);
            case OncoKbCardDataType.DX:
                return _.pick(this.LEVEL_DESC, this.DX_LEVELS);
            case OncoKbCardDataType.PX:
                return _.pick(this.LEVEL_DESC, this.PX_LEVELS);
            default:
                return {};
        }
    }

    public static get LEVEL_DESC(): { [level: string]: JSX.Element } {
        return {
            '1': (
                <span>
                    <b>FDA-recognized</b> biomarker predictive of response to an{' '}
                    <b>FDA-approved drug</b> in this indication
                </span>
            ),
            '2': (
                <span>
                    <b>Standard care</b> biomarker recommended by the NCCN or
                    other expert panels predictive of response to an{' '}
                    <b>FDA-approved drug</b> in this indication
                </span>
            ),
            '3A': (
                <span>
                    <b>Compelling clinical evidence</b> supports the biomarker
                    as being predictive of response to a drug in this indication
                </span>
            ),
            '3B': (
                <span>
                    <b>Standard care</b> or <b>investigational</b> biomarker{' '}
                    predictive of response to an <b>FDA-approved</b> or{' '}
                    <b>investigational</b> drug in another indication
                </span>
            ),
            '4': (
                <span>
                    <b>Compelling biological evidence</b> supports the biomarker
                    as being predictive of response to a drug
                </span>
            ),
            R1: (
                <span>
                    <b>Standard care</b> biomarker predictive of{' '}
                    <b>resistance</b> to an <b>FDA-approved</b> drug{' '}
                    <b>in this indication</b>
                </span>
            ),
            R2: (
                <span>
                    <b>Compelling clinical evidence</b> supports the biomarker
                    as being predictive of <b>resistance</b> to a drug
                </span>
            ),
            Dx1: (
                <span>
                    <b>FDA and/or professional guideline-recognized</b>{' '}
                    biomarker required for diagnosis in this indication
                </span>
            ),
            Dx2: (
                <span>
                    <b>FDA and/or professional guideline-recognized</b>{' '}
                    biomarker that supports diagnosis in this indication
                </span>
            ),
            Dx3: (
                <span>
                    Biomarker that <b>may assist disease diagnosis</b> in this
                    indication based on <b>clinical evidence</b>
                </span>
            ),
            Px1: (
                <span>
                    <b>FDA and/or professional guideline-recognized</b>{' '}
                    biomarker prognostic in this indication based on{' '}
                    <b>well-powered studie(s)</b>
                </span>
            ),
            Px2: (
                <span>
                    <b>FDA and/or professional guideline-recognized</b>{' '}
                    biomarker prognostic in this indication based on{' '}
                    <b>a single or multiple small studies</b>
                </span>
            ),
            Px3: (
                <span>
                    Biomarker is prognostic in this indication based on{' '}
                    <b>clinical evidence</b> in <b>well-powered studies</b>
                </span>
            ),
        };
    }

    public static getDefaultColumnDefinition(
        columnKey: 'level' | 'alterations'
    ) {
        switch (columnKey) {
            case 'level':
                return {
                    id: 'level',
                    Header: <div style={{ textAlign: 'center' }}>Level</div>,
                    accessor: 'level',
                    maxWidth: 45,
                    sortMethod: (a: string, b: string) =>
                        defaultSortMethod(
                            LEVELS.all.indexOf(normalizeLevel(a) || ''),
                            LEVELS.all.indexOf(normalizeLevel(b) || '')
                        ),
                    Cell: (props: { value: string }) => {
                        const normalizedLevel =
                            normalizeLevel(props.value) || '';
                        return (
                            <LevelIcon
                                level={normalizedLevel}
                                showDescription
                            />
                        );
                    },
                };
            case 'alterations':
                return {
                    id: 'alterations',
                    Header: <span>Alteration(s)</span>,
                    accessor: 'alterations',
                    minWidth: 80,
                    sortMethod: (a: string[], b: string[]) =>
                        defaultArraySortMethod(a, b),
                };
        }
    }

    public static getAlterationsColumnCell = (
        alterations: string[],
        variant: string
    ) => {
        const mergedAlteration = mergeAlterations(alterations);
        let content = <span>{mergedAlteration}</span>;
        if (alterations.length > 5) {
            const lowerCasedQueryVariant = variant.toLowerCase();
            let matchedAlteration = _.find(
                alterations,
                alteration =>
                    alteration.toLocaleLowerCase() === lowerCasedQueryVariant
            );
            if (!matchedAlteration) {
                matchedAlteration = getPositionalVariant(variant);
            }
            let pickedAlteration =
                matchedAlteration === undefined
                    ? alterations[0]
                    : matchedAlteration;
            content = (
                <span>
                    {pickedAlteration} and{' '}
                    <Tooltip
                        overlay={
                            <div style={{ maxWidth: '400px' }}>
                                {mergedAlteration}
                            </div>
                        }
                        placement="right"
                        destroyTooltipOnHide={true}
                    >
                        <a>{alterations.length - 1} other alterations</a>
                    </Tooltip>
                </span>
            );
        }
        return (
            <div style={{ whiteSpace: 'normal', lineHeight: '1rem' }}>
                {content}
            </div>
        );
    };
}
