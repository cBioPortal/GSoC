import {
    ClinicalTrackDatum,
    GeneticTrackDatum,
    GeneticTrackDatum_Data,
    IHeatmapTrackSpec,
} from '../../../../shared/components/oncoprint/Oncoprint';
import {
    isType2,
    OncoprinterGeneticInputLine,
    OncoprinterGeneticInputLineType2,
} from './OncoprinterGeneticUtils';
import { ClinicalAttribute } from 'cbioportal-ts-api-client';
import { isNotGermlineMutation } from '../../../../shared/lib/MutationUtils';
import { AlterationTypeConstants } from 'shared/constants';
import { getOncoprintMutationType } from '../../../../shared/components/oncoprint/DataUtils';
import { cna_profile_data_to_string } from '../../../../shared/lib/oql/AccessorsForOqlFilter';
import {
    ClinicalTrackDataType,
    HeatmapTrackDataType,
    ONCOPRINTER_VAL_NA,
} from './OncoprinterClinicalAndHeatmapUtils';
import _ from 'lodash';
import {
    MUTATION_SPECTRUM_CATEGORIES,
    SpecialAttribute,
} from '../../../../shared/cache/ClinicalDataCache';
import { PUTATIVE_DRIVER } from 'shared/lib/StoreUtils';
import { ONCOKB_ONCOGENIC_LOWERCASE } from 'pages/resultsView/ResultsViewPageStoreUtils';

const geneticAlterationToDataType: {
    [alterationType in OncoprinterGeneticInputLineType2['alteration']]: string;
} = {
    missense: AlterationTypeConstants.MUTATION_EXTENDED,
    inframe: AlterationTypeConstants.MUTATION_EXTENDED,
    structuralVariant: AlterationTypeConstants.STRUCTURAL_VARIANT,
    promoter: AlterationTypeConstants.MUTATION_EXTENDED,
    trunc: AlterationTypeConstants.MUTATION_EXTENDED,
    splice: AlterationTypeConstants.MUTATION_EXTENDED,
    other: AlterationTypeConstants.MUTATION_EXTENDED,
    amp: AlterationTypeConstants.COPY_NUMBER_ALTERATION,
    homdel: AlterationTypeConstants.COPY_NUMBER_ALTERATION,
    gain: AlterationTypeConstants.COPY_NUMBER_ALTERATION,
    hetloss: AlterationTypeConstants.COPY_NUMBER_ALTERATION,
    mrnaHigh: AlterationTypeConstants.MRNA_EXPRESSION,
    mrnaLow: AlterationTypeConstants.MRNA_EXPRESSION,
    protHigh: AlterationTypeConstants.PROTEIN_LEVEL,
    protLow: AlterationTypeConstants.PROTEIN_LEVEL,
};

function getHeatmapType(
    molecularProfileId: string,
    molecularAlterationType: string
) {
    //console.log(molecularProfileId, molecularAlterationType);
    if (/zscores/i.test(molecularProfileId)) {
        return HeatmapTrackDataType.HEATMAP_ZSCORE;
    } else {
        switch (molecularAlterationType) {
            case AlterationTypeConstants.METHYLATION:
                return HeatmapTrackDataType.HEATMAP_01;
            default:
                return HeatmapTrackDataType.HEATMAP;
        }
    }
}

function getOncoprinterParsedGeneticInputLine(
    d: GeneticTrackDatum_Data,
    trackLabel: string,
    caseId: string
): OncoprinterGeneticInputLine {
    const alteration = getOncoprinterGeneticAlteration(d);
    if (alteration) {
        const oncoprinterInput: Partial<OncoprinterGeneticInputLineType2> = {};
        oncoprinterInput.sampleId = caseId;

        if (
            d.molecularProfileAlterationType ===
            AlterationTypeConstants.STRUCTURAL_VARIANT
        ) {
            // For structural variants, combine both gene symbols if available
            // This ensures proper OncoKB annotation for fusions
            const genes = [];
            if (d.site1HugoSymbol) genes.push(d.site1HugoSymbol);
            if (d.site2HugoSymbol) genes.push(d.site2HugoSymbol);
            oncoprinterInput.hugoGeneSymbol /* @ts-ignore */ = genes.join('-');
        } else {
            oncoprinterInput.hugoGeneSymbol = d.hugoGeneSymbol;
        }

        oncoprinterInput.trackName = trackLabel;
        oncoprinterInput.alteration = alteration;
        oncoprinterInput.proteinChange = d.proteinChange;
        oncoprinterInput.eventInfo = d.eventInfo;
        oncoprinterInput.isGermline = !isNotGermlineMutation(d);
        // Check for driver status from multiple sources:
        // 1. driverFilter for custom driver annotations on mutations
        // 2. putativeDriver boolean computed during annotation
        // 3. oncoKbOncogenic for OncoKB-annotated drivers (especially for SVs)
        const isOncoKbDriver =
            !!d.oncoKbOncogenic &&
            ONCOKB_ONCOGENIC_LOWERCASE.includes(d.oncoKbOncogenic.toLowerCase());
        oncoprinterInput.isCustomDriver =
            d.driverFilter === PUTATIVE_DRIVER ||
            d.putativeDriver === true ||
            isOncoKbDriver;
        return oncoprinterInput as OncoprinterGeneticInputLineType2;
    } else {
        return { sampleId: caseId };
    }
}

