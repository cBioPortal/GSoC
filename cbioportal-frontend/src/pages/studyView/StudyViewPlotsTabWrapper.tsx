import * as React from 'react';
import { StudyViewPageStore } from 'pages/studyView/StudyViewPageStore';
import StudyViewURLWrapper from 'pages/studyView/StudyViewURLWrapper';
import { observer } from 'mobx-react';
import PlotsTab from 'shared/components/plots/PlotsTab';

export const PlotsTabWrapper: React.FunctionComponent<{
    store: StudyViewPageStore;
    urlWrapper: StudyViewURLWrapper;
}> = observer(function({ store, urlWrapper }) {
    return (
        <PlotsTab
            filteredSamplesByDetailedCancerType={
                store.filteredSamplesByDetailedCancerType
            }
            mutations={store.mutations}
            studies={store.queriedPhysicalStudies}
            molecularProfileIdSuffixToMolecularProfiles={
                store.molecularProfileIdSuffixToMolecularProfiles
            }
            entrezGeneIdToGene={store.entrezGeneIdToGeneAll}
            sampleKeyToSample={store.sampleSetByKey}
            genes={store.allGenes}
            clinicalAttributes={store.clinicalAttributes}
            genesets={store.genesets}
            genericAssayEntitiesGroupByMolecularProfileId={
                store.genericAssayEntitiesGroupedByProfileId
            }
            customAttributes={store.customAttributes}
            studyIds={store.queriedPhysicalStudyIds}
            molecularProfilesWithData={store.molecularProfilesInStudies}
            molecularProfilesInStudies={store.molecularProfilesInStudies}
            annotatedCnaCache={store.annotatedCnaCache}
            annotatedMutationCache={store.annotatedMutationCache}
            structuralVariantCache={store.structuralVariantCache}
            studyToMutationMolecularProfile={
                store.studyToMutationMolecularProfile
            }
            studyToMolecularProfileDiscreteCna={
                store.studyToMolecularProfileDiscreteCna
            }
            clinicalDataCache={store.clinicalDataCache}
            patientKeyToFilteredSamples={store.patientKeyToFilteredSamples}
            numericGeneMolecularDataCache={store.numericGeneMolecularDataCache}
            coverageInformation={store.coverageInformation}
            filteredSamples={store.selectedSamples}
            genesetMolecularDataCache={store.genesetMolecularDataCache}
            genericAssayMolecularDataCache={
                store.genericAssayMolecularDataCache
            }
            studyToStructuralVariantMolecularProfile={
                store.studyToStructuralVariantMolecularProfile
            }
            driverAnnotationSettings={store.driverAnnotationSettings}
            studyIdToStudy={store.studyIdToStudy.result}
            structuralVariants={store.structuralVariants.result}
            hugoGeneSymbols={store.allHugoGeneSymbols.result}
            selectedGenericAssayEntitiesGroupByMolecularProfileId={
                store.selectedGenericAssayEntitiesGroupByMolecularProfileId
            }
            molecularProfileIdToMolecularProfile={
                store.molecularProfileIdToMolecularProfile
            }
            urlWrapper={urlWrapper}
            hasNoQueriedGenes={true}
            genePanelDataForAllProfiles={
                store.genePanelDataForAllProfiles.result
            }
            patients={store.patients}
        />
    );
});
