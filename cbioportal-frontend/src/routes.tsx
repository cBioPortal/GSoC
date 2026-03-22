import React, { FunctionComponent, useEffect } from 'react';
import { Route, Redirect, Switch } from 'react-router-dom';
import { inject } from 'mobx-react';
import Container from 'appShell/App/Container';
import {
    handleIndexDO,
    handleCaseDO,
    restoreRouteAfterRedirect,
    handleStudyDO,
    handleLinkOut,
    handleEncodedRedirect,
    redirectTo,
} from './shared/lib/redirectHelpers';
import PageNotFound from './shared/components/pageNotFound/PageNotFound';
import { parse } from 'qs';
import _ from 'lodash';

/* HOW TO ADD A NEW ROUTE
 * 1. Import the "page" component using SuspenseWrapper and React.lazy as seen in imports below
 * 2. Add a Route element with `component` prop set to the component, wrapped in LocationValidationWrapper
 *      which validates the parameters of a page and goes to an error page if it fails. Other wrappers like
 *      ScrollToTop modify the page in other ways and may also be used here.
 */

// import page components here
// NOTE: to lazy load these, we use the bundle loader.  what we are importing are not the components but loaders
// which are invoked at run time by the routes
// webpack knows to 'split' the code into seperate bundles accordingly
// see article http://henleyedition.com/implicit-code-splitting-with-react-router-and-webpack/
const PatientViewPage = SuspenseWrapper(
    // @ts-ignore
    React.lazy(() => import('./pages/patientView/PatientViewPage'))
);
const ResultsViewPage = SuspenseWrapper(
    // @ts-ignore
    React.lazy(() => import('./pages/resultsView/ResultsViewPage'))
);
import TestimonialsPage from 'pages/staticPages/testimonialsPage/TestimonialsPage';
import GroupComparisonLoading from './pages/groupComparison/GroupComparisonLoading';
const DatasetPage = SuspenseWrapper(
    // @ts-ignore
    React.lazy(() => import('./pages/staticPages/datasetView/DatasetPage'))
);
const Homepage = SuspenseWrapper(
    // @ts-ignore
    React.lazy(() => import('./pages/home/HomePage'))
);
const StudyViewPage = SuspenseWrapper(
    // @ts-ignore
    React.lazy(() => import('./pages/studyView/StudyViewPage'))
);
const MutationMapperTool = SuspenseWrapper(
    React.lazy(() =>
        // @ts-ignore
        import('./pages/staticPages/tools/mutationMapper/MutationMapperTool')
    )
);
const OncoprinterTool = SuspenseWrapper(
    React.lazy(() =>
        // @ts-ignore
        import('./pages/staticPages/tools/oncoprinter/OncoprinterTool')
    )
);

const Visualize = SuspenseWrapper(
    // @ts-ignore
    React.lazy(() => import('./pages/staticPages/visualize/Visualize'))
);

const InstallationMap = SuspenseWrapper(
    React.lazy(() =>
        // @ts-ignore
        import('./pages/staticPages/installations/InstallationMap')
    )
);
const Software = SuspenseWrapper(
    // @ts-ignore
    React.lazy(() => import('./pages/staticPages/software/Software'))
);

const GroupComparisonPage = SuspenseWrapper(
    // @ts-ignore
    React.lazy(() => import('./pages/groupComparison/GroupComparisonPage'))
);
const ErrorPage = SuspenseWrapper(
    // @ts-ignore
    React.lazy(() => import('./pages/resultsView/ErrorPage'))
);

const WebAPIPage = SuspenseWrapper(
    // @ts-ignore
    React.lazy(() => import('./pages/staticPages/webAPI/WebAPIPage'))
);

import $ from 'jquery';
import { getBrowserWindow } from 'cbioportal-frontend-commons';
import { seekUrlHash } from 'shared/lib/seekUrlHash';
import { PagePath } from 'shared/enums/PagePaths';
import {
    LegacyResultsViewComparisonSubTab,
    ResultsViewComparisonSubTab,
    ResultsViewPathwaysSubTab,
    ResultsViewTab,
} from 'pages/resultsView/ResultsViewPageHelpers';
import {
    StudyViewPageTabKeyEnum,
    StudyViewResourceTabPrefix,
} from 'pages/studyView/StudyViewPageTabs';
import {
    PatientViewPageTabs,
    PatientViewResourceTabPrefix,
} from 'pages/patientView/PatientViewPageTabs';
import { GroupComparisonTab } from 'pages/groupComparison/GroupComparisonTabs';
import { CLIN_ATTR_DATA_TYPE } from 'shared/components/plots/PlotsTabUtils';
import { SpecialAttribute } from 'shared/cache/ClinicalDataCache';
import { AlterationTypeConstants } from 'shared/constants';
import {
    cnaGroup,
    mutationGroup,
} from 'shared/lib/comparison/ComparisonStoreUtils';
import { MapValues } from 'shared/lib/TypeScriptUtils';
import {
    ResultsViewURLQuery,
    sanitizeForUrl,
} from 'pages/resultsView/ResultsViewURLWrapper';
import { EnumDeclaration, EnumType } from 'typescript';

