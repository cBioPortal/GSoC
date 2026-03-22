import { getPercentage } from '../../../shared/lib/FormatUtils';
import * as React from 'react';
import {
    SampleList,
    Sample,
    CancerStudy,
    SampleIdentifier,
    Patient,
} from 'cbioportal-ts-api-client';
import _ from 'lodash';
import { buildCBioPortalPageUrl } from '../../../shared/api/urls';

export function getGeneSummary(hugoSymbols: string[]) {
    switch (hugoSymbols.length) {
        case 0:
            return '';
        case 1:
            return hugoSymbols[0];
        case 2:
            return hugoSymbols.join(' & ');
        default:
            return `${hugoSymbols[0]}, ${hugoSymbols[1]} & ${
                hugoSymbols.length === 3
                    ? hugoSymbols[2]
                    : `${hugoSymbols.length - 2} other genes`
            }`;
    }
}

export function getAlterationSummary(
    numSamples: number,
    numPatients: number,
    numAlteredSamples: number,
    numAlteredPatients: number,
    numGenes: number
) {
    const prefix = `Queried gene${numGenes !== 1 ? 's are' : ' is'} altered in`;
    const sampleSummaryPrefix = `${numAlteredSamples} (${getPercentage(
        numAlteredSamples / numSamples
    )}) of queried`;
    if (numSamples !== numPatients) {
        // note that by the pigeonhole principle, its not possible to have same number of samples and patients and
        //  for there to be more than one sample in a single patient. thus in the case that there are same # of samples
        //  and patients, it must be that numAlteredSamples === numAlteredPatients. Thus we're not hiding any info
        //  by only showing # altered patients if there are different # of samples and patients.
        return (
            <strong style={{ display: 'flex' }}>
                <span style={{ marginRight: 13 }}>{prefix}</span>
                <table>
                    <tr>
                        <td>
                            &#8226;&nbsp;
                            {`${numAlteredPatients} (${getPercentage(
                                numAlteredPatients / numPatients
                            )}) of queried patients`}
                        </td>
                    </tr>
                    <tr>
                        <td>&#8226;&nbsp;{`${sampleSummaryPrefix} samples`}</td>
                    </tr>
                </table>
            </strong>
        );
    } else {
        return (
            <strong>
                <span>{`${prefix} ${sampleSummaryPrefix} patients/samples`}</span>
            </strong>
        );
    }
}

export function submitToStudyViewPage(
    queriedStudies: Pick<CancerStudy, 'studyId'>[],
    samples: Pick<Sample, 'sampleId' | 'studyId'>[],
    samplesAreFiltered: boolean,
    hasVirtualStudies?: boolean,
    sampleLists?: Pick<SampleList, 'category'>[]
) {
    const hasAllCaseLists = _.some(
        sampleLists,
        sampleList => sampleList.category === 'all_cases_in_study'
    );
    const sampleIdentifiers: {
        sampleId: string;
        studyId: string;
    }[] = [];
    const shouldPassSampleFilter =
        samplesAreFiltered || hasVirtualStudies || !hasAllCaseLists;
    if (samples.length > 0 && shouldPassSampleFilter) {
        samples.forEach(sample =>
            sampleIdentifiers.push({
                sampleId: sample.sampleId,
                studyId: sample.studyId,
            })
        );
    }
    const studyPage = window.open(
        buildCBioPortalPageUrl(`study`, {
            id: queriedStudies.map(study => study.studyId).join(','),
        }),
        '_blank'
    );
    if (sampleIdentifiers.length > 0) {
        (studyPage as any).studyPageFilter = `filterJson=${JSON.stringify({
            sampleIdentifiers,
        })}`;
    }
}
