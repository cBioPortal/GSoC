import * as React from 'react';
import LazyLoadedTableCell from 'shared/lib/LazyLoadedTableCell';
import ClinicalAttributeCache from '../../../cache/ClinicalAttributeCache';
import {
    Mutation,
    ClinicalData,
    ClinicalAttribute,
} from 'cbioportal-ts-api-client';
import { TruncatedText } from 'cbioportal-frontend-commons';

/**
 * @author Rajat Sirohi
 */
export default class ClinicalAttributeColumnFormatter {
    public static makeRenderFunction(
        attribute: ClinicalAttribute,
        clinicalAttributeCache?: ClinicalAttributeCache
    ) {
        return LazyLoadedTableCell(
            (d: Mutation[]) => {
                if (clinicalAttributeCache) {
                    return clinicalAttributeCache.get({
                        clinicalAttribute: attribute,
                        entityId: attribute.patientAttribute
                            ? d[0].patientId
                            : d[0].sampleId,
                        studyId: d[0].studyId,
                    });
                } else {
                    return {
                        status: 'error',
                        data: null,
                    };
                }
            },
            (t: ClinicalData) => (
                <TruncatedText
                    maxLength={30}
                    text={t.value || ''}
                    tooltip={<div style={{ maxWidth: 300 }}>{t.value}</div>}
                />
            ),
            'Clinical attribute not available for this sample.'
        );
    }

    public static getTextValue(
        d: Mutation[],
        attribute: ClinicalAttribute,
        clinicalAttributeCache?: ClinicalAttributeCache
    ): string {
        const clinicalDatum = clinicalAttributeCache?.get({
            clinicalAttribute: attribute,
            entityId: attribute.patientAttribute
                ? d[0].patientId
                : d[0].sampleId,
            studyId: d[0].studyId,
        })?.data;
        return clinicalDatum ? clinicalDatum.value : '';
    }

    public static sortBy(
        d: Mutation[],
        attribute: ClinicalAttribute,
        clinicalAttributeCache?: ClinicalAttributeCache
    ): string | number | null {
        let textValue = this.getTextValue(d, attribute, clinicalAttributeCache);
        let sortValue =
            attribute.datatype === 'NUMBER' ? +textValue : textValue;

        return textValue === '' ? null : sortValue;
    }

    public static filter(
        d: Mutation[],
        filterStringUpper: string,
        attribute: ClinicalAttribute,
        clinicalAttributeCache?: ClinicalAttributeCache
    ): boolean {
        if (attribute.datatype !== 'STRING') {
            return false;
        }

        return this.getTextValue(d, attribute, clinicalAttributeCache)
            .toUpperCase()
            .includes(filterStringUpper);
    }
}
