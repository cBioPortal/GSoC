import {
    ClinicalData,
    ClinicalDataBySampleId,
    ClinicalAttribute,
    Sample,
} from 'cbioportal-ts-api-client';

export interface IColumn {
    id: string;
}

export interface IAttrData {
    [attrId: string]: {
        [sampleId: string]: ClinicalAttribute | string;
        clinicalAttribute: ClinicalAttribute;
        id: string;
    };
}

export interface IConvertedSamplesData {
    columns: IColumn[];
    items: IAttrData;
}

export default function(
    data?: Array<ClinicalDataBySampleId>
): IConvertedSamplesData {
    const output: IConvertedSamplesData = { columns: [], items: {} };

    if (data)
        data.forEach((sample: ClinicalDataBySampleId) => {
            const sampleId = sample.id;

            output.columns.push({ id: sampleId });

            sample.clinicalData.forEach((clinicalData: ClinicalData) => {
                output.items[clinicalData.clinicalAttributeId] =
                    output.items[clinicalData.clinicalAttributeId] || {};
                output.items[clinicalData.clinicalAttributeId][
                    sampleId
                ] = clinicalData.value.toString();
                output.items[
                    clinicalData.clinicalAttributeId
                ].clinicalAttribute = clinicalData.clinicalAttribute;
                output.items[clinicalData.clinicalAttributeId].id =
                    clinicalData.clinicalAttributeId;
            });
        });

    return output;
}