function getOncoprinterGeneticAlteration(d: GeneticTrackDatum_Data) {
    let alteration:
        | OncoprinterGeneticInputLineType2['alteration']
        | null = null;
    switch (d.molecularProfileAlterationType) {
        case AlterationTypeConstants.MUTATION_EXTENDED:
            alteration = getOncoprintMutationType(d);
            break;
        case AlterationTypeConstants.STRUCTURAL_VARIANT:
            alteration = 'structuralVariant';
            break;
        case AlterationTypeConstants.COPY_NUMBER_ALTERATION:
            alteration = cna_profile_data_to_string[d.value];
            break;
        case AlterationTypeConstants.MRNA_EXPRESSION:
            if (d.alterationSubType === 'high') {
                alteration = 'mrnaHigh';
            } else if (d.alterationSubType === 'low') {
                alteration = 'mrnaLow';
            }
            break;
        case AlterationTypeConstants.PROTEIN_LEVEL:
            if (d.alterationSubType === 'high') {
                alteration = 'protHigh';
            } else if (d.alterationSubType === 'low') {
                alteration = 'protLow';
            }
            break;
    }
    return alteration;
}

function getOncoprinterGeneticInputLine(parsed: OncoprinterGeneticInputLine) {
    const line = [parsed.sampleId];
    if (isType2(parsed)) {
        line.push(parsed.hugoGeneSymbol);
        switch (geneticAlterationToDataType[parsed.alteration]) {
            case AlterationTypeConstants.MUTATION_EXTENDED:
                line.push(parsed.proteinChange || 'mutation');
                line.push(
                    parsed.alteration.toUpperCase() +
                        (parsed.isGermline ? '_GERMLINE' : '') +
                        (parsed.isCustomDriver ? '_DRIVER' : '')
                );
                break;
            case AlterationTypeConstants.COPY_NUMBER_ALTERATION:
                line.push(parsed.alteration.toUpperCase());
                line.push('CNA');
                break;
            case AlterationTypeConstants.MRNA_EXPRESSION:
                line.push(parsed.alteration === 'mrnaHigh' ? 'HIGH' : 'LOW');
                line.push('EXP');
                break;
            case AlterationTypeConstants.PROTEIN_LEVEL:
                line.push(parsed.alteration === 'protHigh' ? 'HIGH' : 'LOW');
                line.push('PROT');
                break;
            case AlterationTypeConstants.STRUCTURAL_VARIANT:
                line.push(parsed.eventInfo || 'structural_variant');
                line.push('FUSION' + (parsed.isCustomDriver ? '_DRIVER' : ''));
                break;
        }
        if (parsed.trackName) {
            line.push(parsed.trackName);
        }
    }
    return line.map(sanitizeColumnData).join('  ');
}

export function generateUniqueLabel(
    trackLabel: string,
    usedLabelCount: { [label: string]: number }
) {
    // Adds numbers to the end of `trackLabel` to get to a unique label
    let label = trackLabel;
    usedLabelCount[label] = usedLabelCount[label] || 0;
    usedLabelCount[label] += 1;

    while (usedLabelCount[label] > 1) {
        // if this label is already used, disambiguate, then increment the counter
        //  then try again
        label = `${label}_${usedLabelCount[label]}`;
        usedLabelCount[label] = usedLabelCount[label] || 0;
        usedLabelCount[label] += 1;
    }

    return label;
}

