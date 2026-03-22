import { MSKTab, MSKTabs } from 'shared/components/MSKTabs/MSKTabs';
import LoadingIndicator from 'shared/components/loadingIndicator/LoadingIndicator';
import TimelineWrapper from 'pages/patientView/timeline/TimelineWrapper';
import WindowStore from 'shared/components/window/WindowStore';
import GenomicOverview from 'pages/patientView/genomicOverview/GenomicOverview';
import { defaultAlleleFrequencyHeaderTooltip } from 'pages/patientView/mutation/PatientViewMutationTable';
import { getServerConfig, ServerConfigHelpers } from 'config/config';
import StructuralVariantTableWrapper from 'pages/patientView/structuralVariant/StructuralVariantTableWrapper';
import CopyNumberTableWrapper from 'pages/patientView/copyNumberAlterations/CopyNumberTableWrapper';
import PatientViewMutationsTab from 'pages/patientView/mutation/PatientViewMutationsTab';
import PatientViewPathwayMapper from 'pages/patientView/pathwayMapper/PatientViewPathwayMapper';
import ClinicalInformationPatientTable from 'pages/patientView/clinicalInformation/ClinicalInformationPatientTable';
import ClinicalInformationSamples from 'pages/patientView/clinicalInformation/ClinicalInformationSamplesTable';
import ClinicalEventsTables from 'pages/patientView/timeline/ClinicalEventsTables';
import ResourcesTab, {
    RESOURCES_TAB_NAME,
} from 'pages/patientView/resources/ResourcesTab';
import PathologyReport from 'pages/patientView/pathologyReport/PathologyReport';
import IFrameLoader from 'shared/components/iframeLoader/IFrameLoader';
import { getDigitalSlideArchiveIFrameUrl } from 'shared/api/urls';
import TrialMatchTable from 'pages/patientView/trialMatch/TrialMatchTable';
import _ from 'lodash';
import MutationalSignaturesContainer from 'pages/patientView/mutationalSignatures/MutationalSignaturesContainer';
import { buildCustomTabs } from 'shared/lib/customTabs/customTabHelpers';
import * as React from 'react';
import SampleManager from 'pages/patientView/SampleManager';
import PatientViewPage from 'pages/patientView/PatientViewPage';
import PatientViewUrlWrapper from 'pages/patientView/PatientViewUrlWrapper';
import { CompactVAFPlot } from 'pages/patientView/genomicOverview/CompactVAFPlot';
import {
    computeMutationFrequencyBySample,
    doesFrequencyExist,
} from 'pages/patientView/genomicOverview/GenomicOverviewUtils';
import genomicOverviewStyles from 'pages/patientView/genomicOverview/styles.module.scss';
import FeatureInstruction from 'shared/FeatureInstruction/FeatureInstruction';
import { HelpWidget } from 'shared/components/HelpWidget/HelpWidget';
import MutationTableWrapper from './mutation/MutationTableWrapper';
import { PatientViewPageInner } from 'pages/patientView/PatientViewPage';
import { Else, If } from 'react-if';

export enum PatientViewPageTabs {
    Summary = 'summary',
    genomicEvolution = 'genomicEvolution',
    ClinicalData = 'clinicalData',
    FilesAndLinks = 'filesAndLinks',
    PathologyReport = 'pathologyReport',
    TissueImage = 'tissueImage',
    MSKTissueImage = 'MSKTissueImage',
    TrialMatchTab = 'trialMatchTab',
    MutationalSignatures = 'mutationalSignatures',
    PathwayMapper = 'pathways',
}

export const PatientViewResourceTabPrefix = 'openResource_';

export function getPatientViewResourceTabId(resourceId: string) {
    return `${PatientViewResourceTabPrefix}${resourceId}`;
}

export function extractResourceIdFromTabId(tabId: string) {
    const match = new RegExp(`${PatientViewResourceTabPrefix}(.*)`).exec(tabId);
    if (match) {
        return match[1];
    } else {
        return undefined;
    }
}

