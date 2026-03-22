import * as React from 'react';
import * as d3 from 'd3';
import _ from 'lodash';
import {
    ComparisonGroup,
    convertPatientsStudiesAttrToSamples,
    excludePatients,
    excludeSamples,
    intersectPatients,
    intersectSamples,
    unionPatients,
    unionSamples,
} from './GroupComparisonUtils';
import ComplexKeyGroupsMap from '../../shared/lib/complexKeyDataStructures/ComplexKeyGroupsMap';
import { Sample } from 'cbioportal-ts-api-client';
import { SessionGroupData } from 'shared/api/session-service/sessionServiceModels';

export function regionIsSelected<T extends string | number>(
    regionComb: T[],
    selectedRegions: T[][]
) {
    return selectedRegions.find(r => _.isEqual(r, regionComb));
}

export function toggleRegionSelected<T extends string | number>(
    regionComb: T[],
    selectedRegions: T[][]
) {
    const withoutComb = selectedRegions.filter(r => !_.isEqual(r, regionComb));
    if (withoutComb.length === selectedRegions.length) {
        // combination currently not selected, so add it
        return selectedRegions.concat([regionComb]);
    } else {
        // combination was selected, so return version without it
        return withoutComb;
    }
}

export function getExcludedIndexes(
    combination: number[],
    numGroupsTotal: number
) {
    // get all indexes not in the given combination

    const excl = [];
    for (let i = 0; i < numGroupsTotal; i++) {
        if (!combination.includes(i)) {
            excl.push(i);
        }
    }
    return excl;
}

export function renderGroupNameWithOrdinal(
    group: Pick<ComparisonGroup, 'name' | 'ordinal'>,
    highlight?: boolean
) {
    return (
        <span>
            {group.ordinal.length > 0 && (
                <>
                    (<strong>{group.ordinal}</strong>)&nbsp;
                </>
            )}
            {highlight && (
                <span style={{ fontWeight: 'bold', fontStyle: 'italic' }}>
                    {group.name}
                </span>
            )}
            {!highlight && group.name}
        </span>
    );
}

export function joinGroupNames(
    groups: Pick<ComparisonGroup, 'name' | 'ordinal'>[],
    conj: string
) {
    const names = groups.map(group => renderGroupNameWithOrdinal(group, true));
    switch (names.length) {
        case 0:
            return <span></span>;
        case 1:
            return names[0];
        case 2:
            return (
                <span>
                    {names[0]} {conj} {names[1]}
                </span>
            );
        default:
            const beforeConj = names.slice(0, names.length - 1);
            return (
                <span>
                    {beforeConj.map(name => [name, ', '])}
                    {conj} {names[names.length - 1]}
                </span>
            );
    }
}

export function blendColors(colors: string[]) {
    // helper function for venn diagram drawing. In order to highlight set complements,
    //  we draw things from the bottom up - the visual exclusion simulates the complement,
    //  even though we don't explicitly draw the set complements in SVG. In order to make
    //  this work, no element can have less than 1 opacity - it would show that the entire
    //  set, not just the complement, is being highlighted and ruin the effect. Therefore...

    // TL;DR: We use this function to blend colors between groups, for the intersection regions.

    if (colors.length == 1) {
        return colors[0];
    }
    // blend between the first two,
    // then iteratively blend the next one with the previously blended color
    return _.reduce(
        colors.slice(2),
        (blendedColor, nextColor) => {
            return d3.interpolateLab(blendedColor, nextColor)(0.5);
        },
        d3.interpolateLab(colors[0], colors[1])(0.5)
    );
}

export function getTextColor(
    backgroundColor: string,
    inverse: boolean = false
) {
    const colors = ['black', 'white'];
    let colorIndex = 1;
    const rgb = d3.rgb(backgroundColor);
    const luminance = 0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b;
    if (luminance > 186) {
        // if luminance is high, use black text
        // https://stackoverflow.com/questions/3942878/how-to-decide-font-color-in-white-or-black-depending-on-background-color
        colorIndex = 0;
    }
    if (inverse) {
        colorIndex += 1;
    }
    return colors[colorIndex % 2];
}

export function getStudiesAttrForSampleOverlapGroup(
    availableGroups: (Pick<ComparisonGroup, 'uid'> &
        Pick<SessionGroupData, 'studies'>)[],
    includedRegions: string[][], // uid[][],
    allGroupsInPlot: string[] // uid[]
) {
    // compute set operations to find contents
    const groups = _.keyBy(availableGroups, g => g.uid);
    let studiesAttr: SessionGroupData['studies'] = [];
    for (const region of includedRegions) {
        let regionStudiesAttr: SessionGroupData['studies'] =
            groups[region[0]].studies;
        // intersect
        for (let i = 1; i < region.length; i++) {
            regionStudiesAttr = intersectSamples(
                regionStudiesAttr,
                groups[region[i]].studies
            );
        }
        // exclude
        for (const uid of allGroupsInPlot) {
            if (!region.includes(uid)) {
                regionStudiesAttr = excludeSamples(
                    regionStudiesAttr,
                    groups[uid].studies
                );
            }
        }
        studiesAttr = unionSamples(studiesAttr, regionStudiesAttr);
    }
    return studiesAttr;
}

export function getStudiesAttrForPatientOverlapGroup(
    availableGroups: (Pick<ComparisonGroup, 'uid'> & {
        studies: { id: string; patients: string[] }[];
    })[],
    includedRegions: string[][], // uid[][]
    allGroupsInVenn: string[], // uid[]
    patientToSamplesSet: ComplexKeyGroupsMap<Pick<Sample, 'sampleId'>>
) {
    // compute set operations to find contents
    const groups = _.keyBy(availableGroups, g => g.uid);
    let studiesAttr: { id: string; patients: string[] }[] = [];
    for (const region of includedRegions) {
        let regionStudiesAttr: { id: string; patients: string[] }[] =
            groups[region[0]].studies;
        // intersect
        for (let i = 1; i < region.length; i++) {
            regionStudiesAttr = intersectPatients(
                regionStudiesAttr,
                groups[region[i]].studies
            );
        }
        // exclude
        for (const uid of allGroupsInVenn) {
            if (!region.includes(uid)) {
                regionStudiesAttr = excludePatients(
                    regionStudiesAttr,
                    groups[uid].studies
                );
            }
        }
        studiesAttr = unionPatients(studiesAttr, regionStudiesAttr);
    }
    return convertPatientsStudiesAttrToSamples(
        studiesAttr,
        patientToSamplesSet
    );
}