export function getOncoprinterGeneticInput(
    oncoprintData: {
        label: string;
        data: Pick<GeneticTrackDatum, 'data' | 'sample' | 'patient'>[];
    }[],
    caseIds: string[],
    sampleOrPatient: 'sample' | 'patient'
) {
    // handle case where tracks have same label
    const usedLabelCount: { [trackLabel: string]: number } = {};

    const parsedLines = _.flatMapDeep(oncoprintData, track => {
        const label = generateUniqueLabel(track.label, usedLabelCount);

        return track.data.map(oncoprintDatum =>
            oncoprintDatum.data.map(d => {
                return getOncoprinterParsedGeneticInputLine(
                    d,
                    label,
                    oncoprintDatum[sampleOrPatient] as string
                );
            })
        );
    });
    return parsedLines
        .map(getOncoprinterGeneticInputLine)
        .concat(caseIds)
        .join('\n');
}

function sanitizeColumnData(s: string) {
    // take out spaces
    return s.replace(/\s+/g, '_');
}

function sanitizeColumnName(s: string) {
    // take out parentheses and spaces
    return s.replace(/[()]/g, '').replace(/\s+/g, '_');
}

export function getOncoprinterHeatmapInput(
    heatmapTracks: IHeatmapTrackSpec[],
    caseIds: string[],
    sampleOrPatient: 'sample' | 'patient'
) {
    const heatmapTrackToCaseToHeatmapData = _.mapValues(
        _.keyBy(heatmapTracks, t => t.key),
        track => _.keyBy(track.data, d => d[sampleOrPatient])
    );
    const rows: any[] = [];
    // header row
    rows.push(
        ['Sample'].concat(
            heatmapTracks.map(
                track =>
                    `${sanitizeColumnName(
                        `${track.label}_${track.molecularProfileName}`
                    )}(${getHeatmapType(
                        track.molecularProfileId,
                        track.molecularAlterationType
                    )})`
            )
        )
    );

    // data
    for (const caseId of caseIds) {
        rows.push(
            [caseId as any].concat(
                heatmapTracks.map(track => {
                    const datum =
                        heatmapTrackToCaseToHeatmapData[track.key][caseId];
                    if (
                        !datum ||
                        datum.na ||
                        datum.profile_data === null ||
                        isNaN(datum.profile_data)
                    ) {
                        return ONCOPRINTER_VAL_NA;
                    }

                    return datum.profile_data;
                })
            )
        );
    }

    return rows.map(row => row.join('  ')).join('\n');
}

export function getOncoprinterClinicalInput(
    clinicalData: ClinicalTrackDatum[],
    caseIds: string[],
    attributeIds: string[],
    attributeIdToAttribute: {
        [attributeId: string]: Pick<
            ClinicalAttribute,
            'displayName' | 'datatype' | 'clinicalAttributeId'
        >;
    },
    sampleOrPatient: 'sample' | 'patient'
): string {
    const caseToClinicalData = _.groupBy(clinicalData, d => d[sampleOrPatient]);
    const rows: any[] = [];
    // header row
    rows.push(
        ['Sample'].concat(
            attributeIds.map(attributeId => {
                const attribute = attributeIdToAttribute[attributeId];
                const name = sanitizeColumnName(attribute.displayName);
                let datatype = attribute.datatype.toLowerCase();
                if (attribute.clinicalAttributeId === 'MUTATION_COUNT') {
                    datatype = ClinicalTrackDataType.LOG_NUMBER;
                }
                if (
                    attribute.clinicalAttributeId ===
                    SpecialAttribute.MutationSpectrum
                ) {
                    datatype = MUTATION_SPECTRUM_CATEGORIES.join('/');
                }
                return `${name}(${datatype})`;
            })
        )
    );
    // data
    for (const caseId of caseIds) {
        rows.push(
            [caseId as any].concat(
                attributeIds.map(attributeId => {
                    const datum =
                        caseToClinicalData[caseId] &&
                        caseToClinicalData[caseId].find(
                            d => d.attr_id === attributeId
                        );

                    if (!datum || datum.na || !datum.attr_val) {
                        return ONCOPRINTER_VAL_NA;
                    }

                    if (attributeId === SpecialAttribute.MutationSpectrum) {
                        return MUTATION_SPECTRUM_CATEGORIES.map(category => {
                            return (datum.attr_val as ClinicalTrackDatum['attr_val_counts'])[
                                category
                            ];
                        }).join('/');
                    } else {
                        return sanitizeColumnData(datum.attr_val.toString());
                    }
                })
            )
        );
    }

    return rows.map(row => row.join('  ')).join('\n');
}