export function patientViewTabs(
    pageInstance: PatientViewPageInner,
    urlWrapper: PatientViewUrlWrapper,
    sampleManager: SampleManager | null
) {
    return (
        <MSKTabs
            id="patientViewPageTabs"
            key={urlWrapper.hash}
            activeTabId={urlWrapper.activeTabId}
            onTabClick={(id: string) => urlWrapper.setActiveTab(id)}
            className="mainTabs"
            getPaginationWidth={WindowStore.getWindowWidth}
            onMount={() => console.log('TABS MOUNT')}
            contentWindowExtra={
                <HelpWidget path={urlWrapper.routing.location.pathname} />
            }
        >
            {tabs(pageInstance, sampleManager, urlWrapper)}
        </MSKTabs>
    );
}

export function tabs(
    pageComponent: PatientViewPageInner,
    sampleManager: SampleManager | null,
    urlWrapper: PatientViewUrlWrapper
) {
    const tabs: JSX.Element[] = [];
    tabs.push(
        <MSKTab key={0} id={PatientViewPageTabs.Summary} linkText="Summary">
            <LoadingIndicator
                isLoading={
                    pageComponent.patientViewPageStore.clinicalEvents.isPending
                }
            />

            {!!sampleManager &&
                pageComponent.patientViewPageStore.clinicalEvents.isComplete &&
                pageComponent.patientViewPageStore.clinicalEvents.result
                    .length > 0 && (
                    <div>
                        <div
                            style={{
                                marginTop: 20,
                                marginBottom: 20,
                            }}
                        >
                            <TimelineWrapper
                                dataStore={
                                    pageComponent.patientViewMutationDataStore
                                }
                                caseMetaData={{
                                    color: sampleManager.sampleColors,
                                    label: sampleManager.sampleLabels,
                                    index: sampleManager.sampleIndex,
                                }}
                                data={
                                    pageComponent.patientViewPageStore
                                        .clinicalEvents.result
                                }
                                sampleManager={sampleManager}
                                width={WindowStore.size.width}
                                samples={
                                    pageComponent.patientViewPageStore.samples
                                        .result
                                }
                                mutationProfileId={
                                    pageComponent.patientViewPageStore
                                        .mutationMolecularProfileId.result!
                                }
                            />
                        </div>
                        <hr />
                    </div>
                )}

            <LoadingIndicator
                isLoading={
                    pageComponent.patientViewPageStore.mutationData.isPending ||
                    pageComponent.patientViewPageStore.cnaSegments.isPending ||
                    pageComponent.patientViewPageStore.sequencedSampleIdsInStudy
                        .isPending ||
                    pageComponent.patientViewPageStore
                        .sampleToMutationGenePanelId.isPending ||
                    pageComponent.patientViewPageStore
                        .sampleToDiscreteGenePanelId.isPending ||
                    pageComponent.patientViewPageStore.studies.isPending
                }
            />

            {pageComponent.patientViewPageStore.mutationData.isComplete &&
                pageComponent.patientViewPageStore.cnaSegments.isComplete &&
                pageComponent.patientViewPageStore.sequencedSampleIdsInStudy
                    .isComplete &&
                pageComponent.patientViewPageStore.sampleToMutationGenePanelId
                    .isComplete &&
                pageComponent.patientViewPageStore.sampleToDiscreteGenePanelId
                    .isComplete &&
                pageComponent.patientViewPageStore.studies.isComplete &&
                (pageComponent.patientViewPageStore
                    .mergedMutationDataFilteredByGene.length > 0 ||
                    pageComponent.patientViewPageStore.cnaSegments.result
                        .length > 0) &&
                sampleManager && (
                    <FeatureInstruction
                        content={
                            'Click alteration for detail. Double-click to zoom.'
                        }
                        style={{ top: -10 }}
                    >
                        <GenomicOverview
                            store={pageComponent.patientViewPageStore}
                            onResetView={pageComponent.onResetViewClick}
                            mergedMutations={
                                pageComponent.patientViewPageStore
                                    .mergedMutationDataFilteredByGene
                            }
                            samples={
                                pageComponent.patientViewPageStore.samples
                                    .result
                            }
                            cnaSegments={
                                pageComponent.patientViewPageStore.cnaSegments
                                    .result
                            }
                            sampleOrder={sampleManager.sampleIndex}
                            sampleLabels={sampleManager.sampleLabels}
                            sampleColors={sampleManager.sampleColors}
                            sampleManager={sampleManager}
                            containerWidth={WindowStore.size.width - 20}
                            sampleIdToMutationGenePanelId={
                                pageComponent.patientViewPageStore
                                    .sampleToMutationGenePanelId.result
                            }
                            sampleIdToCopyNumberGenePanelId={
                                pageComponent.patientViewPageStore
                                    .sampleToDiscreteGenePanelId.result
                            }
                            onSelectGenePanel={
                                pageComponent.toggleGenePanelModal
                            }
                            disableTooltip={pageComponent.genePanelModal.isOpen}
                            // assuming that all studies have the same reference genome
                            genome={
                                pageComponent.patientViewPageStore.studies
                                    .result[0]?.referenceGenome
                            }
                        />
                        <hr />
                    </FeatureInstruction>
                )}

            <LoadingIndicator
                isLoading={
                    pageComponent.patientViewPageStore.mutationData.isPending ||
                    pageComponent.patientViewPageStore.uncalledMutationData
                        .isPending ||
                    pageComponent.patientViewPageStore.oncoKbAnnotatedGenes
                        .isPending ||
                    pageComponent.patientViewPageStore.studyIdToStudy.isPending
                }
            />

            <div data-test="patientview-mutation-table">
                <MutationTableWrapper
                    patientViewPageStore={pageComponent.patientViewPageStore}
                    dataStore={pageComponent.patientViewMutationDataStore}
                    sampleManager={sampleManager}
                    sampleIds={
                        sampleManager
                            ? sampleManager.getActiveSampleIdsInOrder()
                            : []
                    }
                    mergeOncoKbIcons={
                        pageComponent.mergeMutationTableOncoKbIcons
                    }
                    onOncoKbIconToggle={pageComponent.handleOncoKbIconToggle}
                    columnVisibility={
                        pageComponent.mutationTableColumnVisibility
                    }
                    onFilterGenes={pageComponent.onFilterGenesMutationTable}
                    columnVisibilityProps={{
                        onColumnToggled:
                            pageComponent.onMutationTableColumnVisibilityToggled,
                    }}
                    onSelectGenePanel={pageComponent.toggleGenePanelModal}
                    disableTooltip={pageComponent.genePanelModal.isOpen}
                    onRowClick={pageComponent.onMutationTableRowClick}
                    onRowMouseEnter={pageComponent.onMutationTableRowMouseEnter}
                    onRowMouseLeave={pageComponent.onMutationTableRowMouseLeave}
                    namespaceColumns={
                        pageComponent.patientViewMutationDataStore
                            .namespaceColumnConfig
                    }
                    columns={pageComponent.columns}
                    pageMode={pageComponent.patientViewPageStore.pageMode}
                    alleleFreqHeaderRender={
                        pageComponent.patientViewPageStore
                            .mergedMutationDataFilteredByGene.length > 0 &&
                        doesFrequencyExist(
                            computeMutationFrequencyBySample(
                                pageComponent.patientViewPageStore
                                    .mergedMutationDataFilteredByGene,
                                sampleManager?.sampleIndex || {}
                            )
                        )
                            ? (name: string) => (
                                  <CompactVAFPlot
                                      mergedMutations={
                                          pageComponent.patientViewPageStore
                                              .mergedMutationDataFilteredByGene
                                      }
                                      sampleManager={
                                          pageComponent.patientViewPageStore
                                              .sampleManager.result
                                      }
                                      sampleIdToMutationGenePanelId={
                                          pageComponent.patientViewPageStore
                                              .sampleToMutationGenePanelId
                                              .result
                                      }
                                      sampleIdToCopyNumberGenePanelId={
                                          pageComponent.patientViewPageStore
                                              .sampleToDiscreteGenePanelId
                                              .result
                                      }
                                      tooltip={
                                          <div>
                                              {
                                                  defaultAlleleFrequencyHeaderTooltip
                                              }
                                          </div>
                                      }
                                      thumbnailComponent={
                                          <span
                                              style={{
                                                  display: 'inline-flex',
                                              }}
                                          >
                                              <span>{name}</span>
                                              <span
                                                  className={
                                                      genomicOverviewStyles.compactVafPlot
                                                  }
                                              >
                                                  {
                                                      CompactVAFPlot
                                                          .defaultProps
                                                          .thumbnailComponent
                                                  }
                                              </span>
                                          </span>
                                      }
                                  />
                              )
                            : undefined
                    }
                />
            </div>

            <hr />

            <StructuralVariantTableWrapper
                store={pageComponent.patientViewPageStore}
                onSelectGenePanel={pageComponent.toggleGenePanelModal}
                mergeOncoKbIcons={pageComponent.mergeMutationTableOncoKbIcons}
                onOncoKbIconToggle={pageComponent.handleOncoKbIconToggle}
                enableOncoKb={getServerConfig().show_oncokb}
                sampleIds={
                    sampleManager
                        ? sampleManager.getActiveSampleIdsInOrder()
                        : []
                }
                namespaceColumns={
                    pageComponent.patientViewPageStore.namespaceColumnConfig
                        .structVar
                }
                customDriverName={
                    getServerConfig()
                        .oncoprint_custom_driver_annotation_binary_menu_label!
                }
                customDriverDescription={
                    getServerConfig()
                        .oncoprint_custom_driver_annotation_binary_menu_description!
                }
                customDriverTiersName={
                    getServerConfig()
                        .oncoprint_custom_driver_annotation_tiers_menu_label!
                }
                customDriverTiersDescription={
                    getServerConfig()
                        .oncoprint_custom_driver_annotation_tiers_menu_description!
                }
            />

            <hr />

            {pageComponent.patientViewPageStore.studyIdToStudy.isComplete &&
                pageComponent.patientViewPageStore.genePanelIdToEntrezGeneIds
                    .isComplete &&
                pageComponent.patientViewPageStore.referenceGenes.isComplete &&
                pageComponent.patientViewPageStore.discreteMolecularProfile
                    .isComplete &&
                pageComponent.patientViewPageStore
                    .genePanelDataByMolecularProfileIdAndSampleId
                    .isComplete && (
                    <div data-test="patientview-copynumber-table">
                        <If
                            condition={
                                pageComponent.patientViewPageStore
                                    .discreteMolecularProfile.result
                            }
                        >
                            <Else>
                                <div className="alert alert-info" role="alert">
                                    Study is not profiled for copy number
                                    alterations.
                                </div>
                            </Else>
                            <CopyNumberTableWrapper
                                pageStore={pageComponent.patientViewPageStore}
                                dataStore={
                                    pageComponent.patientViewCnaDataStore
                                }
                                sampleIds={
                                    sampleManager
                                        ? sampleManager.getActiveSampleIdsInOrder()
                                        : []
                                }
                                sampleManager={sampleManager}
                                enableOncoKb={getServerConfig().show_oncokb}
                                columnVisibility={
                                    pageComponent.cnaTableColumnVisibility
                                }
                                onFilterGenes={
                                    pageComponent.onFilterGenesCopyNumberTable
                                }
                                columnVisibilityProps={{
                                    onColumnToggled:
                                        pageComponent.onCnaTableColumnVisibilityToggled,
                                }}
                                onSelectGenePanel={
                                    pageComponent.toggleGenePanelModal
                                }
                                disableTooltip={
                                    pageComponent.genePanelModal.isOpen
                                }
                                mergeOncoKbIcons={
                                    pageComponent.mergeMutationTableOncoKbIcons
                                }
                                onOncoKbIconToggle={
                                    pageComponent.handleOncoKbIconToggle
                                }
                                onRowClick={pageComponent.onCnaTableRowClick}
                                namespaceColumns={
                                    pageComponent.patientViewPageStore
                                        .namespaceColumnConfig.cna
                                }
                                customDriverName={
                                    getServerConfig()
                                        .oncoprint_custom_driver_annotation_binary_menu_label!
                                }
                                customDriverDescription={
                                    getServerConfig()
                                        .oncoprint_custom_driver_annotation_binary_menu_description!
                                }
                                customDriverTiersName={
                                    getServerConfig()
                                        .oncoprint_custom_driver_annotation_tiers_menu_label!
                                }
                                customDriverTiersDescription={
                                    getServerConfig()
                                        .oncoprint_custom_driver_annotation_tiers_menu_description!
                                }
                            />
                        </If>
                    </div>
                )}
        </MSKTab>
    );

    !!sampleManager &&
        pageComponent.patientViewPageStore.sampleIds.length > 1 &&
        pageComponent.patientViewPageStore.existsSomeMutationWithVAFData &&
        tabs.push(
            <MSKTab key={1} id="genomicEvolution" linkText="Genomic Evolution">
                <PatientViewMutationsTab
                    patientViewPageStore={pageComponent.patientViewPageStore}
                    mutationTableColumnVisibility={
                        pageComponent.mutationTableColumnVisibility
                    }
                    sampleIds={pageComponent.patientViewPageStore.sampleIds}
                    onMutationTableColumnVisibilityToggled={
                        pageComponent.onMutationTableColumnVisibilityToggled
                    }
                    sampleManager={sampleManager}
                    urlWrapper={pageComponent.urlWrapper}
                    mergeOncoKbIcons={
                        pageComponent.mergeMutationTableOncoKbIcons
                    }
                    onOncoKbIconToggle={pageComponent.handleOncoKbIconToggle}
                    customDriverName={
                        getServerConfig()
                            .oncoprint_custom_driver_annotation_binary_menu_label!
                    }
                    customDriverDescription={
                        getServerConfig()
                            .oncoprint_custom_driver_annotation_binary_menu_description!
                    }
                    customDriverTiersName={
                        getServerConfig()
                            .oncoprint_custom_driver_annotation_tiers_menu_label!
                    }
                    customDriverTiersDescription={
                        getServerConfig()
                            .oncoprint_custom_driver_annotation_tiers_menu_description!
                    }
                />
            </MSKTab>
        );

    tabs.push(
        <MSKTab
            key={8}
            id={PatientViewPageTabs.PathwayMapper}
            linkText={'Pathways'}
        >
            {pageComponent.patientViewPageStore.geneticTrackData.isComplete &&
            pageComponent.patientViewPageStore
                .mergedMutationDataIncludingUncalledFilteredByGene ? (
                <PatientViewPathwayMapper
                    store={pageComponent.patientViewPageStore}
                    sampleManager={sampleManager}
                />
            ) : (
                <LoadingIndicator isLoading={true} size={'big'} center={true} />
            )}
        </MSKTab>
    );

    tabs.push(
        <MSKTab
            key={2}
            id={PatientViewPageTabs.ClinicalData}
            linkText="Clinical Data"
            className={'patient-clinical-data-tab'}
        >
            <div className="clearfix">
                <h3 className={'pull-left'}>Patient</h3>
                {pageComponent.patientViewPageStore.clinicalDataPatient
                    .isComplete && (
                    <ClinicalInformationPatientTable
                        showTitleBar={true}
                        data={
                            pageComponent.patientViewPageStore
                                .clinicalDataPatient.result
                        }
                    />
                )}
            </div>

            <div className="clearfix">
                <h3 className={'pull-left'}>Samples</h3>
                {pageComponent.patientViewPageStore.clinicalDataGroupedBySample
                    .isComplete && (
                    <ClinicalInformationSamples
                        samples={
                            pageComponent.patientViewPageStore
                                .clinicalDataGroupedBySample.result!
                        }
                    />
                )}
            </div>

            <h2 className={'divider'}>Timeline Data</h2>

            {pageComponent.patientViewPageStore.clinicalEvents.isComplete && (
                <ClinicalEventsTables
                    clinicalEvents={
                        pageComponent.patientViewPageStore.clinicalEvents.result
                    }
                />
            )}
        </MSKTab>
    );

    if (pageComponent.shouldShowResources)
        tabs.push(
            <MSKTab
                key={4}
                id={PatientViewPageTabs.FilesAndLinks}
                linkText={RESOURCES_TAB_NAME}
            >
                <div>
                    <ResourcesTab
                        store={pageComponent.patientViewPageStore}
                        sampleManager={
                            pageComponent.patientViewPageStore.sampleManager
                                .result!
                        }
                        openResource={pageComponent.openResource}
                    />
                </div>
            </MSKTab>
        );

    tabs.push(
        <MSKTab
            key={3}
            id={PatientViewPageTabs.PathologyReport}
            linkText="Pathology Report"
            hide={!pageComponent.shouldShowPathologyReport}
        >
            <div>
                {pageComponent.patientViewPageStore.pathologyReport
                    .isComplete && (
                    <PathologyReport
                        iframeHeight={WindowStore.size.height - 220}
                        pdfs={
                            pageComponent.patientViewPageStore.pathologyReport
                                .result
                        }
                    />
                )}
            </div>
        </MSKTab>
    );

    tabs.push(
        <MSKTab
            key={5}
            id={PatientViewPageTabs.TissueImage}
            linkText="Tissue Image"
            hide={pageComponent.hideTissueImageTab}
        >
            <div>
                <IFrameLoader
                    height={WindowStore.size.height - 220}
                    url={getDigitalSlideArchiveIFrameUrl(
                        pageComponent.patientViewPageStore.patientId
                    )}
                />
            </div>
        </MSKTab>
    );

    pageComponent.showWholeSlideViewerTab &&
        pageComponent.wholeSlideViewerUrl.result &&
        tabs.push(
            <MSKTab
                key={6}
                id={PatientViewPageTabs.MSKTissueImage}
                linkText="Tissue Image"
                unmountOnHide={false}
            >
                <div>
                    <IFrameLoader
                        height={WindowStore.size.height - 220}
                        url={pageComponent.wholeSlideViewerUrl.result!}
                    />
                </div>
            </MSKTab>
        );

    pageComponent.shouldShowTrialMatch &&
        tabs.push(
            <MSKTab
                key={7}
                id={PatientViewPageTabs.TrialMatchTab}
                linkText="Matched Trials"
            >
                <TrialMatchTable
                    sampleManager={sampleManager}
                    detailedTrialMatches={
                        pageComponent.patientViewPageStore.detailedTrialMatches
                            .result
                    }
                    containerWidth={WindowStore.size.width - 20}
                />
            </MSKTab>
        );

    pageComponent.patientViewPageStore.hasMutationalSignatureData.result &&
        pageComponent.patientViewPageStore.initialMutationalSignatureVersion
            .isComplete &&
        tabs.push(
            <MSKTab
                key={8}
                id="mutationalSignatures"
                linkText="Mutational Signatures"
                hide={
                    pageComponent.patientViewPageStore
                        .mutationalSignatureMolecularProfiles.isPending ||
                    pageComponent.patientViewPageStore
                        .initialMutationalSignatureVersion.isPending ||
                    _.isEmpty(
                        pageComponent.patientViewPageStore
                            .mutationalSignatureDataGroupByVersion.result
                    )
                }
            >
                <MutationalSignaturesContainer
                    data={
                        pageComponent.patientViewPageStore
                            .mutationalSignatureDataGroupByVersion.result
                    }
                    profiles={
                        pageComponent.patientViewPageStore
                            .mutationalSignatureMolecularProfiles.result
                    }
                    onVersionChange={
                        pageComponent.onMutationalSignatureVersionChange
                    }
                    version={
                        pageComponent.patientViewPageStore
                            .selectedMutationalSignatureVersion
                    }
                    dataCount={
                        pageComponent.patientViewPageStore
                            .mutationalSignatureCountDataGroupedByVersion.result
                    }
                    sample={
                        pageComponent.patientViewPageStore
                            .selectedSampleMutationalSignatureData
                    }
                    samples={
                        pageComponent.patientViewPageStore
                            .samplesWithDataAvailable
                    }
                    samplesNotProfiled={
                        pageComponent.patientViewPageStore
                            .samplesNotProfiledForMutationalSignatures
                    }
                    onSampleChange={pageComponent.onSampleIdChange}
                />
            </MSKTab>
        );

    pageComponent.resourceTabs.component &&
        /* @ts-ignore */
        tabs.push(...pageComponent.resourceTabs.component);

    tabs.push(...buildCustomTabs(pageComponent.customTabs));

    // {getServerConfig().custom_tabs &&
    //     getServerConfig()
    //         .custom_tabs.filter(
    //             (tab: any) =>
    //                 tab.location === 'PATIENT_PAGE'
    //         )
    //         .map((tab: any, i: number) => {
    //             return (
    //                 <MSKTab
    //                     key={getPatientViewResourceTabId(
    //                         'customTab' + i
    //                     )}
    //                     id={getPatientViewResourceTabId(
    //                         'customTab' + i
    //                     )}
    //                     unmountOnHide={
    //                         tab.unmountOnHide ===
    //                         true
    //                     }
    //                     onTabDidMount={div => {
    //                         this.customTabMountCallback(
    //                             div,
    //                             tab
    //                         );
    //                     }}
    //                     linkText={tab.title}
    //                 ></MSKTab>
    //             );
    //         })}

    return tabs;
}