function SuspenseWrapper(Component: any) {
    return (props: any) => (
        <React.Suspense fallback={null}>
            <Component {...props} />
        </React.Suspense>
    );
}

function LocationValidationWrapper(
    Component: any,
    validator: (params: any) => boolean,
    queryParamsAdjuster?: (oldParams: any) => any | undefined
) {
    return (props: any) => {
        if (props.location) {
            if (queryParamsAdjuster) {
                const query = parse(props.location.search, {
                    depth: 0,
                    ignoreQueryPrefix: true,
                });
                const adjustedQuery = queryParamsAdjuster(query);
                if (adjustedQuery) {
                    // redirect to adjusted query if there's a change
                    const RedirectingBlankPage = getBlankPage(() => {
                        redirectTo(adjustedQuery, props.location.pathname);
                    });
                    return <RedirectingBlankPage />;
                }
            }

            if (
                !(
                    validator(props.match.params) ||
                    customTabParamValidator(props.location)
                )
            ) {
                return <ErrorPage {...props} />;
            }
        }

        return <Component {...props} />;
    };
}

function ResultsViewQueryParamsAdjuster(oldParams: ResultsViewURLQuery) {
    let changeMade = false;
    const newParams = _.cloneDeep(oldParams);
    if (
        newParams.comparison_subtab ===
        LegacyResultsViewComparisonSubTab.MUTATIONS
    ) {
        newParams.comparison_subtab = ResultsViewComparisonSubTab.ALTERATIONS;
        newParams.comparison_selectedEnrichmentEventTypes = JSON.stringify([
            ...mutationGroup,
        ]);
        changeMade = true;
    } else if (
        newParams.comparison_subtab === LegacyResultsViewComparisonSubTab.CNA
    ) {
        newParams.comparison_subtab = ResultsViewComparisonSubTab.ALTERATIONS;
        newParams.comparison_selectedEnrichmentEventTypes = JSON.stringify([
            ...cnaGroup,
        ]);
        changeMade = true;
    }
    // we used to call the structural variant alteration class "fusions"
    // we have generalized it to structural variants
    const profileRegex = /fusion/;
    if (profileRegex.test(oldParams.profileFilter)) {
        newParams.profileFilter = oldParams.profileFilter.replace(
            profileRegex,
            'structural_variants'
        );
        changeMade = true;
    }

    if (changeMade) {
        return newParams;
    } else {
        return undefined;
    }
}

function ScrollToTop(Component: any, onLoad = () => {}) {
    return (props: any) => {
        useEffect(() => {
            $(document).scrollTop(0);
            onLoad();
        }, []);
        return <Component {...props} />;
    };
}

function GoToHashLink(Component: any) {
    return (props: any) => {
        useEffect(handleEnter, []);
        return <Component {...props} />;
    };
}

/**
 * Validates that the parameters either do not have
 * a tab parameter, or have a parameter that matches a
 * value in `tabEnum`
 * @param tabEnum a TypeScript string enum
 */
function tabParamValidator(tabEnum: any) {
    return function(params: any) {
        return !params.tab || Object.values(tabEnum).indexOf(params.tab) > -1;
    };
}

function comparisonTabParamValidator() {
    // comparison tab includes generic assay tabs which is not predictable
    // validate tabs by checking it's degined in GroupComparisonTab
    // or validate generic assay tabs by checking if it starts with GroupComparisonTab.GENERIC_ASSAY_PREFIX
    return function(params: any) {
        return (
            !params.tab ||
            Object.values(GroupComparisonTab).indexOf(params.tab) > -1 ||
            params.tab.startsWith(GroupComparisonTab.GENERIC_ASSAY_PREFIX)
        );
    };
}

/**
 * Validates results page and patient page custom tabs
 * @param location
 */
function customTabParamValidator(location: Location) {
    const patientViewResourceTabRegex = new RegExp(
        `patient\/${PatientViewResourceTabPrefix}.+`
    );
    const studyViewResourceTabRegex = new RegExp(
        `study\/${StudyViewResourceTabPrefix}.+`
    );
    const customTabRegex = /.+\/customTab\d/;
    return (
        patientViewResourceTabRegex.test(location.pathname) ||
        studyViewResourceTabRegex.test(location.pathname) ||
        customTabRegex.test(location.pathname)
    );
}

