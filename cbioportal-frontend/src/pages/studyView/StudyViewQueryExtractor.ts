import { toJS } from 'mobx';
import { StudyViewPageStore, StudyViewURLQuery } from './StudyViewPageStore';
import _ from 'lodash';
import {
    ClinicalAttribute,
    ClinicalDataFilter,
    DataFilterValue,
    StudyViewFilter,
} from 'cbioportal-ts-api-client/dist';
import {
    PatientIdentifier,
    PatientIdentifierFilter,
} from 'shared/model/PatientIdentifierFilter';
import { Sample } from 'cbioportal-ts-api-client/dist';
import { SampleIdentifier } from 'cbioportal-ts-api-client/dist';
import defaultClient from 'shared/api/cbioportalClientInstance';
import {
    getClinicalEqualityFilterValuesByString,
    DataType,
} from './StudyViewUtils';
import { stringListToSet } from 'cbioportal-frontend-commons';

export interface StudyViewQueryExtractor<T> {
    accept(query: StudyViewURLQuery, store: StudyViewPageStore): T;
}

// TODO: Refactor even further to abstract all updates to StudyViewPageStore.... Should only be doing this at one place
export class StudyIdQueryExtractor implements StudyViewQueryExtractor<void> {
    accept(query: StudyViewURLQuery, store: StudyViewPageStore): void {
        let studyIds: Array<string> = [];
        const studyIdsString =
            query.studyId ?? query.cancer_study_id ?? query.id ?? '';
        if (studyIdsString) {
            studyIds = studyIdsString.trim().split(',');
            if (!_.isEqual(studyIds, toJS(store.studyIds))) {
                // update if different
                store.studyIds = studyIds;
            }
        }
    }
}

export class SharedGroupsAndCustomDataQueryExtractor
    implements StudyViewQueryExtractor<void> {
    accept(query: StudyViewURLQuery, store: StudyViewPageStore): void {
        if (query.sharedGroups) {
            store.sharedGroupSet = stringListToSet(
                query.sharedGroups.trim().split(',')
            );
            // Open group comparison manager if there are shared groups in the url
            store.showComparisonGroupUI = true;
        }
        if (query.sharedCustomData) {
            store.sharedCustomChartSet = stringListToSet(
                query.sharedCustomData.trim().split(',')
            );
            store.showCustomDataSelectionUI = true;
        }
    }
}

export class StudyViewFilterQueryExtractor
    implements StudyViewQueryExtractor<Promise<void>> {
    async accept(
        query: StudyViewURLQuery,
        store: StudyViewPageStore
    ): Promise<void> {
        let filters: Partial<StudyViewFilter> = {};
        const parsedFilterJson = this.parseRawFilterJson(query.filterJson!);
        if (query.filterJson!.includes('patientIdentifiers')) {
            const sampleListIds = store.studyIds.map(s => s.concat('', '_all'));
            const samples = await store.fetchSamplesWithSampleListIds(
                sampleListIds
            );
            filters = this.getStudyViewFilterFromPatientIdentifierFilter(
                parsedFilterJson as PatientIdentifierFilter,
                samples
            );
        } else {
            filters = parsedFilterJson as Partial<StudyViewFilter>;
        }
        store.updateStoreByFilters(filters);
    }

    parseRawFilterJson(filterJson: string): any {
        let parsedJson;
        try {
            parsedJson = JSON.parse(decodeURIComponent(filterJson));
        } catch (e) {
            console.error('FilterJson invalid Json: error: ', e);
        }
        return parsedJson;
    }

    getStudyViewFilterFromPatientIdentifierFilter(
        patientIdentifierFilter: PatientIdentifierFilter,
        samples: Sample[]
    ): Partial<StudyViewFilter> {
        const filters: Partial<StudyViewFilter> = {};
        try {
            const sampleIdentifiers = this.convertPatientIdentifiersToSampleIdentifiers(
                patientIdentifierFilter.patientIdentifiers,
                samples
            );
            if (sampleIdentifiers.length > 0) {
                filters.sampleIdentifiers = sampleIdentifiers;
            }
        } catch (err) {
            console.error(
                `Failure to extract SampleIds from PatientIdentifier filter error: ${err}`
            );
        }
        return filters;
    }

    convertPatientIdentifiersToSampleIdentifiers(
        patientIdentifiers: Array<PatientIdentifier>,
        samples: Sample[]
    ): SampleIdentifier[] {
        const patientIdentifiersMap = new Map<string, PatientIdentifier>(
            patientIdentifiers.map(p => [p.studyId.concat('_', p.patientId), p])
        );
        return samples
            .filter(s =>
                patientIdentifiersMap.has(s.studyId.concat('_', s.patientId))
            )
            .map(s => ({
                sampleId: s.sampleId,
                studyId: s.studyId,
            }));
    }
}

export class ClinicalAttributeQueryExtractor
    implements StudyViewQueryExtractor<Promise<void>> {
    async accept(
        query: StudyViewURLQuery,
        store: StudyViewPageStore
    ): Promise<void> {
        const filters: Partial<StudyViewFilter> = {};
        const clinicalAttributes = _.uniqBy(
            await defaultClient.fetchClinicalAttributesUsingPOST({
                studyIds: store.studyIds,
            }),
            clinicalAttribute =>
                `${clinicalAttribute.patientAttribute}-${clinicalAttribute.clinicalAttributeId}`
        );

        const matchedAttr = _.find(
            clinicalAttributes,
            (attr: ClinicalAttribute) =>
                attr.clinicalAttributeId.toUpperCase() ===
                query.filterAttributeId!.toUpperCase()
        );
        if (matchedAttr !== undefined) {
            if (matchedAttr.datatype == DataType.NUMBER) {
                filters.clinicalDataFilters = [
                    {
                        attributeId: matchedAttr.clinicalAttributeId,
                        values: query.filterValues!.split(',').map(range => {
                            const convertResult = range.split('-');
                            return {
                                start: Number(convertResult[0]),
                                end: Number(convertResult[1]),
                            } as DataFilterValue;
                        }),
                    } as ClinicalDataFilter,
                ];
            } else {
                filters.clinicalDataFilters = [
                    {
                        attributeId: matchedAttr.clinicalAttributeId,
                        values: getClinicalEqualityFilterValuesByString(
                            query.filterValues!
                        ).map(value => ({ value })),
                    } as ClinicalDataFilter,
                ];
            }
            store.updateStoreByFilters(filters);
        } else {
            store.pageStatusMessages['unknownClinicalAttribute'] = {
                message: `The clinical attribute ${query.filterAttributeId} is not available for this study`,
                status: 'danger',
            };
        }
    }
}
