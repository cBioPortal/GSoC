import URLWrapper from '../../shared/lib/URLWrapper';
import { StudyViewPageTabKey, StudyViewURLQuery } from './StudyViewPageStore';
import { PagePath } from '../../shared/enums/PagePaths';
import { computed, makeObservable } from 'mobx';
import { PatientViewPageTabs } from '../patientView/PatientViewPageTabs';
import { StudyViewPageTabKeyEnum } from './StudyViewPageTabs';
import ExtendedRouterStore from '../../shared/lib/ExtendedRouterStore';

export type PlotsSelectionParam = {
    selectedGeneOption?: string;
    selectedGenesetOption?: string;
    selectedGenericAssayOption?: string;
    dataType?: string;
    selectedDataSourceOption?: string;
    mutationCountBy?: string;
    structuralVariantCountBy?: string;
    logScale?: string;
};

const PlotsSelectionParamProps: Required<PlotsSelectionParam> = {
    selectedGeneOption: '',
    selectedGenesetOption: '',
    selectedGenericAssayOption: '',
    dataType: '',
    selectedDataSourceOption: '',
    mutationCountBy: '',
    structuralVariantCountBy: '',
    logScale: '',
};

export type PlotsColoringParam = {
    selectedOption?: string;
    logScale?: string;
    colorByMutationType?: string;
    colorByCopyNumber?: string;
    colorBySv?: string;
};

const PlotsColoringParamProps: Required<PlotsColoringParam> = {
    selectedOption: '',
    logScale: '',
    colorByMutationType: '',
    colorByCopyNumber: '',
    colorBySv: '',
};

export default class StudyViewURLWrapper extends URLWrapper<
    Pick<
        StudyViewURLQuery,
        | 'tab'
        | 'resourceUrl'
        | 'plots_horz_selection'
        | 'plots_vert_selection'
        | 'plots_coloring_selection'
        | 'embeddings_coloring_selection'
        | 'geneset_list'
        | 'generic_assay_groups'
    >
> {
    constructor(routing: ExtendedRouterStore) {
        super(routing, {
            tab: { isSessionProp: false },
            resourceUrl: { isSessionProp: false },
            plots_horz_selection: {
                isSessionProp: false,
                nestedObjectProps: PlotsSelectionParamProps,
            },
            plots_vert_selection: {
                isSessionProp: false,
                nestedObjectProps: PlotsSelectionParamProps,
            },
            plots_coloring_selection: {
                isSessionProp: false,
                nestedObjectProps: PlotsColoringParamProps,
            },
            embeddings_coloring_selection: {
                isSessionProp: false,
                nestedObjectProps: PlotsColoringParamProps,
            },
            geneset_list: { isSessionProp: true },
            generic_assay_groups: { isSessionProp: false },
        });
        makeObservable(this);
    }

    public setTab(tab: string): void {
        this.updateURL({}, `${PagePath.Study}/${tab}`);
    }

    @computed public get tabId(): StudyViewPageTabKey {
        const regex = new RegExp(`${PagePath.Study}\/(.+)`);
        const regexMatch = regex.exec(this.pathName);
        const tabInPath = regexMatch && regexMatch[1];
        return (
            (tabInPath as StudyViewPageTabKey | undefined) ||
            StudyViewPageTabKeyEnum.SUMMARY
        );
    }

    public setResourceUrl(resourceUrl: string) {
        this.updateURL({ resourceUrl });
    }
}
