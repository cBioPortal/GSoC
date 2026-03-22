/**
 * Copyright (c) 2018 The Hyve B.V.
 * This code is licensed under the GNU Affero General Public License (AGPL),
 * version 3, or (at your option) any later version.
 *
 * This file is part of cBioPortal.
 *
 * cBioPortal is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 **/

import { computed, makeObservable } from 'mobx';
import { StructuralVariantExt } from 'shared/model/Fusion';
import ResultViewFusionMapperDataStore from './ResultsViewStructuralVariantMapperDataStore';
import {
    CancerStudy,
    Gene,
    MolecularProfile,
    StructuralVariant,
} from 'cbioportal-ts-api-client';
import { IOncoKbData } from 'cbioportal-utils';
import { CancerGene } from 'oncokb-ts-api-client';
import {
    labelMobxPromises,
    MobxPromise,
    remoteData,
} from 'cbioportal-frontend-commons';
import {
    fetchCanonicalTranscripts,
    fetchEnsemblTranscriptsByEnsemblFilter,
} from 'shared/lib/StoreUtils';
import {
    Exon,
    GenomeNexusAPI,
    GenomeNexusAPIInternal,
} from 'genome-nexus-ts-api-client';

export class ResultsViewStructuralVariantMapperStore {
    constructor(
        public gene: Gene,
        public studyIdToStudy: MobxPromise<{ [studyId: string]: CancerStudy }>,
        public molecularProfileIdToMolecularProfile: MobxPromise<{
            [molecularProfileId: string]: MolecularProfile;
        }>,
        public fusions: StructuralVariantExt[],
        public uniqueSampleKeyToTumorType: {
            [uniqueSampleKey: string]: string;
        },
        public structuralVariantOncoKbData: MobxPromise<IOncoKbData | Error>,
        public oncoKbCancerGenes: MobxPromise<CancerGene[] | Error>,
        public usingPublicOncoKbInstance: boolean,
        protected genomenexusClient?: GenomeNexusAPI,
        protected genomenexusInternalClient?: GenomeNexusAPIInternal
    ) {
        makeObservable(this);
        labelMobxPromises(this);
    }

    readonly ensemblTranscriptsByTranscriptIds = remoteData(
        {
            invoke: async () => {
                // Collect all transcript id's from the fusion data
                const transcriptIds = new Set<string>();
                this.fusions.forEach((fusion: StructuralVariant) => {
                    transcriptIds.add(fusion.site1EnsemblTranscriptId);
                    transcriptIds.add(fusion.site2EnsemblTranscriptId);
                });
                // Fetch ensembl transcript data with transcript ids as request params
                return await fetchEnsemblTranscriptsByEnsemblFilter(
                    {
                        transcriptIds: Array.from(transcriptIds),
                    },
                    this.genomenexusClient
                );
            },
        },
        []
    );

    readonly canonicalTranscriptsByHugoSymbols = remoteData(
        {
            invoke: async () => {
                // Collect all transcript id's from the fusion data
                const hugoSymbols = new Set<string>();
                this.fusions.forEach((fusion: StructuralVariant) => {
                    if (fusion.site1HugoSymbol)
                        hugoSymbols.add(fusion.site1HugoSymbol);
                    if (fusion.site2HugoSymbol)
                        hugoSymbols.add(fusion.site2HugoSymbol);
                });
                // Fetch ensembl transcript data with transcript ids as request params
                return await fetchCanonicalTranscripts(
                    Array.from(hugoSymbols),
                    'mskcc',
                    this.genomenexusClient
                );
            },
        },
        []
    );

    @computed
    get transcriptToExons(): Map<string, Exon[]> {
        const ensemblTranscripts = this.ensemblTranscriptsByTranscriptIds
            .result;
        const canonicalTranscripts = this.canonicalTranscriptsByHugoSymbols
            .result;
        const transcriptToExons = new Map<string, Exon[]>();

        ensemblTranscripts.forEach(transcript => {
            const transcriptId = transcript.transcriptId;
            transcriptToExons.set(transcriptId, transcript.exons);
        });
        canonicalTranscripts.forEach(transcript => {
            const hugoSymbol = transcript.hugoSymbols?.[0];
            transcriptToExons.set(hugoSymbol, transcript.exons);
        });

        return transcriptToExons;
    }

    @computed
    get dataStore(): ResultViewFusionMapperDataStore {
        const fusionData = (
            this.fusions || []
        ).map((fusion: StructuralVariant) => [fusion]);
        return new ResultViewFusionMapperDataStore(fusionData);
    }
}
