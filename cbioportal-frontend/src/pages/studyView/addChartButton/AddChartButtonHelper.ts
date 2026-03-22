import { GenericAssayChart } from '../StudyViewPageStore';
import { getGenericAssayChartUniqueKey } from '../StudyViewUtils';

export function getInfoMessageForGenericAssayChart(
    charts: GenericAssayChart[],
    selectedAttrs: string[]
): string {
    let infoMessage = '';
    if (charts.length === 1) {
        const uniqueKey = getGenericAssayChartUniqueKey(
            charts[0].genericAssayEntityId,
            charts[0].profileType
        );
        infoMessage = `${charts[0].name} ${
            selectedAttrs.includes(uniqueKey) ? 'is already' : 'has been'
        } added.`;
    } else {
        infoMessage = `${charts.length} charts added`;
    }
    return infoMessage;
}
