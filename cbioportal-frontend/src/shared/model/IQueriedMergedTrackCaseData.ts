/*
 * OQL-queried data by patient and sample, along with the query metadata and a
 * non-aggregated copy of the data and, in case of a merged track, an array of
 * records per individual gene queried
 */
import { CaseAggregatedData } from 'shared/model/CaseAggregatedData';
import { AnnotatedExtendedAlteration } from 'shared/model/AnnotatedExtendedAlteration';
import { UnflattenedOQLLineFilterOutput } from 'shared/lib/oql/oqlfilter';
import { IQueriedCaseData } from 'shared/model/IQueriedCaseData';

export interface IQueriedMergedTrackCaseData {
    cases: CaseAggregatedData<AnnotatedExtendedAlteration>;
    oql: UnflattenedOQLLineFilterOutput<AnnotatedExtendedAlteration>;
    mergedTrackOqlList?: IQueriedCaseData<object>[];
}
