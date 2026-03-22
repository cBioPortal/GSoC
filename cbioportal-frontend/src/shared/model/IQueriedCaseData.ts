/*
 * OQL-queried data by patient and sample, along with the query metadata and,
 * if specified in the type argument, a non-aggregated copy of the data
 */
import { CaseAggregatedData } from 'shared/model/CaseAggregatedData';
import { AnnotatedExtendedAlteration } from 'shared/model/AnnotatedExtendedAlteration';
import { OQLLineFilterOutput } from 'shared/lib/oql/oqlfilter';

export interface IQueriedCaseData<DataInOQL> {
    cases: CaseAggregatedData<AnnotatedExtendedAlteration>;
    oql: OQLLineFilterOutput<DataInOQL>;
}
