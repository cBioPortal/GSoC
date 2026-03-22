import _ from 'lodash';
import {
    IMutationalCounts,
    IMutationalSignature,
} from 'shared/model/MutationalSignature';
import { scalePoint } from 'd3-scale';
import { IMutationalSignatureRow } from 'pages/patientView/clinicalInformation/ClinicalInformationMutationalSignatureTable';
export interface IColorLegend extends IColorDataBar {
    group: string;
    subcategory?: string;
}

export interface IColorDataBar extends IMutationalCounts {
    colorValue: string;
    label: string;
    subcategory?: string;
    sublabel?: string;
}

export interface ColorMapProps {
    name: string;
    alternativeName: string;
    category: string;
    color: string;
    subcategory?: string;
    sublabel?: string;
}

export interface LegendLabelsType {
    group: string;
    label: string;
    color: string;
    subcategory?: string;
    sublabel?: string;
}
export interface DrawRectInfo {
    color: string;
    start: string;
    end: string;
}
export interface LabelInfo {
    color: string;
    start: string;
    end: string;
    category: string;
    group: string;
    sublabel: string;
}
export interface LegendEntriesType {
    group: string;
    color: string;
    label: string;
    value: string;
}

export type DataToPlot = { mutationalSignatureLabel: string; value: number };

