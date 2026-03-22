import * as React from 'react';
import _ from 'lodash';
import { IPlotSampleData, IScatterPlotData } from './PlotsTabUtils';
import { submitToStudyViewPage } from 'pages/resultsView/querySummary/QuerySummaryUtils';
import { DefaultTooltip } from 'cbioportal-frontend-commons';

interface ISelectedDataAlertProps {
    selectedData: IPlotSampleData[];
    scatterPlotData: IScatterPlotData[];
    plotElementWidth: number;
    onDataSelectionCleared: () => void;
}

export const SelectedDataTooltip = 'Explore samples in study view';

export const SelectedDataAlert: React.FC<ISelectedDataAlertProps> = ({
    selectedData,
    scatterPlotData,
    plotElementWidth,
    onDataSelectionCleared,
}) => {
    const studies = _(scatterPlotData)
        .uniqBy('studyId')
        .map(d => ({ studyId: d.studyId }))
        .value();

    const sampleIdentifiers = selectedData.map(d => ({
        sampleId: d.sampleId,
        studyId: d.studyId,
    }));

    return (
        <div
            data-test="selected-data-alert"
            style={{
                position: 'relative',
                zIndex: 1,
                paddingTop: 30,
                marginBottom: -30,
                width: plotElementWidth,
                textAlign: 'center',
            }}
        >
            <strong>
                {`Selected: `}
                <DefaultTooltip overlay={SelectedDataTooltip}>
                    <a
                        onClick={() => {
                            submitToStudyViewPage(
                                studies,
                                sampleIdentifiers,
                                true
                            );
                        }}
                    >
                        {`${selectedData.length} sample${
                            selectedData.length === 1 ? '' : 's'
                        }`}
                    </a>
                </DefaultTooltip>
            </strong>
            <button
                className="btn btn-default btn-xs"
                style={{ cursor: 'pointer', marginLeft: 6 }}
                onClick={onDataSelectionCleared}
            >
                Clear Selection
            </button>
        </div>
    );
};