var restoreRoute = inject('routing')(restoreRouteAfterRedirect);

let getBlankPage = function(onLoad: any) {
    return (props: any) => {
        if (onLoad) {
            useEffect(() => {
                onLoad();
                // make sure that useEffect argument doesn't return anything
            }, []);
        }
        return <div />;
    };
};

let redirectToNews: FunctionComponent<any> = function() {
    getBrowserWindow().location = 'https://docs.cbioportal.org/news';
    return null;
};

const externalRedirect = function(url: string) {
    let redirectComp: FunctionComponent<{}> = function() {
        getBrowserWindow().location = url;
        return null;
    };
    return redirectComp;
};

/* when route changes, we want to:
1. in spa, deep links from url (#) don't work because content is loading and thus doesn't exist to link to
   at time url changes.  seekHash is a somewhat dirty way of solving this issue
2, when there's no hash, we want to make sure we scroll to top because user considers herself on a "new page"
 */
function handleEnter() {
    const hash = getBrowserWindow().location.hash;
    if (hash.length > 0) {
        seekUrlHash(hash.replace('#', ''));
    } else {
        $(document).scrollTop(0);
    }
}

// we want to preload ResultsViewPage to prevent delay due to lazy loading bundle
// note: because we bundle, and bundles are loaded async, this does NOT affect time to render of default route
// results will load in background while user plays with query interface
function preloadImportantComponents() {
    setTimeout(() => {
        //@ts-ignore
        import('./pages/resultsView/ResultsViewPage');
        //@ts-ignore
        import('./pages/studyView/StudyViewPage');
    }, 2000);
}

