import { ResultsViewTab } from '../../pages/resultsView/ResultsViewPageHelpers';
import { MobxPromise } from 'cbioportal-frontend-commons';
export interface ITabConfiguration {
    id: ResultsViewTab;
    getTab: () => JSX.Element;
    hide?: () => boolean;
}

export interface ICustomTabConfiguration {
    id: string;
    title: string;
    location: string;
    mountCallbackName?: string;
    mountCallback?: (...args: any[]) => boolean | Promise<boolean>;
    pathsToJs: string[];
    pathsToCSS: string[];
    customParameters: { [key: string]: any };
    unmountOnHide: boolean;
    dependencyPromise?: Promise<any>;
    hideAsync?: (...args: any[]) => boolean | Promise<boolean>;
}

export interface ICustomTabWrapper {
    promise?: MobxPromise<boolean>;
    tab: ICustomTabConfiguration;
}
