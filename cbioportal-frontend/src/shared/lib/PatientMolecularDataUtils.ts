import { Sample } from 'cbioportal-ts-api-client';
import MobxPromiseCache from '../lib/MobxPromiseCache';
import _ from 'lodash';

export interface PatientMolecularData {
    mutations: any[];
    cnas: any[];
    svs: any[];
    hasAnyAlteration: boolean;
}

export interface MolecularDataStore {
    annotatedMutationCache?: MobxPromiseCache<{ entrezGeneId: number }, any[]>;
    annotatedCnaCache?: MobxPromiseCache<{ entrezGeneId: number }, any[]>;
    structuralVariantCache?: MobxPromiseCache<{ entrezGeneId: number }, any[]>;
}

/**
 * Gets molecular data for a specific gene from store caches (synchronous version for cached data)
 * This provides a standard way for tabs to access molecular data from StudyViewPageStore or ResultsViewPageStore
 */
export function getMolecularDataForGeneSync(
    entrezGeneId: number,
    store: MolecularDataStore,
    options: {
        mutationTypeEnabled?: boolean;
        copyNumberEnabled?: boolean;
        structuralVariantEnabled?: boolean;
    } = {}
): {
    mutations: any[];
    cnas: any[];
    svs: any[];
} {
    const {
        mutationTypeEnabled = true,
        copyNumberEnabled = true,
        structuralVariantEnabled = true,
    } = options;

    let mutations: any[] = [];
    let cnas: any[] = [];
    let svs: any[] = [];

    // Get mutations if enabled and cache exists
    if (mutationTypeEnabled && store.annotatedMutationCache) {
        const mutationCacheResult = store.annotatedMutationCache.get({
            entrezGeneId,
        });

        if (mutationCacheResult?.isComplete && mutationCacheResult.result) {
            mutations = mutationCacheResult.result;
        }
    }

    // Get CNAs if enabled and cache exists
    if (copyNumberEnabled && store.annotatedCnaCache) {
        const cnaCacheResult = store.annotatedCnaCache.get({ entrezGeneId });
        if (cnaCacheResult?.isComplete && cnaCacheResult.result) {
            cnas = cnaCacheResult.result;
        }
    }

    // Get structural variants if enabled and cache exists
    if (structuralVariantEnabled && store.structuralVariantCache) {
        const svCacheResult = store.structuralVariantCache.get({
            entrezGeneId,
        });
        if (svCacheResult?.isComplete && svCacheResult.result) {
            svs = svCacheResult.result;
        }
    }

    return { mutations, cnas, svs };
}

/**
 * Gets molecular data for a specific gene from store caches (async version)
 * This provides a standard way for tabs to access molecular data from StudyViewPageStore or ResultsViewPageStore
 */
export async function getMolecularDataForGene(
    entrezGeneId: number,
    store: MolecularDataStore,
    options: {
        mutationTypeEnabled?: boolean;
        copyNumberEnabled?: boolean;
        structuralVariantEnabled?: boolean;
    } = {}
): Promise<{
    mutations: any[];
    cnas: any[];
    svs: any[];
}> {
    // For now, just call the sync version since we're dealing with cached data
    // This can be extended later if we need true async behavior
    return getMolecularDataForGeneSync(entrezGeneId, store, options);
}

/**
 * Aggregates molecular data at the patient level using union approach (same as Results View)
 * This utility can be used by any component that needs patient-level molecular data
 */