export const colorMap: ColorMapProps[] = [
    {
        name: 'C>A',
        alternativeName: '_C-A_',
        category: 'C>A',
        color: '#5DADE2',
    },
    {
        name: 'C>G',
        alternativeName: '_C-G_',
        category: 'C>G',
        color: '#154360',
    },
    { name: 'C>T', alternativeName: '_C-T_', category: 'C>T', color: 'red' },
    {
        name: 'T>A',
        alternativeName: '_T-A_',
        category: 'T>A',
        color: '#99A3A4',
    },
    {
        name: 'T>C',
        alternativeName: '_T-C_',
        category: 'T>C',
        color: '#2ECC71 ',
    },
    {
        name: 'T>G',
        alternativeName: '_T-G_',
        category: 'T>G',
        color: '#F5B7B1',
    },
    {
        name: 'reference',
        alternativeName: 'reference',
        category: 'reference',
        color: '#1e97f3',
    },
    {
        name: 'AC>',
        alternativeName: 'AC-',
        category: 'AC>NN',
        color: 'skyblue',
    },
    {
        name: 'AT>',
        alternativeName: 'AT-',
        category: 'AT>NN',
        color: 'blue',
    },
    {
        name: 'CC>',
        alternativeName: 'CC-',
        category: 'CC>NN',
        color: 'lightgreen',
    },
    {
        name: 'CG>',
        alternativeName: 'CG-',
        category: 'CG>NN',
        color: 'darkgreen',
    },
    {
        name: 'CT>',
        alternativeName: 'CT-',
        category: 'CT>NN',
        color: 'pink',
    },
    {
        name: 'CG>',
        alternativeName: 'CG-',
        category: 'CG>NN',
        color: 'darkred',
    },
    {
        name: 'TA>',
        alternativeName: 'TA-',
        category: 'TA>NN',
        color: '#FF7F50',
    },
    {
        name: 'TC>',
        alternativeName: 'TC-',
        category: 'TC>NN',
        color: 'orange',
    },
    {
        name: 'TG>',
        alternativeName: 'TG-',
        category: 'TG>NN',
        color: '#ba55D3',
    },
    {
        name: 'TT>',
        alternativeName: 'TT-',
        category: 'TT>NN',
        color: 'purple',
    },
    {
        name: 'GC>',
        alternativeName: 'GC-',
        category: 'GC>NN',
        color: 'gold',
    },
    {
        name: '1:Del:C',
        alternativeName: '1_Del_C_',
        category: '1bp deletion',
        subcategory: 'C',
        sublabel: 'Homopolymer length',
        color: '#f39c12',
    },
    {
        name: '1:Del:T',
        alternativeName: '1_Del_T_',
        category: '1bp deletion',
        subcategory: 'T',
        sublabel: 'Homopolymer length',
        color: '#d68910',
    },
    {
        name: '2:Del:R',
        alternativeName: '2_Del_R_',
        category: '>1bp deletion',
        subcategory: '2',
        sublabel: 'Number of Repeat Units',
        color: '#f1948a',
    },
    {
        name: '2:Del:M',
        alternativeName: '2_Del_M',
        category: 'Microhomology',
        subcategory: '2',
        sublabel: 'Microhomology length',
        color: '#D2B7F2',
    },
    {
        name: '3:Del:R',
        alternativeName: '3_Del_R',
        category: '>1bp deletion',
        subcategory: '3',
        sublabel: 'Number of Repeat Units',
        color: '#ec7063',
    },
    {
        name: '3:Del:M',
        alternativeName: '3_Del_M',
        category: 'Microhomology',
        subcategory: '3',
        sublabel: 'Microhomology length',
        color: '#E194EB',
    },
    {
        name: '4:Del:R',
        alternativeName: '4_Del_R',
        category: '>1bp deletion',
        subcategory: '4',
        sublabel: 'Number of Repeat Units',
        color: '#e74c3c',
    },
    {
        name: '4:Del:M',
        alternativeName: '4_Del_M',
        category: 'Microhomology',
        subcategory: '4',
        sublabel: 'Microhomology length',
        color: '#DD75EA',
    },
    {
        name: '5:Del:R',
        alternativeName: '5_Del_R',
        category: '>1bp deletion',
        subcategory: '5',
        sublabel: 'Number of Repeat Units',
        color: '#F7406C',
    },
    {
        name: '5:Del:M',
        alternativeName: '5_Del_M',
        category: 'Microhomology',
        subcategory: '5',
        sublabel: 'Microhomology length',
        color: '#DB3AEE',
    },
    {
        name: '1:Ins:T',
        alternativeName: '1_Ins_T',
        category: '1bp insertion',
        subcategory: 'T',
        sublabel: 'Homopolymer length',
        color: '#28b463',
    },
    {
        name: '1:Ins:C',
        alternativeName: '1_Ins_C',
        category: '1bp insertion',
        subcategory: 'C',
        sublabel: 'Homopolymer length',
        color: '#82e0aa',
    },
    {
        name: '2:Ins:M',
        alternativeName: '2_Ins_M',
        category: 'Microhomology',
        subcategory: '2',
        sublabel: 'Microhomology length',
        color: '#aed6f1',
    },
    {
        name: '2:Ins:R',
        alternativeName: '2_Ins_R',
        category: '>1bp insertion',
        subcategory: '2',
        sublabel: 'Number of Repeat Units',
        color: '#33ffff',
    },
    {
        name: '3:Ins:M',
        alternativeName: '3_Ins_M',
        category: 'Microhomology',
        subcategory: '3',
        sublabel: 'Microhomology length',
        color: '#85c1e9',
    },
    {
        name: '3:Ins:R',
        alternativeName: '3_Ins_R',
        category: '>1bp insertion',
        subcategory: '3',
        sublabel: 'Number of Repeat Units',
        color: '#aed6F1',
    },
    {
        name: '4:Ins:M',
        alternativeName: '4_Ins_M',
        category: 'Microhomology',
        subcategory: '4',
        sublabel: 'Microhomology length',
        color: '#85c1e9',
    },
    {
        name: '4:Ins:R',
        alternativeName: '4_Ins_R',
        category: '>1bp insertion',
        subcategory: '4',
        sublabel: 'Number of Repeat Units',
        color: '#5dade2',
    },
    {
        name: '5:Ins:M',
        alternativeName: '5_Ins_M',
        category: 'Microhomology',
        subcategory: '5',
        sublabel: 'Microhomology length',
        color: '#3498db',
    },
    {
        name: '5:Ins:R',
        alternativeName: '5_Ins_R',
        category: '>1bp insertion',
        subcategory: '5',
        sublabel: 'Number of Repeat Units',
        color: '#368BFD',
    },
];
export function getColorsForSignatures(
    dataset: IMutationalCounts[],
    yAxisSetting: string
): IColorLegend[] {
    const colorTableData = dataset.map((obj: IMutationalCounts) => {
        if (obj.mutationalSignatureLabel !== '') {
            const colorIdentity = colorMap.filter(cmap => {
                if (
                    obj.mutationalSignatureLabel.indexOf('_') == -1 &&
                    obj.mutationalSignatureLabel.indexOf('-') == -1
                ) {
                    if (
                        obj.mutationalSignatureLabel.match(cmap.name) !== null
                    ) {
                        return cmap.color;
                    }
                } else {
                    if (
                        obj.mutationalSignatureLabel.match(
                            cmap.alternativeName
                        ) !== null
                    ) {
                        return cmap.color;
                    }
                }
            });
            const label = formatTooltipLabelCosmicStyle(
                obj.version,
                obj.mutationalSignatureLabel,
                colorIdentity,
                yAxisSetting,
                obj.value,
                obj.percentage
            );
            const group: string =
                colorIdentity.length > 0
                    ? colorIdentity[colorIdentity.length - 1].category
                    : 'unknown';
            const colorValue: string =
                colorIdentity.length > 0
                    ? colorIdentity[colorIdentity.length - 1].color
                    : '#EE4B2B';
            const subcategory: string =
                'subcategory' in colorIdentity[colorIdentity.length - 1]
                    ? colorIdentity[colorIdentity.length - 1].subcategory!
                    : ' ';
            const sublabel: string =
                'sublabel' in colorIdentity[colorIdentity.length - 1]
                    ? colorIdentity[colorIdentity.length - 1].sublabel!
                    : ' ';
            return { ...obj, colorValue, label, subcategory, sublabel, group };
        } else {
            const label = obj.mutationalSignatureLabel;
            const colorValue = '#EE4B2B';
            const group = ' ';
            const subcategory: string = ' ';
            const sublabel: string = '';
            return { ...obj, colorValue, label, subcategory, sublabel, group };
        }
    });
    if (colorTableData[0].group !== ' ') {
        return _.sortBy(colorTableData, 'group');
    } else {
        return colorTableData;
    }
}

