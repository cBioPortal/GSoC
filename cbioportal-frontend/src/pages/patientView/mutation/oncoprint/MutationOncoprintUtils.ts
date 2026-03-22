import { Mutation, Sample } from 'cbioportal-ts-api-client';
import _ from 'lodash';
import { generateMutationIdByGeneAndProteinChangeAndEvent } from '../../../../shared/lib/StoreUtils';
import { CoverageInformation } from '../../../../shared/lib/GenePanelUtils';
import {
    IGeneHeatmapTrackDatum,
    IHeatmapTrackSpec,
} from '../../../../shared/components/oncoprint/Oncoprint';
import { isSampleProfiled } from '../../../../shared/lib/isSampleProfiled';
import { MutationStatus } from '../PatientViewMutationsTabUtils';
import { getVariantAlleleFrequency } from '../../../../shared/lib/MutationUtils';
import { MutationOncoprintMode } from './MutationOncoprint';
import { ShapeParams } from 'oncoprintjs/dist/js/oncoprintshape';

export interface IMutationOncoprintTrackDatum extends IGeneHeatmapTrackDatum {
    mutation: Mutation;
    mutationStatus: MutationStatus;
    mutationId: string;
}

export const MUTATION_ONCOPRINT_NA_SHAPES: ShapeParams[] = [
    {
        type: 'rectangle',
        fill: [255, 255, 255, 1],
        z: 1000,
    },
    {
        type: 'line',
        stroke: [190, 190, 190, 1],
        'stroke-width': 1,
        x1: 20,
        x2: 80,
        y1: 50,
        y2: 50,
        z: 1000,
    },
];

export interface IMutationOncoprintTrackSpec extends IHeatmapTrackSpec {
    data: IMutationOncoprintTrackDatum[];
}

export function getMutationLabel(mutation: Mutation) {
    return `${mutation.gene.hugoGeneSymbol} ${mutation.proteinChange}`;
}

export function makeMutationHeatmapData(
    samples: Sample[],
    mutations: Mutation[],
    coverageInformation: CoverageInformation,
    mode: MutationOncoprintMode
) {
    const mutationsByKey = _.keyBy(
        mutations,
        generateMutationIdByGeneAndProteinChangeAndEvent
    );
    const mutationsBySample = _.groupBy(mutations, m => m.uniqueSampleKey);
    const mutationHasAtLeastOneVAF = _.mapValues(mutationsByKey, () => false);

    let oncoprintData: IMutationOncoprintTrackDatum[] = [];
    for (const sample of samples) {
        const sampleMutations = mutationsBySample[sample.uniqueSampleKey] || [];
        const mutationKeys: { [mutationId: string]: boolean } = {};
        for (const mutation of sampleMutations) {
            const mutationId = generateMutationIdByGeneAndProteinChangeAndEvent(
                mutation
            );
            const uid =
                mode === MutationOncoprintMode.SAMPLE_TRACKS
                    ? mutationId
                    : sample.sampleId;
            const isUncalled =
                mutation.mutationStatus.toLowerCase() === 'uncalled';
            if (!isUncalled || mutation.tumorAltCount > 0) {
                mutationKeys[mutationId] = true;
                let vafReport = getVariantAlleleFrequency(mutation);

                let mutationStatus;
                if (isUncalled) {
                    mutationStatus =
                        MutationStatus.PROFILED_WITH_READS_BUT_UNCALLED;
                } else if (vafReport === null) {
                    mutationStatus = MutationStatus.MUTATED_BUT_NO_VAF;
                } else {
                    mutationStatus = MutationStatus.MUTATED_WITH_VAF;
                    mutationHasAtLeastOneVAF[mutationId] = true;
                }

                oncoprintData.push({
                    profile_data: vafReport ? vafReport.vaf : null,
                    sample: sample.sampleId,
                    patient: sample.patientId,
                    study_id: sample.studyId,
                    hugo_gene_symbol: '', // not used by us
                    mutation,
                    uid,
                    mutationId,
                    mutationStatus,
                });
            }
        }

        // fill in data for missing mutations

        const noData = Object.keys(mutationsByKey)
            .filter(key => !(key in mutationKeys))
            .map(key => mutationsByKey[key]);

        for (const mutation of noData) {
            const mutationId = generateMutationIdByGeneAndProteinChangeAndEvent(
                mutation
            );
            const uid =
                mode === MutationOncoprintMode.SAMPLE_TRACKS
                    ? mutationId
                    : sample.sampleId;
            const isProfiledForGene = isSampleProfiled(
                sample.uniqueSampleKey,
                mutation.molecularProfileId,
                mutation.gene.hugoGeneSymbol,
                coverageInformation
            );
            oncoprintData.push({
                profile_data: null,
                sample: sample.sampleId,
                patient: sample.patientId,
                study_id: sample.studyId,
                hugo_gene_symbol: '', // not used by us
                mutation,
                uid,
                mutationId,
                mutationStatus: isProfiledForGene
                    ? MutationStatus.PROFILED_BUT_NOT_MUTATED
                    : MutationStatus.NOT_PROFILED,
                na: !isProfiledForGene,
            });
        }
    }

    // filter out data for mutations where none of them have data
    oncoprintData = oncoprintData.filter(
        d => mutationHasAtLeastOneVAF[d.mutationId]
    );

    // group data by track
    if (mode === MutationOncoprintMode.SAMPLE_TRACKS) {
        return _.groupBy(oncoprintData, d => d.sample);
    } else {
        return _.groupBy(oncoprintData, d => d.mutationId);
    }
}

export function getDownloadData(data: IMutationOncoprintTrackDatum[]) {
    const downloadData = [];
    downloadData.push([
        'Sample_ID',
        'Gene',
        'Protein_Change',
        'Variant_Allele_Frequency',
    ]);
    for (const datum of data) {
        if (datum.profile_data !== null) {
            downloadData.push([
                datum.sample,
                datum.mutation.gene.hugoGeneSymbol,
                datum.mutation.proteinChange,
                datum.profile_data,
            ]);
        }
    }
    return downloadData.map(line => line.join('\t')).join('\n');
}