export function aggregateMolecularDataByPatient(
    allSamples: Sample[],
    allMutations: any[],
    allCnas: any[],
    allSvs: any[]
): Map<string, PatientMolecularData> {
    const patientMolecularDataMap = new Map<string, PatientMolecularData>();

    // Group samples by patient
    const patientToSamplesMap = new Map<string, Sample[]>();
    allSamples.forEach(sample => {
        if (!patientToSamplesMap.has(sample.patientId)) {
            patientToSamplesMap.set(sample.patientId, []);
        }
        patientToSamplesMap.get(sample.patientId)!.push(sample);
    });

    // Index molecular data by sample key for O(1) lookups
    const mutationsBySample = new Map<string, any[]>();
    const cnasBySample = new Map<string, any[]>();
    const svsBySample = new Map<string, any[]>();

    // Index mutations by sample key
    allMutations.forEach(m => {
        const sampleKey = `${m.studyId}:${m.sampleId}`;
        if (!mutationsBySample.has(sampleKey)) {
            mutationsBySample.set(sampleKey, []);
        }
        mutationsBySample.get(sampleKey)!.push(m);
    });

    // Index CNAs by sample key
    allCnas.forEach(c => {
        const sampleKey = `${c.studyId}:${c.sampleId}`;
        if (!cnasBySample.has(sampleKey)) {
            cnasBySample.set(sampleKey, []);
        }
        cnasBySample.get(sampleKey)!.push(c);
    });

    // Index SVs by sample key
    allSvs.forEach(sv => {
        const sampleKey = `${sv.studyId}:${sv.sampleId}`;
        if (!svsBySample.has(sampleKey)) {
            svsBySample.set(sampleKey, []);
        }
        svsBySample.get(sampleKey)!.push(sv);
    });

    // Aggregate molecular data by patient (union approach)
    patientToSamplesMap.forEach((samples, patientId) => {
        const patientMutations: any[] = [];
        const patientCnas: any[] = [];
        const patientSvs: any[] = [];

        // Aggregate all alterations across patient's samples
        samples.forEach(sample => {
            const sampleKey = `${sample.studyId}:${sample.sampleId}`;

            // O(1) lookup instead of O(n) filter
            const sampleMutations = mutationsBySample.get(sampleKey) || [];
            patientMutations.push(...sampleMutations);

            const sampleCnas = cnasBySample.get(sampleKey) || [];
            patientCnas.push(...sampleCnas);

            const sampleSvs = svsBySample.get(sampleKey) || [];
            patientSvs.push(...sampleSvs);
        });

        // Store aggregated patient data
        patientMolecularDataMap.set(patientId, {
            mutations: patientMutations,
            cnas: patientCnas,
            svs: patientSvs,
            hasAnyAlteration:
                patientMutations.length > 0 ||
                patientCnas.length > 0 ||
                patientSvs.length > 0,
        });
    });

    return patientMolecularDataMap;
}

/**
 * Creates a fast lookup map from patients to samples
 */
export function createSampleLookupMap(
    allSamples: Sample[]
): Map<string, Sample> {
    const sampleLookupMap = new Map<string, Sample>();
    allSamples.forEach(sample => {
        sampleLookupMap.set(sample.patientId, sample);
    });
    return sampleLookupMap;
}

/**
 * Creates a lookup map for samples by sampleId (for sample-level embeddings)
 */
export function createSampleIdLookupMap(
    allSamples: Sample[]
): Map<string, Sample> {
    const sampleLookupMap = new Map<string, Sample>();
    allSamples.forEach(sample => {
        sampleLookupMap.set(sample.sampleId, sample);
    });
    return sampleLookupMap;
}

/**
 * Pre-computes clinical data colors and values for fast O(1) lookup
 * Handles both sample-level and patient-level attributes
 */
export function preComputeClinicalDataMaps(
    clinicalData: any[],
    categoryToColor?: { [key: string]: string } | null,
    numericalValueToColor?: (value: number) => string,
    isPatientAttribute: boolean = false
): {
    colorMap: Map<string, string>;
    valueMap: Map<string, string>;
    patientColorMap?: Map<string, string>;
    patientValueMap?: Map<string, string>;
} {
    const clinicalDataColorMap = new Map<string, string>();
    const clinicalDataValueMap = new Map<string, string>();
    const patientColorMap = new Map<string, string>();
    const patientValueMap = new Map<string, string>();

    if (clinicalData) {
        clinicalData.forEach(data => {
            const sampleKey = `${data.studyId}:${data.sampleId}`;
            let color = '#BEBEBE'; // Default

            if (categoryToColor) {
                color = categoryToColor[data.value] || '#BEBEBE';
            } else if (numericalValueToColor) {
                const numValue = parseFloat(data.value);
                if (!isNaN(numValue)) {
                    color = numericalValueToColor(numValue);
                }
            }

            // Store both color and value for O(1) lookup by sample key
            clinicalDataColorMap.set(sampleKey, color);
            clinicalDataValueMap.set(sampleKey, data.value || 'Unknown');

            // For patient attributes, also store by patient ID
            if (isPatientAttribute && data.patientId) {
                patientColorMap.set(data.patientId, color);
                patientValueMap.set(data.patientId, data.value || 'Unknown');
            }
        });
    }

    return {
        colorMap: clinicalDataColorMap,
        valueMap: clinicalDataValueMap,
        patientColorMap: isPatientAttribute ? patientColorMap : undefined,
        patientValueMap: isPatientAttribute ? patientValueMap : undefined,
    };
}