// TODO we should make sure that the percentage is always calculated
export function getPercentageOfMutationalCount(
    inputData: IMutationalCounts[]
): IMutationalCounts[] {
    const sumValue = _.sum(inputData.map(item => item.value));
    return inputData.map(item => {
        const percentage = Math.round((item.value / sumValue!) * 100);
        return {
            uniqueSampleKey: item.uniqueSampleKey,
            patientId: item.patientId,
            uniquePatientKey: item.uniquePatientKey,
            studyId: item.studyId,
            sampleId: item.sampleId,
            mutationalSignatureLabel: item.mutationalSignatureLabel,
            mutationalSignatureClass: item.mutationalSignatureClass,
            version: item.version,
            percentage: sumValue == 0 ? 0 : percentage,
            value: item.value,
        };
    });
}

export function getxScalePoint(
    labels: LegendLabelsType[],
    xMin: number,
    xMax: number
) {
    return scalePoint()
        .domain(labels.map((x: LegendLabelsType) => x.label))
        .range([xMin, xMax]);
}

export function getLegendEntriesBarChart(
    labels: LegendLabelsType[]
): LegendEntriesType[] {
    return labels.map(item => ({
        group: item.group,
        color: item.color,
        label: item.label,
        value: item.label,
        subcategory: item.subcategory,
    }));
}

export function addColorsForReferenceData(dataset: DataToPlot[]) {
    const colors = dataset.map((entry: DataToPlot) => {
        const colorIdentity = colorMap.filter(cmap => {
            if (
                entry.mutationalSignatureLabel.indexOf('_') == -1 &&
                entry.mutationalSignatureLabel.indexOf('-') == -1
            ) {
                if (entry.mutationalSignatureLabel.match(cmap.name) != null) {
                    return cmap.color;
                }
            } else {
                if (
                    entry.mutationalSignatureLabel.match(
                        cmap.alternativeName
                    ) != null
                ) {
                    return cmap.color;
                }
            }
        });
        const colorValue =
            colorIdentity.length > 0
                ? colorIdentity[colorIdentity.length - 1].color
                : '#EE4B2B';
        return { ...entry, colorValue };
    });
    return colors;
}

export function getCenterPositionLabelEntries(
    legendObjects: LegendEntriesType[]
): number[] {
    return Object.keys(_.groupBy(legendObjects, 'group')).map(x =>
        Math.round(_.groupBy(legendObjects, 'group')[x].length / 2)
    );
}
export function getLengthLabelEntries(
    legendObjects: LegendEntriesType[]
): number[] {
    return Object.keys(_.groupBy(legendObjects, 'group')).map(
        x => _.groupBy(legendObjects, 'group')[x].length
    );
}