export const makeRoutes = () => {
    return (
        <React.Suspense fallback={null}>
            <Switch>
                <Route
                    exact
                    path={'/'}
                    component={ScrollToTop(
                        Homepage,
                        preloadImportantComponents
                    )}
                />
                <Route path="/restore" component={ScrollToTop(restoreRoute)} />
                <Route
                    path="/loading/comparison"
                    component={ScrollToTop(GroupComparisonLoading)}
                />
                {/* Redirect legacy survival route directly to survival tab in comparison */}
                <Route
                    path={`/results/${ResultsViewTab.SURVIVAL_REDIRECT}`}
                    component={getBlankPage(() => {
                        redirectTo({}, '/results/comparison/survival');
                    })}
                />
                {/* Redirect legacy expression route directly to plots tab with mrna vs study */}
                <Route
                    path={`/results/${ResultsViewTab.EXPRESSION_REDIRECT}`}
                    component={getBlankPage(() => {
                        redirectTo(
                            {
                                plots_horz_selection: JSON.stringify({
                                    dataType: CLIN_ATTR_DATA_TYPE,
                                    selectedDataSourceOption:
                                        SpecialAttribute.StudyOfOrigin,
                                }),

                                plots_vert_selection: JSON.stringify({
                                    dataType:
                                        AlterationTypeConstants.MRNA_EXPRESSION,
                                    logScale: 'true',
                                }),
                            },
                            `/results/${ResultsViewTab.PLOTS}`
                        );
                    })}
                />
                {/* Redirect legacy enrichments route directly to mutations tab in comparison */}
                <Route
                    path="/results/enrichments"
                    component={getBlankPage(() => {
                        redirectTo(
                            { comparison_subtab: 'mutations' },
                            '/results/comparison'
                        );
                    })}
                />
                {/* 
                 This route handles backward compatibility for comparison subtabs:
                 - Supports both old query parameter format
                 - And new URL path format (/results/comparison/:subtab)
                */}
                <Route
                    path="/results/comparison/:subtab"
                    component={LocationValidationWrapper(
                        ResultsViewPage,
                        tabParamValidator(ResultsViewComparisonSubTab),
                        ResultsViewQueryParamsAdjuster
                    )}
                />
                <Route
                    path="/results/comparison"
                    component={getBlankPage(() => {
                        const query = parse(
                            getBrowserWindow().location.search,
                            {
                                ignoreQueryPrefix: true,
                            }
                        );
                        if (query.comparison_subtab) {
                            const sanitizedValue = sanitizeForUrl(
                                query.comparison_subtab as string
                            );
                            redirectTo(
                                {},
                                `/results/comparison/${sanitizedValue}`
                            );
                        } else {
                            redirectTo({}, '/results/comparison/overlap');
                        }
                    })}
                />
                {/* 
                 This route handles backward compatibility for pathways subtabs:
                 - Supports both old query parameter format 
                 - And new URL path format (/results/pathways/:subtab)
                */}
                <Route
                    path="/results/pathways/:subtab"
                    component={LocationValidationWrapper(
                        ResultsViewPage,
                        tabParamValidator(ResultsViewPathwaysSubTab),
                        ResultsViewQueryParamsAdjuster
                    )}
                />
                <Route
                    path="/results/pathways"
                    component={getBlankPage(() => {
                        const query = parse(
                            getBrowserWindow().location.search,
                            {
                                ignoreQueryPrefix: true,
                            }
                        );
                        if (query.pathways_source) {
                            const sanitizedValue = sanitizeForUrl(
                                query.pathways_source as string
                            );
                            redirectTo(
                                {},
                                `/results/pathways/${sanitizedValue}`
                            );
                        } else {
                            redirectTo({}, '/results/pathways/pathwaymapper');
                        }
                    })}
                />
                <Route
                    path="/results/:tab?"
                    component={LocationValidationWrapper(
                        ResultsViewPage,
                        tabParamValidator(ResultsViewTab),
                        ResultsViewQueryParamsAdjuster
                    )}
                />
                <Route
                    path={'/' + PagePath.Patient + '/:tab?'}
                    component={ScrollToTop(
                        LocationValidationWrapper(
                            PatientViewPage,
                            tabParamValidator(PatientViewPageTabs)
                        )
                    )}
                />
                <Route
                    path={'/' + PagePath.Study + '/:tab?'}
                    component={ScrollToTop(
                        LocationValidationWrapper(
                            StudyViewPage,
                            tabParamValidator(StudyViewPageTabKeyEnum)
                        )
                    )}
                />
                <Route
                    path="/comparison/:tab?"
                    component={ScrollToTop(
                        LocationValidationWrapper(
                            GroupComparisonPage,
                            comparisonTabParamValidator()
                        )
                    )}
                />
                <Route path="/webAPI" component={GoToHashLink(WebAPIPage)} />
                <Route path="/mutation_mapper" component={MutationMapperTool} />
                <Route path="/oncoprinter" component={OncoprinterTool} />
                <Route path="/datasets" component={ScrollToTop(DatasetPage)} />
                <Route path="/installations" component={InstallationMap} />
                <Route path="/visualize" component={ScrollToTop(Visualize)} />
                <Route path="/software" component={ScrollToTop(Software)} />
                // legacy pages redirect to docs site
                <Route
                    path="/tutorials"
                    component={externalRedirect(
                        'https://docs.cbioportal.org/user-guide/overview/#tutorial-slides'
                    )}
                />
                <Route
                    path="/rmatlab"
                    component={externalRedirect(
                        'https://docs.cbioportal.org/web-api-and-clients/#r-client'
                    )}
                />
                <Route
                    path="/about"
                    component={externalRedirect(
                        'https://docs.cbioportal.org/about-us/'
                    )}
                />
                <Route
                    path="/news"
                    component={externalRedirect(
                        'https://docs.cbioportal.org/news'
                    )}
                />
                <Route
                    path="/faq"
                    component={externalRedirect(
                        'https://docs.cbioportal.org/user-guide/faq/'
                    )}
                />
                <Route
                    path="/oql"
                    component={externalRedirect(
                        'https://docs.cbioportal.org/user-guide/by-page/#oql'
                    )}
                />
                <Route
                    path="/testimonials"
                    component={ScrollToTop(TestimonialsPage)}
                />
                <Route path="/case.do" component={getBlankPage(handleCaseDO)} />
                <Route
                    path="/index.do"
                    component={getBlankPage(handleIndexDO)}
                />
                <Route
                    path="/study.do"
                    component={getBlankPage(handleStudyDO)}
                />
                <Route path="/ln" component={getBlankPage(handleLinkOut)} />
                <Route
                    path="/link.do"
                    component={getBlankPage(handleLinkOut)}
                />
                <Route
                    path="/encodedRedirect"
                    component={getBlankPage(handleEncodedRedirect)}
                />
                <Redirect
                    path={'/mutation_mapper.jsp'}
                    to={'/mutation_mapper'}
                />
                <Redirect path={'/data_sets.jsp'} to={'/datasets'} />
                <Redirect path={'/oncoprinter.jsp'} to={'/oncoprinter'} />
                <Redirect path={'/onco_query_lang_desc.jsp'} to={'/oql'} />
                <Redirect path={'/tools.jsp'} to={'/visualize'} />
                <Redirect path={'/tutorials.jsp'} to={'/tutorials'} />
                <Redirect path={'/tutorial.jsp'} to={'/tutorials'} />
                <Redirect path={'/cgds_r.jsp'} to={'/rmatlab'} />
                <Route
                    path="*"
                    component={ScrollToTop(() => (
                        <PageNotFound />
                    ))}
                />
            </Switch>
        </React.Suspense>
    );
};

export default makeRoutes;
