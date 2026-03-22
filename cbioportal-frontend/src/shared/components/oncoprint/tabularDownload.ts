import Oncoprint, {
    ClinicalTrackSpec,
    GeneticTrackSpec,
    IHeatmapTrackSpec,
    IGenesetHeatmapTrackSpec,
    IBaseHeatmapTrackSpec,
} from './Oncoprint';
import fileDownload from 'react-file-download';
import ifNotDefined from '../../lib/ifNotDefined';
import { string } from 'yargs';

export function getTabularDownloadData(
    geneticTracks: GeneticTrackSpec[],
    clinicalTracks: ClinicalTrackSpec[],
    heatmapTracks: IHeatmapTrackSpec[],
    genericAssayHeatmapTracks: IHeatmapTrackSpec[],
    genesetTracks: IGenesetHeatmapTrackSpec[],
    uidOrder: string[],
    getCaseId: (uid: string) => string,
    columnMode: 'sample' | 'patient',
    distinguishDrivers: boolean
) {
    function getCountsTrackRowLabel(attrName: string, countsCategory: string) {
        return `${attrName} (${countsCategory})`;
    }

    const caseNames = uidOrder.map(getCaseId);

    //Gather all the Oncoprint data
    const oncoprintData: any = {
        CLINICAL: {},
        CNA: {},
        MUTATIONS: {},
        MRNA: {},
        PROTEIN: {},
        STRUCTURAL_VARIANT: {},
    };

    //Create maps for genetic data
    const cnaMap: any = {
        amp: 'Amplification',
        gain: 'Gain',
        hetloss: 'Shallow Deletion',
        homdel: 'Deep Deletion',
    };
    let mutationMap: any = {};
    if (distinguishDrivers) {
        mutationMap = {
            inframe: 'Inframe Mutation (putative passenger)',
            inframe_rec: 'Inframe Mutation (putative driver)',
            missense: 'Missense Mutation (putative passenger)',
            missense_rec: 'Missense Mutation (putative driver)',
            promoter: 'Promoter Mutation',
            promoter_rec: 'Promoter Mutation',
            trunc: 'Truncating mutation (putative passenger)',
            trunc_rec: 'Truncating mutation (putative driver)',
        };
    } else {
        mutationMap = {
            inframe: 'Inframe Mutation',
            inframe_rec: 'Inframe Mutation',
            missense: 'Missense Mutation',
            missense_rec: 'Missense Mutation',
            promoter: 'Promoter Mutation',
            promoter_rec: 'Promoter Mutation',
            trunc: 'Truncating mutation',
            trunc_rec: 'Truncating mutation',
        };
    }
    const mrnaMap: any = {
        high: 'mRNA High',
        low: 'mRNA Low',
    };
    const proteinMap: any = {
        low: 'Protein Low',
        high: 'Protein High',
    };
    const structuralVariantMap: any = {
        true: 'Structural Variant',
    };

    const alterationsMap: any = {
        CNA: 'disp_cna',
        MUTATIONS: 'disp_mut',
        MRNA: 'disp_mrna',
        PROTEIN: 'disp_prot',
        STRUCTURAL_VARIANT: 'disp_structuralVariant',
    };

    //Add genetic data
    for (const geneticTrack of geneticTracks) {
        const currentTrackData = geneticTrack.data;
        const currentGeneName = currentTrackData[0].trackLabel; // the label is the same for all entries of the track
        //Add the currentGeneName to the oncoprintData if it does not exist
        for (const alteration in alterationsMap) {
            if (oncoprintData[alteration][currentGeneName] === undefined) {
                oncoprintData[alteration][currentGeneName] = {};
            }
        }

        //Iterate over all patients/samples of the track and add them to oncoprintData
        for (const geneticTrackDatum of currentTrackData) {
            let id: string =
                columnMode === 'sample'
                    ? geneticTrackDatum.sample!
                    : geneticTrackDatum.patient!;

            // Only initialize each alteration for sample/patient if it doesn't exist
            // It may already exist if there are multiple OncoPrint tracks of the same gene
            for (const alteration in alterationsMap) {
                if (
                    oncoprintData[alteration][currentGeneName][id] === undefined
                ) {
                    oncoprintData[alteration][currentGeneName][id] = '';
                }
            }

            // Check if the sample/patient is initialized, and combine both results in case they are different
            for (const alteration in alterationsMap) {
                const disp = alterationsMap[alteration];
                // @ts-ignore
                const dispValue = geneticTrackDatum[disp];

                const geneticAlterationMap: any = {
                    CNA: cnaMap,
                    MUTATIONS: mutationMap,
                    MRNA: mrnaMap,
                    PROTEIN: proteinMap,
                    STRUCTURAL_VARIANT: structuralVariantMap,
                };

                if (dispValue !== undefined) {
                    const map = geneticAlterationMap[alteration];
                    const currentValue = map[dispValue] ?? dispValue;

                    const geneTrack =
                        oncoprintData[alteration][currentGeneName];
                    const existingValue = geneTrack[id];

                    if (!existingValue || existingValue === currentValue) {
                        geneTrack[id] = currentValue;
                    } else {
                        geneTrack[id] = `${existingValue}, ${currentValue}`;
                    }
                }
            }
        }
    }
    //Add clinical data
    for (const clinicalTrack of clinicalTracks) {
        const currentClinicalTrackData = clinicalTrack.data;
        const currentAttributeName = clinicalTrack.label;
        //Add the currentAttributeName to the oncoprintData if it does not exist
        // Handle counts differently - separate row per count category
        if (clinicalTrack.datatype === 'counts') {
            for (const category of clinicalTrack.countsCategoryLabels) {
                const rowLabel = getCountsTrackRowLabel(
                    currentAttributeName,
                    category
                );
                oncoprintData.CLINICAL[rowLabel] =
                    oncoprintData.CLINICAL[rowLabel] || {};
            }
        } else {
            if (oncoprintData.CLINICAL[currentAttributeName] === undefined) {
                oncoprintData.CLINICAL[currentAttributeName] = {};
            }
        }
        //Iterate over all patients/samples of the track and add them to oncoprintData
        for (const clinicalTrackDatum of currentClinicalTrackData) {
            let id: string =
                columnMode === 'sample'
                    ? clinicalTrackDatum.sample!
                    : clinicalTrackDatum.patient!;
            if (clinicalTrack.datatype === 'counts') {
                for (const category of clinicalTrack.countsCategoryLabels) {
                    oncoprintData.CLINICAL[
                        getCountsTrackRowLabel(currentAttributeName, category)
                    ][id] = clinicalTrackDatum.attr_val
                        ? (clinicalTrackDatum.attr_val as {
                              [val: string]: number;
                          })[category]
                        : '';
                }
            } else {
                oncoprintData.CLINICAL[currentAttributeName][id] = '';
                oncoprintData.CLINICAL[currentAttributeName][id] = ifNotDefined(
                    clinicalTrackDatum.attr_val,
                    ''
                );
            }
        }
    }

    //Add heatmap data
    const exportedHeatmapTracks = (heatmapTracks as IBaseHeatmapTrackSpec[])
        .concat(genericAssayHeatmapTracks as IBaseHeatmapTrackSpec[])
        .concat(genesetTracks as IBaseHeatmapTrackSpec[]);
    for (const heatmapTrack of exportedHeatmapTracks) {
        const currentHeatmapGene = heatmapTrack.label;
        const currentHeatmapType =
            'HEATMAP ' +
            heatmapTrack.molecularAlterationType +
            ' ' +
            heatmapTrack.datatype;
        const currentHeatmapTrackData = heatmapTrack.data;
        for (const heatmapTrackDatum of currentHeatmapTrackData) {
            if (oncoprintData[currentHeatmapType] === undefined) {
                oncoprintData[currentHeatmapType] = {};
            }
            if (
                oncoprintData[currentHeatmapType][currentHeatmapGene] ===
                undefined
            ) {
                oncoprintData[currentHeatmapType][currentHeatmapGene] = {};
            }
            let id: string =
                columnMode === 'sample'
                    ? heatmapTrackDatum.sample!
                    : heatmapTrackDatum.patient!;
            oncoprintData[currentHeatmapType][currentHeatmapGene][id] =
                heatmapTrackDatum.profile_data === null
                    ? ''
                    : heatmapTrackDatum.profile_data;
        }
    }

    //Put all the information of the oncoprintData in a variable with tabular form
    let content = 'track_name\ttrack_type';
    //Add the cases to the content
    for (let i = 0; i < caseNames.length; i++) {
        content += '\t' + caseNames[i];
    }
    //Add final header line
    content += '\n';

    //Iterate over oncoprintData and write it to content
    Object.keys(oncoprintData).forEach(function(dataType) {
        Object.keys(oncoprintData[dataType]).forEach(function(
            geneOrClinicalAttribute
        ) {
            content += geneOrClinicalAttribute + '\t' + dataType;
            for (let l = 0; l < caseNames.length; l++) {
                content +=
                    '\t' +
                    oncoprintData[dataType][geneOrClinicalAttribute][
                        caseNames[l]
                    ];
            }
            content += '\n';
        });
    });

    return content;
}
export default function tabularDownload(
    geneticTracks: GeneticTrackSpec[],
    clinicalTracks: ClinicalTrackSpec[],
    heatmapTracks: IHeatmapTrackSpec[],
    genericAssayHeatmapTracks: IHeatmapTrackSpec[],
    genesetTracks: IGenesetHeatmapTrackSpec[],
    uidOrder: string[],
    getCaseId: (uid: string) => string,
    columnMode: 'sample' | 'patient',
    distinguishDrivers: boolean
) {
    const prefixName =
        columnMode === 'sample' ? 'SAMPLE_DATA_' : 'PATIENT_DATA_'; //Name depending on the type of case

    fileDownload(
        getTabularDownloadData(
            geneticTracks,
            clinicalTracks,
            heatmapTracks,
            genericAssayHeatmapTracks,
            genesetTracks,
            uidOrder,
            getCaseId,
            columnMode,
            distinguishDrivers
        ),
        prefixName + 'oncoprint.tsv'
    );
}