export function createLegendLabelObjects(
    lengthObjects: number[],
    objects: LegendEntriesType[],
    labels: string[]
) {
    return labels.map(
        (identifier: string, i: number) =>
            _.groupBy(objects, 'group')[identifier][lengthObjects[i] - 1]
    );
}

export function createXAxisAnnotation(
    lengthObjects: number[],
    objects: LegendEntriesType[],
    labels: string[]
) {
    return labels.map(
        (identifier: string, i: number) =>
            _.groupBy(objects, 'sublabel')[identifier][lengthObjects[i] - 1]
    );
}

export function formatLegendObjectsForRectangles(
    lengthLegendObjects: number[],
    legendEntries: LegendEntriesType[],
    labels: string[],
    version: string,
    groupByString: string
) {
    if (version != 'ID') {
        return lengthLegendObjects.map((value, i) => ({
            color: _.groupBy(legendEntries, 'group')[labels[i]][0].color,
            start: _.groupBy(legendEntries, 'group')[labels[i]][0].value,
            end: _.groupBy(legendEntries, 'group')[labels[i]][value - 1].value,
        }));
    } else {
        // Create a new object grouped by 'group' and 'subcategory
        const dataGroupByCategory = _.groupBy(legendEntries, groupByString);
        const dataGroupByGroup = Object.keys(dataGroupByCategory).map(item =>
            _.groupBy(dataGroupByCategory[item], 'group')
        );
        const result: any[] = [];
        dataGroupByGroup.map(item =>
            Object.keys(item).map(x => result.push(item[x]))
        );
        return result.map(itemLegend => ({
            color: itemLegend[0].color,
            start: itemLegend[0].label,
            end:
                itemLegend.length > 1
                    ? itemLegend[itemLegend.length - 1].label
                    : itemLegend[0].label,
            category: itemLegend[0].subcategory,
            group: itemLegend[0].group,
        }));
    }
}

export function prepareMutationalSignatureDataForTable(
    mutationalSignatureData: IMutationalSignature[],
    samplesInData: string[]
): IMutationalSignatureRow[] {
    const tableData: IMutationalSignatureRow[] = [];
    const sampleInvertedDataByMutationalSignature: Array<any> = _(
        mutationalSignatureData
    )
        .groupBy(
            mutationalSignatureSample => mutationalSignatureSample.meta.name
        )
        .map((mutationalSignatureSampleData, name) => ({
            name,
            samples: mutationalSignatureSampleData,
            description: mutationalSignatureSampleData[0].meta.description,
            url: mutationalSignatureSampleData[0].meta.url,
        }))
        .value();
    for (const mutationalSignature of sampleInvertedDataByMutationalSignature) {
        let mutationalSignatureRowForTable: IMutationalSignatureRow = {
            name: '',
            sampleValues: {},
            description: '',
            url: '',
        };

        mutationalSignatureRowForTable.name = mutationalSignature.name;
        mutationalSignatureRowForTable.description =
            mutationalSignature.description;
        mutationalSignatureRowForTable.url = mutationalSignature.url;
        if (
            Object.keys(mutationalSignature.samples).length ===
            samplesInData.length
        ) {
            for (const sample of mutationalSignature.samples) {
                mutationalSignatureRowForTable.sampleValues[sample.sampleId] = {
                    value: sample.value,
                    confidence: sample.confidence,
                };
            }
            tableData.push(mutationalSignatureRowForTable);
        } else {
            for (const sampleId of samplesInData) {
                if (
                    mutationalSignature.samples.some(
                        (obj: IMutationalSignature) => obj.sampleId === sampleId
                    )
                ) {
                    // Sample exists and we can use the values
                    for (const sample of mutationalSignature.samples) {
                        mutationalSignatureRowForTable.sampleValues[
                            sample.sampleId
                        ] = {
                            value: sample.value,
                            confidence: sample.confidence,
                        };
                    }
                } else {
                    mutationalSignatureRowForTable.sampleValues[sampleId] = {
                        value: 0,
                        confidence: 1,
                    };
                }
            }
            tableData.push(mutationalSignatureRowForTable);
        }
    }
    return tableData;
}

// TODO check if this function returns a value when we look at percentage
export function formatTooltipLabelCosmicStyle(
    version: string,
    label: string,
    category: ColorMapProps[],
    yAxisSetting: string,
    value: number,
    percentage: number
): string {
    const valueLabel = yAxisSetting == '%' ? '% of ' : '';
    const countLabel = yAxisSetting == '#' ? percentage + '%' : value;
    const valueForTooltip = yAxisSetting == '#' ? value : percentage;
    if (version == 'SBS') {
        const labelSplit = label.split('_').map((x, i) => {
            return i == 1 ? '[' + x.replace('-', '->') + ']' : x;
        });
        return labelSplit.length > 1
            ? valueForTooltip +
                  valueLabel +
                  ' SBS mutations (' +
                  countLabel +
                  ') are ' +
                  '\n' +
                  labelSplit[1] +
                  ' at ' +
                  labelSplit.join('') +
                  ' trinucleotide'
            : label;
    } else if (version == 'DBS') {
        const labelSplit = label.split('-');
        return labelSplit.length > 1
            ? valueForTooltip +
                  valueLabel +
                  ' of DBS mutations (' +
                  countLabel +
                  ') ' +
                  '\n' +
                  labelSplit[0] +
                  ' to ' +
                  labelSplit[1]
            : label;
    } else if (version == 'ID') {
        const formattedLabel = formatIndelTooltipLabelsCosmicStyle(
            label,
            category,
            value,
            valueLabel
        );
        return formattedLabel !== '' ? formattedLabel : label;
    } else {
        return label;
    }
}

function formatIndelTooltipLabelsCosmicStyle(
    label: string,
    information: ColorMapProps[],
    value: number,
    valueLabel: string
): string {
    if (information[0].category == 'Microhomology') {
        return (
            value +
            ' of small indels (' +
            percentageToFraction(value) +
            ') ' +
            ' ' +
            information[0].category +
            '\n' +
            ' with microhomology length ' +
            label.split('_')[3]
        );
    } else if (information[0].category == '>1bp insertion') {
        return (
            value +
            ' of small indels (' +
            percentageToFraction(value) +
            ') ' +
            ' ' +
            information[0].category +
            '\n' +
            ' with number of repeat units ' +
            label.split('_')[3]
        );
    } else if (information[0].category == '>1bp deletion') {
        return (
            value +
            ' of small indels (' +
            ') ' +
            ' ' +
            information[0].category +
            '\n' +
            ' with number of repeat units ' +
            label.split('_')[3]
        );
    } else if (information[0].category == '1bp deletion') {
        return (
            value +
            ' of small indels (' +
            ') ' +
            ' ' +
            information[0].category +
            '(' +
            information[0].subcategory +
            ')' +
            '\n' +
            ' with homopolymer length' +
            '\n' +
            'of ' +
            label.split('_')[3]
        );
    } else if (information[0].category == '1bp insertion') {
        return (
            value +
            ' of small indels (' +
            ') ' +
            ' ' +
            information[0].category +
            ' (' +
            information[0].subcategory +
            ')' +
            '\n' +
            ' with homopolymer length' +
            '\n' +
            'of ' +
            label.split('_')[3]
        );
    } else {
        return '';
    }
}

export function formatMutationalSignatureLabel(label: string, version: string) {
    if (version === 'SBS') {
        return label.replace(/[\[\]]/g, '_').replace(/>/g, '-');
    } else if (version === 'DBS') {
        return label.replace(/>/g, '-');
    } else if (version === 'ID') {
        return label.replace(/:/g, '_');
    } else {
        return label;
    }
}

function percentageToFraction(percentage: number): string {
    // Function to find the greatest common divisor (GCD)
    const findGCD = (a: number, b: number): number => {
        while (b !== 0) {
            const temp = b;
            b = a % b;
            a = temp;
        }
        return a;
    };

    const decimal: number = percentage / 100;

    // Convert the decimal to a fraction
    let numerator: number = decimal * 1000000;
    let denominator: number = 1000000;

    // Find the greatest common divisor
    const gcd: number = findGCD(numerator, denominator);

    // Simplify the fraction
    numerator /= gcd;
    denominator /= gcd;

    const simplifiedFraction: string = `${numerator}/${denominator}`;

    return simplifiedFraction;
}
