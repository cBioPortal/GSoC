import * as request from "superagent";

type CallbackHandler = (err: any, res ? : request.Response) => void;
export type AlterationCountByGene = {
    'entrezGeneId': number

        'entrezGeneIds': Array < number >

        'hugoGeneSymbol': string

        'hugoGeneSymbols': Array < string >

        'matchingGenePanelIds': Array < string >

        'numberOfAlteredCases': number

        'numberOfAlteredCasesOnPanel': number

        'numberOfProfiledCases': number

        'qValue': number

        'totalCount': number

        'uniqueEventKey': string

};
export type AlterationCountByStructuralVariant = {
    'entrezGeneIds': Array < number >

        'gene1EntrezGeneId': number

        'gene1HugoGeneSymbol': string

        'gene2EntrezGeneId': number

        'gene2HugoGeneSymbol': string

        'hugoGeneSymbols': Array < string >

        'matchingGenePanelIds': Array < string >

        'numberOfAlteredCases': number

        'numberOfAlteredCasesOnPanel': number

        'numberOfProfiledCases': number

        'totalCount': number

        'uniqueEventKey': string

};
export type AlterationEnrichment = {
    'counts': Array < CountSummary >

        'cytoband': string

        'entrezGeneId': number

        'hugoGeneSymbol': string

        'pValue': number

};
export type AlterationFilter = {
    'copyNumberAlterationEventTypes': {}

    'includeDriver': boolean

        'includeGermline': boolean

        'includeSomatic': boolean

        'includeUnknownOncogenicity': boolean

        'includeUnknownStatus': boolean

        'includeUnknownTier': boolean

        'includeVUS': boolean

        'mutationEventTypes': {}

        'structuralVariants': boolean

        'tiersBooleanMap': {}

};
export type AndedPatientTreatmentFilters = {
    'filters': Array < OredPatientTreatmentFilters >

};
export type AndedSampleTreatmentFilters = {
    'filters': Array < OredSampleTreatmentFilters >

};
export type BinsGeneratorConfig = {
    'anchorValue': number

        'binSize': number

};
export type CaseListDataCount = {
    'count': number

        'label': string

        'value': string

};
export type ClinicalAttribute = {
    'clinicalAttributeId': string

        'datatype': string

        'description': string

        'displayName': string

        'patientAttribute': boolean

        'priority': string

        'studyId': string

};
export type ClinicalAttributeCount = {
    'clinicalAttributeId': string

        'count': number

};
export type ClinicalAttributeCountFilter = {
    'sampleIdentifiers': Array < SampleIdentifier >

        'sampleListId': string

};
export type ClinicalData = {
    'clinicalAttribute': ClinicalAttribute

        'clinicalAttributeId': string

        'patientAttribute': boolean

        'patientId': string

        'sampleId': string

        'studyId': string

        'uniquePatientKey': string

        'uniqueSampleKey': string

        'value': string

};
export type ClinicalDataBin = {
    'attributeId': string

        'count': number

        'end': number

        'specialValue': string

        'start': number

};
export type ClinicalDataBinCountFilter = {
    'attributes': Array < ClinicalDataBinFilter >

        'studyViewFilter': StudyViewFilter

};
export type ClinicalDataBinFilter = {
    'attributeId': string

        'binMethod': "MEDIAN" | "QUARTILE" | "CUSTOM" | "GENERATE"

        'binsGeneratorConfig': BinsGeneratorConfig

        'customBins': Array < number >

        'disableLogScale': boolean

        'end': number

        'start': number

};
export type ClinicalDataCount = {
    'count': number

        'value': string

};
export type ClinicalDataCountFilter = {
    'attributes': Array < ClinicalDataFilter >

        'studyViewFilter': StudyViewFilter

};
export type ClinicalDataCountItem = {
    'attributeId': string

        'counts': Array < ClinicalDataCount >

};
export type ClinicalDataEnrichment = {
    'clinicalAttribute': ClinicalAttribute

        'method': string

        'pValue': number

        'score': number

};
export type ClinicalDataFilter = {
    'attributeId': string

        'values': Array < DataFilterValue >

};
export type ClinicalEvent = {
    'attributes': Array < ClinicalEventData >

        'endNumberOfDaysSinceDiagnosis': number

        'eventType': string

        'patientId': string

        'startNumberOfDaysSinceDiagnosis': number

        'studyId': string

        'uniquePatientKey': string

        'uniqueSampleKey': string

};
export type ClinicalEventAttributeRequest = {
    'clinicalEventRequests': Array < ClinicalEventRequest >

        'patientIdentifiers': Array < PatientIdentifier >

};
export type ClinicalEventData = {
    'key': string

        'value': string

};
export type ClinicalEventRequest = {
    'attributes': Array < ClinicalEventData >

        'eventType': string

};
export type ClinicalEventRequestIdentifier = {
    'clinicalEventRequests': Array < ClinicalEventRequest >

        'position': "FIRST" | "LAST"

};
export type ClinicalEventSample = {
    'patientId': string

        'sampleId': string

        'studyId': string

        'timeTaken': number

};
export type ClinicalEventTypeCount = {
    'count': number

        'eventType': string

};
export type ClinicalViolinPlotBoxData = {
    'median': number

        'q1': number

        'q3': number

        'whiskerLower': number

        'whiskerUpper': number

};
export type ClinicalViolinPlotData = {
    'axisEnd': number

        'axisStart': number

        'rows': Array < ClinicalViolinPlotRowData >

};
export type ClinicalViolinPlotIndividualPoint = {
    'sampleId': string

        'studyId': string

        'value': number

};
export type ClinicalViolinPlotRowData = {
    'boxData': ClinicalViolinPlotBoxData

        'category': string

        'curveData': Array < number >

        'individualPoints': Array < ClinicalViolinPlotIndividualPoint >

        'numSamples': number

};
export type CoExpression = {
    'geneticEntityId': string

        'geneticEntityType': "GENE" | "GENESET" | "PHOSPHOPROTEIN" | "GENERIC_ASSAY"

        'pValue': number

        'spearmansCorrelation': number

};
export type CoExpressionFilter = {
    'entrezGeneId': number

        'genesetId': string

        'sampleIds': Array < string >

        'sampleListId': string

};
export type ContentDisposition = {
    'attachment': boolean

        'charset': {
        'registered': boolean

    }

        'creationDate': string

        'filename': string

        'formData': boolean

        'inline': boolean

        'modificationDate': string

        'name': string

        'readDate': string

        'size': number

        'type': string

};
export type CopyNumberCount = {
    'alteration': number

        'entrezGeneId': number

        'molecularProfileId': string

        'numberOfSamples': number

        'numberOfSamplesWithAlterationInGene': number

};
export type CopyNumberCountByGene = {
    'alteration': number

        'cytoband': string

        'entrezGeneId': number

        'entrezGeneIds': Array < number >

        'hugoGeneSymbol': string

        'hugoGeneSymbols': Array < string >

        'matchingGenePanelIds': Array < string >

        'numberOfAlteredCases': number

        'numberOfAlteredCasesOnPanel': number

        'numberOfProfiledCases': number

        'qValue': number

        'totalCount': number

        'uniqueEventKey': string

};
export type CopyNumberCountIdentifier = {
    'alteration': number

        'entrezGeneId': number

};
export type CountSummary = {
    'alteredCount': number

        'name': string

        'profiledCount': number

};
export type CustomDriverAnnotationReport = {
    'hasBinary': boolean

        'tiers': Array < string >

};
export type DataAccessToken = {
    'creation': string

        'expiration': string

        'token': string

        'username': string

};
export type DataFilter = {
    'values': Array < DataFilterValue >

};
export type DataFilterValue = {
    'end': number

        'start': number

        'value': string

};
export type DensityPlotBin = {
    'binX': number

        'binY': number

        'count': number

        'maxX': number

        'maxY': number

        'minX': number

        'minY': number

};
export type DensityPlotData = {
    'bins': Array < DensityPlotBin >

        'pearsonCorr': number

        'spearmanCorr': number

};
export type GeneFilter = {
    'geneQueries': Array < Array < GeneFilterQuery >
        >

        'molecularProfileIds': Array < string >

};
export type GeneFilterQuery = {
    'alterations': Array < "AMP" | "GAIN" | "DIPLOID" | "HETLOSS" | "HOMDEL" >

        'entrezGeneId': number

        'hugoGeneSymbol': string

        'includeDriver': boolean

        'includeGermline': boolean

        'includeSomatic': boolean

        'includeUnknownOncogenicity': boolean

        'includeUnknownStatus': boolean

        'includeUnknownTier': boolean

        'includeVUS': boolean

        'tiersBooleanMap': {}

};
export type GenericAssayBinaryEnrichment = {
    'counts': Array < GenericAssayCountSummary >

        'genericEntityMetaProperties': {}

        'groupsStatistics': Array < GroupStatistics >

        'name': string

        'pValue': number

        'qValue': number

        'stableId': string

};
export type GenericAssayCategoricalEnrichment = {
    'genericEntityMetaProperties': {}

    'groupsStatistics': Array < GroupStatistics >

        'name': string

        'pValue': number

        'qValue': number

        'stableId': string

};
export type GenericAssayCountSummary = {
    'count': number

        'name': string

        'totalCount': number

};
export type GenericAssayDataBin = {
    'count': number

        'end': number

        'profileType': string

        'specialValue': string

        'stableId': string

        'start': number

};
export type GenericAssayDataBinCountFilter = {
    'genericAssayDataBinFilters': Array < GenericAssayDataBinFilter >

        'studyViewFilter': StudyViewFilter

};
export type GenericAssayDataBinFilter = {
    'binMethod': "MEDIAN" | "QUARTILE" | "CUSTOM" | "GENERATE"

        'binsGeneratorConfig': BinsGeneratorConfig

        'customBins': Array < number >

        'disableLogScale': boolean

        'end': number

        'profileType': string

        'stableId': string

        'start': number

};
export type GenericAssayDataCount = {
    'count': number

        'value': string

};
export type GenericAssayDataCountFilter = {
    'genericAssayDataFilters': Array < GenericAssayDataFilter >

        'studyViewFilter': StudyViewFilter

};
export type GenericAssayDataCountItem = {
    'counts': Array < GenericAssayDataCount >

        'stableId': string

};
export type GenericAssayDataFilter = {
    'profileType': string

        'stableId': string

        'values': Array < DataFilterValue >

};
export type GenericAssayEnrichment = {
    'genericEntityMetaProperties': {}

    'groupsStatistics': Array < GroupStatistics >

        'name': string

        'pValue': number

        'qValue': number

        'stableId': string

};
export type Geneset = {
    'description': string

        'genesetId': string

        'name': string

        'refLink': string

        'representativePvalue': number

        'representativeScore': number

};
export type GenesetCorrelation = {
    'correlationValue': number

        'entrezGeneId': number

        'expressionGeneticProfileId': string

        'hugoGeneSymbol': string

        'zScoreGeneticProfileId': string

};
export type GenesetDataFilterCriteria = {
    'genesetIds': Array < string >

        'sampleIds': Array < string >

        'sampleListId': string

};
export type GenesetHierarchyInfo = {
    'genesets': Array < Geneset >

        'nodeId': number

        'nodeName': string

        'parentId': number

        'parentNodeName': string

};
export type GenesetMolecularData = {
    'geneset': Geneset

        'genesetId': string

        'geneticProfileId': string

        'patientId': string

        'sampleId': string

        'stableId': string

        'studyId': string

        'uniquePatientKey': string

        'uniqueSampleKey': string

        'value': string

};
export type GenomicDataBin = {
    'count': number

        'end': number

        'hugoGeneSymbol': string

        'profileType': string

        'specialValue': string

        'start': number

};
export type GenomicDataBinCountFilter = {
    'genomicDataBinFilters': Array < GenomicDataBinFilter >

        'studyViewFilter': StudyViewFilter

};
export type GenomicDataBinFilter = {
    'binMethod': "MEDIAN" | "QUARTILE" | "CUSTOM" | "GENERATE"

        'binsGeneratorConfig': BinsGeneratorConfig

        'customBins': Array < number >

        'disableLogScale': boolean

        'end': number

        'hugoGeneSymbol': string

        'profileType': string

        'start': number

};
export type GenomicDataCount = {
    'count': number

        'label': string

        'sampleIds': Array < string >

        'uniqueCount': number

        'value': string

};
export type GenomicDataCountFilter = {
    'genomicDataFilters': Array < GenomicDataFilter >

        'studyViewFilter': StudyViewFilter

};
export type GenomicDataCountItem = {
    'counts': Array < GenomicDataCount >

        'hugoGeneSymbol': string

        'profileType': string

};
export type GenomicDataFilter = {
    'hugoGeneSymbol': string

        'profileType': string

        'values': Array < DataFilterValue >

};
export type GenomicEnrichment = {
    'cytoband': string

        'entrezGeneId': number

        'groupsStatistics': Array < GroupStatistics >

        'hugoGeneSymbol': string

        'pValue': number

};
export type Gistic = {
    'amp': boolean

        'chromosome': number

        'cytoband': string

        'genes': Array < GisticToGene >

        'qValue': number

        'studyId': string

        'widePeakEnd': number

        'widePeakStart': number

};
export type GisticToGene = {
    'entrezGeneId': number

        'hugoGeneSymbol': string

};
export type Group = {
    'name': string

        'sampleIdentifiers': Array < SampleIdentifier >

};
export type GroupFilter = {
    'groups': Array < Group >

};
export type GroupStatistics = {
    'meanExpression': number

        'name': string

        'standardDeviation': number

};
export type HttpMethod = {};
export type HttpRange = {};
export type HttpStatusCode = {
    'error': boolean

        'is1xxInformational': boolean

        'is2xxSuccessful': boolean

        'is3xxRedirection': boolean

        'is4xxClientError': boolean

        'is5xxServerError': boolean

};
export type MediaType = {
    'parameters': {}

    'charset': {
        'registered': boolean

    }

    'concrete': boolean

        'qualityValue': number

        'subtype': string

        'subtypeSuffix': string

        'type': string

        'wildcardSubtype': boolean

        'wildcardType': boolean

};
export type MolecularProfileCaseIdentifier = {
    'caseId': string

        'molecularProfileId': string

};
export type MolecularProfileCasesGroupAndAlterationTypeFilter = {
    'alterationEventTypes': AlterationFilter

        'molecularProfileCasesGroupFilter': Array < MolecularProfileCasesGroupFilter >

};
export type MolecularProfileCasesGroupFilter = {
    'molecularProfileCaseIdentifiers': Array < MolecularProfileCaseIdentifier >

        'name': string

};
export type MrnaPercentile = {
    'entrezGeneId': number

        'molecularProfileId': string

        'patientId': string

        'percentile': number

        'sampleId': string

        'studyId': string

        'uniquePatientKey': string

        'uniqueSampleKey': string

        'zScore': number

};
export type MutSig = {
    'entrezGeneId': number

        'hugoGeneSymbol': string

        'numberOfMutations': number

        'pValue': number

        'qValue': number

        'rank': number

        'studyId': string

};
export type MutationCountByPosition = {
    'count': number

        'entrezGeneId': number

        'proteinPosEnd': number

        'proteinPosStart': number

};
export type MutationDataFilter = {
    'categorization': "MUTATED" | "MUTATION_TYPE"

        'hugoGeneSymbol': string

        'profileType': string

        'values': Array < Array < DataFilterValue >
        >

};
export type MutationPositionIdentifier = {
    'entrezGeneId': number

        'proteinPosEnd': number

        'proteinPosStart': number

};
export type MutationSpectrum = {
    'CtoA': number

        'CtoG': number

        'CtoT': number

        'TtoA': number

        'TtoC': number

        'TtoG': number

        'molecularProfileId': string

        'patientId': string

        'sampleId': string

        'studyId': string

        'uniquePatientKey': string

        'uniqueSampleKey': string

};
export type MutationSpectrumFilter = {
    'sampleIds': Array < string >

        'sampleListId': string

};
export type NamespaceAttribute = {
    'innerKey': string

        'outerKey': string

};
export type NamespaceAttributeCount = {
    'count': number

        'innerKey': string

        'outerKey': string

};
export type NamespaceAttributeCountFilter = {
    'namespaceAttributes': Array < NamespaceAttribute >

        'sampleIdentifiers': Array < SampleIdentifier >

};
export type NamespaceComparisonFilter = {
    'namespaceAttribute': NamespaceAttribute

        'sampleIdentifiers': Array < SampleIdentifier >

        'values': Array < string >

};
export type NamespaceData = {
    'attrValue': string

        'innerKey': string

        'outerKey': string

        'patientId': string

        'sampleId': string

        'studyId': string

        'uniquePatientKey': string

        'uniqueSampleKey': string

};
export type NamespaceDataCount = {
    'count': number

        'totalCount': number

        'value': string

};
export type NamespaceDataCountFilter = {
    'attributes': Array < NamespaceDataFilter >

        'studyViewFilter': StudyViewFilter

};
export type NamespaceDataCountItem = {
    'counts': Array < NamespaceDataCount >

        'innerKey': string

        'outerKey': string

};
export type NamespaceDataFilter = {
    'innerKey': string

        'outerKey': string

        'values': Array < Array < DataFilterValue >
        >

};
export type OredPatientTreatmentFilters = {
    'filters': Array < PatientTreatmentFilter >

};
export type OredSampleTreatmentFilters = {
    'filters': Array < SampleTreatmentFilter >

};
export type PatientIdentifier = {
    'patientId': string

        'studyId': string

};
export type PatientTreatment = {
    'count': number

        'treatment': string

};
export type PatientTreatmentFilter = {
    'treatment': string

};
export type PatientTreatmentReport = {
    'patientTreatments': Array < PatientTreatment >

        'totalPatients': number

        'totalSamples': number

};
export type PatientTreatmentRow = {
    'count': number

        'samples': Array < ClinicalEventSample >

        'treatment': string

};
export type ReferenceGenomeGene = {
    'chromosome': string

        'cytoband': string

        'end': number

        'entrezGeneId': number

        'hugoGeneSymbol': string

        'referenceGenomeId': number

        'start': number

};
export type ResourceData = {
    'patientId': string

        'resourceDefinition': ResourceDefinition

        'resourceId': string

        'sampleId': string

        'studyId': string

        'uniquePatientKey': string

        'uniqueSampleKey': string

        'url': string

};
export type ResourceDefinition = {
    'customMetaData': string

        'description': string

        'displayName': string

        'openByDefault': boolean

        'priority': string

        'resourceId': string

        'resourceType': "STUDY" | "SAMPLE" | "PATIENT"

        'studyId': string

};
export type ResponseEntityReferenceGenomeGene = {
    'body': ReferenceGenomeGene

        'headers': {
        'host': {
            'address': {
                'address': string

                    'anyLocalAddress': boolean

                    'canonicalHostName': string

                    'hostAddress': string

                    'hostName': string

                    'linkLocalAddress': boolean

                    'loopbackAddress': boolean

                    'mcglobal': boolean

                    'mclinkLocal': boolean

                    'mcnodeLocal': boolean

                    'mcorgLocal': boolean

                    'mcsiteLocal': boolean

                    'multicastAddress': boolean

                    'siteLocalAddress': boolean

            }

            'hostName': string

                'hostString': string

                'port': number

                'unresolved': boolean

        }

        'accept': Array < MediaType >

            'acceptCharset': Array < {
                'registered': boolean

            } >

            'acceptLanguage': Array < {
                'range': string

                    'weight': number

            } >

            'acceptLanguageAsLocales': Array < {
                'country': string

                    'displayCountry': string

                    'displayLanguage': string

                    'displayName': string

                    'displayScript': string

                    'displayVariant': string

                    'extensionKeys': Array < string >

                    'iso3Country': string

                    'iso3Language': string

                    'language': string

                    'script': string

                    'unicodeLocaleAttributes': Array < string >

                    'unicodeLocaleKeys': Array < string >

                    'variant': string

            } >

            'acceptPatch': Array < MediaType >

            'accessControlAllowCredentials': boolean

            'accessControlAllowHeaders': Array < string >

            'accessControlAllowMethods': Array < HttpMethod >

            'accessControlAllowOrigin': string

            'accessControlExposeHeaders': Array < string >

            'accessControlMaxAge': number

            'accessControlRequestHeaders': Array < string >

            'accessControlRequestMethod': HttpMethod

            'all': {}

            'allow': Array < HttpMethod >

            'basicAuth': string

            'bearerAuth': string

            'cacheControl': string

            'connection': Array < string >

            'contentDisposition': ContentDisposition

            'contentLanguage': {
            'country': string

                'displayCountry': string

                'displayLanguage': string

                'displayName': string

                'displayScript': string

                'displayVariant': string

                'extensionKeys': Array < string >

                'iso3Country': string

                'iso3Language': string

                'language': string

                'script': string

                'unicodeLocaleAttributes': Array < string >

                'unicodeLocaleKeys': Array < string >

                'variant': string

        }

            'contentLength': number

            'contentType': MediaType

            'date': number

            'empty': boolean

            'etag': string

            'expires': number

            'ifMatch': Array < string >

            'ifModifiedSince': number

            'ifNoneMatch': Array < string >

            'ifUnmodifiedSince': number

            'lastModified': number

            'location': string

            'origin': string

            'pragma': string

            'range': Array < HttpRange >

            'upgrade': string

            'vary': Array < string >

    }

        'statusCode': HttpStatusCode

        'statusCodeValue': number

};
export type Sample = {
    'copyNumberSegmentPresent': boolean

        'patientId': string

        'sampleId': string

        'sampleType': "Primary Solid Tumor" | "Recurrent Solid Tumor" | "Primary Blood Tumor" | "Recurrent Blood Tumor" | "Metastatic" | "Blood Derived Normal" | "Solid Tissues Normal"

        'sequenced': boolean

        'studyId': string

        'uniquePatientKey': string

        'uniqueSampleKey': string

};
export type SampleClinicalDataCollection = {
    'byUniqueSampleKey': {}

};
export type SampleIdentifier = {
    'sampleId': string

        'studyId': string

};
export type SampleMolecularIdentifier = {
    'molecularProfileId': string

        'sampleId': string

};
export type SampleTreatmentFilter = {
    'time': "Pre" | "Post"

        'treatment': string

};
export type SampleTreatmentReport = {
    'totalSamples': number

        'treatments': Array < SampleTreatmentRow >

};
export type SampleTreatmentRow = {
    'count': number

        'samples': Array < ClinicalEventSample >

        'time': "Pre" | "Post"

        'treatment': string

};
export type StructuralVariant = {
    'annotation': string

        'breakpointType': string

        'comments': string

        'connectionType': string

        'dnaSupport': string

        'driverFilter': string

        'driverFilterAnn': string

        'driverTiersFilter': string

        'driverTiersFilterAnn': string

        'eventInfo': string

        'length': number

        'molecularProfileId': string

        'namespaceColumns': {}

        'ncbiBuild': string

        'normalPairedEndReadCount': number

        'normalReadCount': number

        'normalSplitReadCount': number

        'normalVariantCount': number

        'patientId': string

        'rnaSupport': string

        'sampleId': string

        'site1Chromosome': string

        'site1Contig': string

        'site1Description': string

        'site1EnsemblTranscriptId': string

        'site1EntrezGeneId': number

        'site1HugoSymbol': string

        'site1Position': number

        'site1Region': string

        'site1RegionNumber': number

        'site2Chromosome': string

        'site2Contig': string

        'site2Description': string

        'site2EffectOnFrame': string

        'site2EnsemblTranscriptId': string

        'site2EntrezGeneId': number

        'site2HugoSymbol': string

        'site2Position': number

        'site2Region': string

        'site2RegionNumber': number

        'studyId': string

        'svStatus': string

        'tumorPairedEndReadCount': number

        'tumorReadCount': number

        'tumorSplitReadCount': number

        'tumorVariantCount': number

        'uniquePatientKey': string

        'uniqueSampleKey': string

        'variantClass': string

};
export type StructuralVariantFilter = {
    'entrezGeneIds': Array < number >

        'molecularProfileIds': Array < string >

        'sampleMolecularIdentifiers': Array < SampleMolecularIdentifier >

        'structuralVariantQueries': Array < StructuralVariantQuery >

};
export type StructuralVariantFilterQuery = {
    'gene1Query': StructuralVariantGeneSubQuery

        'gene2Query': StructuralVariantGeneSubQuery

        'includeDriver': boolean

        'includeGermline': boolean

        'includeSomatic': boolean

        'includeUnknownOncogenicity': boolean

        'includeUnknownStatus': boolean

        'includeUnknownTier': boolean

        'includeVUS': boolean

        'tiersBooleanMap': {}

};
export type StructuralVariantGeneSubQuery = {
    'entrezId': number

        'hugoSymbol': string

        'specialValue': "ANY_GENE" | "NO_GENE"

};
export type StructuralVariantQuery = {
    'gene1': StructuralVariantGeneSubQuery

        'gene2': StructuralVariantGeneSubQuery

};
export type StudyViewFilter = {
    'alterationFilter': AlterationFilter

        'caseLists': Array < Array < string >
        >

        'clinicalDataFilters': Array < ClinicalDataFilter >

        'clinicalEventFilters': Array < DataFilter >

        'customDataFilters': Array < ClinicalDataFilter >

        'geneFilters': Array < GeneFilter >

        'genericAssayDataFilters': Array < GenericAssayDataFilter >

        'genomicDataFilters': Array < GenomicDataFilter >

        'genomicProfiles': Array < Array < string >
        >

        'mutationDataFilters': Array < MutationDataFilter >

        'namespaceDataFilters': Array < NamespaceDataFilter >

        'patientTreatmentFilters': AndedPatientTreatmentFilters

        'patientTreatmentGroupFilters': AndedPatientTreatmentFilters

        'patientTreatmentTargetFilters': AndedPatientTreatmentFilters

        'sampleIdentifiers': Array < SampleIdentifier >

        'sampleTreatmentFilters': AndedSampleTreatmentFilters

        'sampleTreatmentGroupFilters': AndedSampleTreatmentFilters

        'sampleTreatmentTargetFilters': AndedSampleTreatmentFilters

        'structuralVariantFilters': Array < StudyViewStructuralVariantFilter >

        'studyIds': Array < string >

        'uniqueStudyIds': Array < string >

};
export type StudyViewStructuralVariantFilter = {
    'molecularProfileIds': Array < string >

        'structVarQueries': Array < Array < StructuralVariantFilterQuery >
        >

};
export type SurvivalRequest = {
    'attributeIdPrefix': string

        'censoredEventRequestIdentifier': ClinicalEventRequestIdentifier

        'endEventRequestIdentifier': ClinicalEventRequestIdentifier

        'patientIdentifiers': Array < PatientIdentifier >

        'startEventRequestIdentifier': ClinicalEventRequestIdentifier

};
export type VariantCount = {
    'entrezGeneId': number

        'keyword': string

        'molecularProfileId': string

        'numberOfSamples': number

        'numberOfSamplesWithKeyword': number

        'numberOfSamplesWithMutationInGene': number

};
export type VariantCountIdentifier = {
    'entrezGeneId': number

        'keyword': string

};

/**
 * A web service for supplying JSON formatted data to cBioPortal clients. Please note that this API is currently in beta and subject to change.
 * @class CBioPortalAPIInternal
 * @param {(string)} [domainOrOptions] - The project domain.
 */
export default class CBioPortalAPIInternal {

    private domain: string = "";
    private errorHandlers: CallbackHandler[] = [];

    constructor(domain ? : string) {
        if (domain) {
            this.domain = domain;
        }
    }

    getDomain() {
        return this.domain;
    }

    addErrorHandler(handler: CallbackHandler) {
        this.errorHandlers.push(handler);
    }

    private request(method: string, url: string, body: any, headers: any, queryParameters: any, form: any, reject: CallbackHandler, resolve: CallbackHandler, errorHandlers: CallbackHandler[]) {
        let req = (new(request as any).Request(method, url) as request.Request)
            .query(queryParameters);
        Object.keys(headers).forEach(key => {
            req.set(key, headers[key]);
        });

        if (body) {
            req.send(body);
        }

        if (typeof(body) === 'object' && !(body.constructor.name === 'Buffer')) {
            req.set('Content-Type', 'application/json');
        }

        if (Object.keys(form).length > 0) {
            req.type('form');
            req.send(form);
        }

        req.end((error, response) => {
            if (error || !response.ok) {
                reject(error);
                errorHandlers.forEach(handler => handler(error));
            } else {
                resolve(response);
            }
        });
    }

    fetchAlterationEnrichmentsUsingPOSTURL(parameters: {
        'enrichmentType' ? : "SAMPLE" | "PATIENT",
        'molecularProfileCasesGroupAndAlterationTypeFilter' ? : MolecularProfileCasesGroupAndAlterationTypeFilter,
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/api/alteration-enrichments/fetch';
        if (parameters['enrichmentType'] !== undefined) {
            queryParameters['enrichmentType'] = parameters['enrichmentType'];
        }

        if (parameters.$queryParameters) {
            Object.keys(parameters.$queryParameters).forEach(function(parameterName) {
                var parameter = parameters.$queryParameters[parameterName];
                queryParameters[parameterName] = parameter;
            });
        }
        let keys = Object.keys(queryParameters);
        return this.domain + path + (keys.length > 0 ? '?' + (keys.map(key => key + '=' + encodeURIComponent(queryParameters[key])).join('&')) : '');
    };

    /**
     * Fetch alteration enrichments in molecular profiles
     * @method
     * @name CBioPortalAPIInternal#fetchAlterationEnrichmentsUsingPOST
     * @param {string} enrichmentType - Type of the enrichment e.g. SAMPLE or PATIENT
     * @param {} molecularProfileCasesGroupAndAlterationTypeFilter - A web service for supplying JSON formatted data to cBioPortal clients. Please note that this API is currently in beta and subject to change.
     */
    fetchAlterationEnrichmentsUsingPOSTWithHttpInfo(parameters: {
        'enrichmentType' ? : "SAMPLE" | "PATIENT",
        'molecularProfileCasesGroupAndAlterationTypeFilter' ? : MolecularProfileCasesGroupAndAlterationTypeFilter,
        $queryParameters ? : any,
            $domain ? : string
    }): Promise < request.Response > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        const errorHandlers = this.errorHandlers;
        const request = this.request;
        let path = '/api/alteration-enrichments/fetch';
        let body: any;
        let queryParameters: any = {};
        let headers: any = {};
        let form: any = {};
        return new Promise(function(resolve, reject) {
            headers['Accept'] = 'application/json';
            headers['Content-Type'] = 'application/json';

            if (parameters['enrichmentType'] !== undefined) {
                queryParameters['enrichmentType'] = parameters['enrichmentType'];
            }

            if (parameters['molecularProfileCasesGroupAndAlterationTypeFilter'] !== undefined) {
                body = parameters['molecularProfileCasesGroupAndAlterationTypeFilter'];
            }

            if (parameters.$queryParameters) {
                Object.keys(parameters.$queryParameters).forEach(function(parameterName) {
                    var parameter = parameters.$queryParameters[parameterName];
                    queryParameters[parameterName] = parameter;
                });
            }

            request('POST', domain + path, body, headers, queryParameters, form, reject, resolve, errorHandlers);

        });
    };

    /**
     * Fetch alteration enrichments in molecular profiles
     * @method
     * @name CBioPortalAPIInternal#fetchAlterationEnrichmentsUsingPOST
     * @param {string} enrichmentType - Type of the enrichment e.g. SAMPLE or PATIENT
     * @param {} molecularProfileCasesGroupAndAlterationTypeFilter - A web service for supplying JSON formatted data to cBioPortal clients. Please note that this API is currently in beta and subject to change.
     */
    fetchAlterationEnrichmentsUsingPOST(parameters: {
            'enrichmentType' ? : "SAMPLE" | "PATIENT",
            'molecularProfileCasesGroupAndAlterationTypeFilter' ? : MolecularProfileCasesGroupAndAlterationTypeFilter,
            $queryParameters ? : any,
                $domain ? : string
        }): Promise < Array < AlterationEnrichment >
        > {
            return this.fetchAlterationEnrichmentsUsingPOSTWithHttpInfo(parameters).then(function(response: request.Response) {
                return response.body;
            });
        };
    clearAllCachesUsingDELETEURL(parameters: {
        'xApiKey': string,
        'springManagedCache' ? : boolean,
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/api/cache';

        if (parameters['springManagedCache'] !== undefined) {
            queryParameters['springManagedCache'] = parameters['springManagedCache'];
        }

        if (parameters.$queryParameters) {
            Object.keys(parameters.$queryParameters).forEach(function(parameterName) {
                var parameter = parameters.$queryParameters[parameterName];
                queryParameters[parameterName] = parameter;
            });
        }
        let keys = Object.keys(queryParameters);
        return this.domain + path + (keys.length > 0 ? '?' + (keys.map(key => key + '=' + encodeURIComponent(queryParameters[key])).join('&')) : '');
    };

    /**
     * Clear and reinitialize caches
     * @method
     * @name CBioPortalAPIInternal#clearAllCachesUsingDELETE
     * @param {string} xApiKey - Secret API key passed in HTTP header. The key is configured in application.properties of the portal instance.
     * @param {boolean} springManagedCache - Clear Spring-managed caches
     */
    clearAllCachesUsingDELETEWithHttpInfo(parameters: {
        'xApiKey': string,
        'springManagedCache' ? : boolean,
        $queryParameters ? : any,
        $domain ? : string
    }): Promise < request.Response > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        const errorHandlers = this.errorHandlers;
        const request = this.request;
        let path = '/api/cache';
        let body: any;
        let queryParameters: any = {};
        let headers: any = {};
        let form: any = {};
        return new Promise(function(resolve, reject) {
            headers['Accept'] = 'text/plain';

            if (parameters['xApiKey'] !== undefined) {
                headers['X-API-KEY'] = parameters['xApiKey'];
            }

            if (parameters['xApiKey'] === undefined) {
                reject(new Error('Missing required  parameter: xApiKey'));
                return;
            }

            if (parameters['springManagedCache'] !== undefined) {
                queryParameters['springManagedCache'] = parameters['springManagedCache'];
            }

            if (parameters.$queryParameters) {
                Object.keys(parameters.$queryParameters).forEach(function(parameterName) {
                    var parameter = parameters.$queryParameters[parameterName];
                    queryParameters[parameterName] = parameter;
                });
            }

            request('DELETE', domain + path, body, headers, queryParameters, form, reject, resolve, errorHandlers);

        });
    };

    /**
     * Clear and reinitialize caches
     * @method
     * @name CBioPortalAPIInternal#clearAllCachesUsingDELETE
     * @param {string} xApiKey - Secret API key passed in HTTP header. The key is configured in application.properties of the portal instance.
     * @param {boolean} springManagedCache - Clear Spring-managed caches
     */
    clearAllCachesUsingDELETE(parameters: {
        'xApiKey': string,
        'springManagedCache' ? : boolean,
        $queryParameters ? : any,
        $domain ? : string
    }): Promise < string > {
        return this.clearAllCachesUsingDELETEWithHttpInfo(parameters).then(function(response: request.Response) {
            return response.body;
        });
    };
    getClinicalAttributeCountsUsingPOSTURL(parameters: {
        'clinicalAttributeCountFilter' ? : ClinicalAttributeCountFilter,
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/api/clinical-attributes/counts/fetch';

        if (parameters.$queryParameters) {
            Object.keys(parameters.$queryParameters).forEach(function(parameterName) {
                var parameter = parameters.$queryParameters[parameterName];
                queryParameters[parameterName] = parameter;
            });
        }
        let keys = Object.keys(queryParameters);
        return this.domain + path + (keys.length > 0 ? '?' + (keys.map(key => key + '=' + encodeURIComponent(queryParameters[key])).join('&')) : '');
    };

    /**
     * Get counts for clinical attributes according to their data availability for selected samples/patients
     * @method
     * @name CBioPortalAPIInternal#getClinicalAttributeCountsUsingPOST
     * @param {} clinicalAttributeCountFilter - A web service for supplying JSON formatted data to cBioPortal clients. Please note that this API is currently in beta and subject to change.
     */
    getClinicalAttributeCountsUsingPOSTWithHttpInfo(parameters: {
        'clinicalAttributeCountFilter' ? : ClinicalAttributeCountFilter,
        $queryParameters ? : any,
            $domain ? : string
    }): Promise < request.Response > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        const errorHandlers = this.errorHandlers;
        const request = this.request;
        let path = '/api/clinical-attributes/counts/fetch';
        let body: any;
        let queryParameters: any = {};
        let headers: any = {};
        let form: any = {};
        return new Promise(function(resolve, reject) {
            headers['Accept'] = 'application/json';
            headers['Content-Type'] = 'application/json';

            if (parameters['clinicalAttributeCountFilter'] !== undefined) {
                body = parameters['clinicalAttributeCountFilter'];
            }

            if (parameters.$queryParameters) {
                Object.keys(parameters.$queryParameters).forEach(function(parameterName) {
                    var parameter = parameters.$queryParameters[parameterName];
                    queryParameters[parameterName] = parameter;
                });
            }

            request('POST', domain + path, body, headers, queryParameters, form, reject, resolve, errorHandlers);

        });
    };

    /**
     * Get counts for clinical attributes according to their data availability for selected samples/patients
     * @method
     * @name CBioPortalAPIInternal#getClinicalAttributeCountsUsingPOST
     * @param {} clinicalAttributeCountFilter - A web service for supplying JSON formatted data to cBioPortal clients. Please note that this API is currently in beta and subject to change.
     */
    getClinicalAttributeCountsUsingPOST(parameters: {
            'clinicalAttributeCountFilter' ? : ClinicalAttributeCountFilter,
            $queryParameters ? : any,
                $domain ? : string
        }): Promise < Array < ClinicalAttributeCount >
        > {
            return this.getClinicalAttributeCountsUsingPOSTWithHttpInfo(parameters).then(function(response: request.Response) {
                return response.body;
            });
        };
    fetchClinicalDataBinCountsUsingPOSTURL(parameters: {
        'dataBinMethod' ? : "STATIC" | "DYNAMIC",
        'clinicalDataBinCountFilter' ? : ClinicalDataBinCountFilter,
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/api/clinical-data-bin-counts/fetch';
        if (parameters['dataBinMethod'] !== undefined) {
            queryParameters['dataBinMethod'] = parameters['dataBinMethod'];
        }

        if (parameters.$queryParameters) {
            Object.keys(parameters.$queryParameters).forEach(function(parameterName) {
                var parameter = parameters.$queryParameters[parameterName];
                queryParameters[parameterName] = parameter;
            });
        }
        let keys = Object.keys(queryParameters);
        return this.domain + path + (keys.length > 0 ? '?' + (keys.map(key => key + '=' + encodeURIComponent(queryParameters[key])).join('&')) : '');
    };

    /**
     * Fetch clinical data bin counts by study view filter
     * @method
     * @name CBioPortalAPIInternal#fetchClinicalDataBinCountsUsingPOST
     * @param {string} dataBinMethod - Method for data binning
     * @param {} clinicalDataBinCountFilter - A web service for supplying JSON formatted data to cBioPortal clients. Please note that this API is currently in beta and subject to change.
     */
    fetchClinicalDataBinCountsUsingPOSTWithHttpInfo(parameters: {
        'dataBinMethod' ? : "STATIC" | "DYNAMIC",
        'clinicalDataBinCountFilter' ? : ClinicalDataBinCountFilter,
        $queryParameters ? : any,
            $domain ? : string
    }): Promise < request.Response > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        const errorHandlers = this.errorHandlers;
        const request = this.request;
        let path = '/api/clinical-data-bin-counts/fetch';
        let body: any;
        let queryParameters: any = {};
        let headers: any = {};
        let form: any = {};
        return new Promise(function(resolve, reject) {
            headers['Accept'] = 'application/json';
            headers['Content-Type'] = 'application/json';

            if (parameters['dataBinMethod'] !== undefined) {
                queryParameters['dataBinMethod'] = parameters['dataBinMethod'];
            }

            if (parameters['clinicalDataBinCountFilter'] !== undefined) {
                body = parameters['clinicalDataBinCountFilter'];
            }

            if (parameters.$queryParameters) {
                Object.keys(parameters.$queryParameters).forEach(function(parameterName) {
                    var parameter = parameters.$queryParameters[parameterName];
                    queryParameters[parameterName] = parameter;
                });
            }

            request('POST', domain + path, body, headers, queryParameters, form, reject, resolve, errorHandlers);

        });
    };

    /**
     * Fetch clinical data bin counts by study view filter
     * @method
     * @name CBioPortalAPIInternal#fetchClinicalDataBinCountsUsingPOST
     * @param {string} dataBinMethod - Method for data binning
     * @param {} clinicalDataBinCountFilter - A web service for supplying JSON formatted data to cBioPortal clients. Please note that this API is currently in beta and subject to change.
     */
    fetchClinicalDataBinCountsUsingPOST(parameters: {
            'dataBinMethod' ? : "STATIC" | "DYNAMIC",
            'clinicalDataBinCountFilter' ? : ClinicalDataBinCountFilter,
            $queryParameters ? : any,
                $domain ? : string
        }): Promise < Array < ClinicalDataBin >
        > {
            return this.fetchClinicalDataBinCountsUsingPOSTWithHttpInfo(parameters).then(function(response: request.Response) {
                return response.body;
            });
        };
    fetchClinicalDataCountsUsingPOSTURL(parameters: {
        'clinicalDataCountFilter' ? : ClinicalDataCountFilter,
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/api/clinical-data-counts/fetch';

        if (parameters.$queryParameters) {
            Object.keys(parameters.$queryParameters).forEach(function(parameterName) {
                var parameter = parameters.$queryParameters[parameterName];
                queryParameters[parameterName] = parameter;
            });
        }
        let keys = Object.keys(queryParameters);
        return this.domain + path + (keys.length > 0 ? '?' + (keys.map(key => key + '=' + encodeURIComponent(queryParameters[key])).join('&')) : '');
    };

    /**
     * Fetch clinical data counts by study view filter
     * @method
     * @name CBioPortalAPIInternal#fetchClinicalDataCountsUsingPOST
     * @param {} clinicalDataCountFilter - A web service for supplying JSON formatted data to cBioPortal clients. Please note that this API is currently in beta and subject to change.
     */
    fetchClinicalDataCountsUsingPOSTWithHttpInfo(parameters: {
        'clinicalDataCountFilter' ? : ClinicalDataCountFilter,
        $queryParameters ? : any,
            $domain ? : string
    }): Promise < request.Response > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        const errorHandlers = this.errorHandlers;
        const request = this.request;
        let path = '/api/clinical-data-counts/fetch';
        let body: any;
        let queryParameters: any = {};
        let headers: any = {};
        let form: any = {};
        return new Promise(function(resolve, reject) {
            headers['Accept'] = 'application/json';
            headers['Content-Type'] = 'application/json';

            if (parameters['clinicalDataCountFilter'] !== undefined) {
                body = parameters['clinicalDataCountFilter'];
            }

            if (parameters.$queryParameters) {
                Object.keys(parameters.$queryParameters).forEach(function(parameterName) {
                    var parameter = parameters.$queryParameters[parameterName];
                    queryParameters[parameterName] = parameter;
                });
            }

            request('POST', domain + path, body, headers, queryParameters, form, reject, resolve, errorHandlers);

        });
    };

    /**
     * Fetch clinical data counts by study view filter
     * @method
     * @name CBioPortalAPIInternal#fetchClinicalDataCountsUsingPOST
     * @param {} clinicalDataCountFilter - A web service for supplying JSON formatted data to cBioPortal clients. Please note that this API is currently in beta and subject to change.
     */
    fetchClinicalDataCountsUsingPOST(parameters: {
            'clinicalDataCountFilter' ? : ClinicalDataCountFilter,
            $queryParameters ? : any,
                $domain ? : string
        }): Promise < Array < ClinicalDataCountItem >
        > {
            return this.fetchClinicalDataCountsUsingPOSTWithHttpInfo(parameters).then(function(response: request.Response) {
                return response.body;
            });
        };
    fetchClinicalDataDensityPlotUsingPOSTURL(parameters: {
        'xAxisAttributeId': string,
        'xAxisBinCount' ? : number,
        'xAxisStart' ? : number,
        'xAxisEnd' ? : number,
        'yAxisAttributeId': string,
        'yAxisBinCount' ? : number,
        'yAxisStart' ? : number,
        'yAxisEnd' ? : number,
        'xAxisLogScale' ? : boolean,
        'yAxisLogScale' ? : boolean,
        'studyViewFilter' ? : StudyViewFilter,
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/api/clinical-data-density-plot/fetch';
        if (parameters['xAxisAttributeId'] !== undefined) {
            queryParameters['xAxisAttributeId'] = parameters['xAxisAttributeId'];
        }

        if (parameters['xAxisBinCount'] !== undefined) {
            queryParameters['xAxisBinCount'] = parameters['xAxisBinCount'];
        }

        if (parameters['xAxisStart'] !== undefined) {
            queryParameters['xAxisStart'] = parameters['xAxisStart'];
        }

        if (parameters['xAxisEnd'] !== undefined) {
            queryParameters['xAxisEnd'] = parameters['xAxisEnd'];
        }

        if (parameters['yAxisAttributeId'] !== undefined) {
            queryParameters['yAxisAttributeId'] = parameters['yAxisAttributeId'];
        }

        if (parameters['yAxisBinCount'] !== undefined) {
            queryParameters['yAxisBinCount'] = parameters['yAxisBinCount'];
        }

        if (parameters['yAxisStart'] !== undefined) {
            queryParameters['yAxisStart'] = parameters['yAxisStart'];
        }

        if (parameters['yAxisEnd'] !== undefined) {
            queryParameters['yAxisEnd'] = parameters['yAxisEnd'];
        }

        if (parameters['xAxisLogScale'] !== undefined) {
            queryParameters['xAxisLogScale'] = parameters['xAxisLogScale'];
        }

        if (parameters['yAxisLogScale'] !== undefined) {
            queryParameters['yAxisLogScale'] = parameters['yAxisLogScale'];
        }

        if (parameters.$queryParameters) {
            Object.keys(parameters.$queryParameters).forEach(function(parameterName) {
                var parameter = parameters.$queryParameters[parameterName];
                queryParameters[parameterName] = parameter;
            });
        }
        let keys = Object.keys(queryParameters);
        return this.domain + path + (keys.length > 0 ? '?' + (keys.map(key => key + '=' + encodeURIComponent(queryParameters[key])).join('&')) : '');
    };

    /**
     * Fetch clinical data density plot bins by study view filter
     * @method
     * @name CBioPortalAPIInternal#fetchClinicalDataDensityPlotUsingPOST
     * @param {string} xAxisAttributeId - Clinical Attribute ID of the X axis
     * @param {integer} xAxisBinCount - Number of the bins in X axis
     * @param {number} xAxisStart - Starting point of the X axis, if different than smallest value
     * @param {number} xAxisEnd - Starting point of the X axis, if different than largest value
     * @param {string} yAxisAttributeId - Clinical Attribute ID of the Y axis
     * @param {integer} yAxisBinCount - Number of the bins in Y axis
     * @param {number} yAxisStart - Starting point of the Y axis, if different than smallest value
     * @param {number} yAxisEnd - Starting point of the Y axis, if different than largest value
     * @param {boolean} xAxisLogScale - Use log scale for X axis
     * @param {boolean} yAxisLogScale - Use log scale for Y axis
     * @param {} studyViewFilter - A web service for supplying JSON formatted data to cBioPortal clients. Please note that this API is currently in beta and subject to change.
     */
    fetchClinicalDataDensityPlotUsingPOSTWithHttpInfo(parameters: {
        'xAxisAttributeId': string,
        'xAxisBinCount' ? : number,
        'xAxisStart' ? : number,
        'xAxisEnd' ? : number,
        'yAxisAttributeId': string,
        'yAxisBinCount' ? : number,
        'yAxisStart' ? : number,
        'yAxisEnd' ? : number,
        'xAxisLogScale' ? : boolean,
        'yAxisLogScale' ? : boolean,
        'studyViewFilter' ? : StudyViewFilter,
        $queryParameters ? : any,
        $domain ? : string
    }): Promise < request.Response > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        const errorHandlers = this.errorHandlers;
        const request = this.request;
        let path = '/api/clinical-data-density-plot/fetch';
        let body: any;
        let queryParameters: any = {};
        let headers: any = {};
        let form: any = {};
        return new Promise(function(resolve, reject) {
            headers['Accept'] = 'application/json';
            headers['Content-Type'] = 'application/json';

            if (parameters['xAxisAttributeId'] !== undefined) {
                queryParameters['xAxisAttributeId'] = parameters['xAxisAttributeId'];
            }

            if (parameters['xAxisAttributeId'] === undefined) {
                reject(new Error('Missing required  parameter: xAxisAttributeId'));
                return;
            }

            if (parameters['xAxisBinCount'] !== undefined) {
                queryParameters['xAxisBinCount'] = parameters['xAxisBinCount'];
            }

            if (parameters['xAxisStart'] !== undefined) {
                queryParameters['xAxisStart'] = parameters['xAxisStart'];
            }

            if (parameters['xAxisEnd'] !== undefined) {
                queryParameters['xAxisEnd'] = parameters['xAxisEnd'];
            }

            if (parameters['yAxisAttributeId'] !== undefined) {
                queryParameters['yAxisAttributeId'] = parameters['yAxisAttributeId'];
            }

            if (parameters['yAxisAttributeId'] === undefined) {
                reject(new Error('Missing required  parameter: yAxisAttributeId'));
                return;
            }

            if (parameters['yAxisBinCount'] !== undefined) {
                queryParameters['yAxisBinCount'] = parameters['yAxisBinCount'];
            }

            if (parameters['yAxisStart'] !== undefined) {
                queryParameters['yAxisStart'] = parameters['yAxisStart'];
            }

            if (parameters['yAxisEnd'] !== undefined) {
                queryParameters['yAxisEnd'] = parameters['yAxisEnd'];
            }

            if (parameters['xAxisLogScale'] !== undefined) {
                queryParameters['xAxisLogScale'] = parameters['xAxisLogScale'];
            }

            if (parameters['yAxisLogScale'] !== undefined) {
                queryParameters['yAxisLogScale'] = parameters['yAxisLogScale'];
            }

            if (parameters['studyViewFilter'] !== undefined) {
                body = parameters['studyViewFilter'];
            }

            if (parameters.$queryParameters) {
                Object.keys(parameters.$queryParameters).forEach(function(parameterName) {
                    var parameter = parameters.$queryParameters[parameterName];
                    queryParameters[parameterName] = parameter;
                });
            }

            request('POST', domain + path, body, headers, queryParameters, form, reject, resolve, errorHandlers);

        });
    };

    /**
     * Fetch clinical data density plot bins by study view filter
     * @method
     * @name CBioPortalAPIInternal#fetchClinicalDataDensityPlotUsingPOST
     * @param {string} xAxisAttributeId - Clinical Attribute ID of the X axis
     * @param {integer} xAxisBinCount - Number of the bins in X axis
     * @param {number} xAxisStart - Starting point of the X axis, if different than smallest value
     * @param {number} xAxisEnd - Starting point of the X axis, if different than largest value
     * @param {string} yAxisAttributeId - Clinical Attribute ID of the Y axis
     * @param {integer} yAxisBinCount - Number of the bins in Y axis
     * @param {number} yAxisStart - Starting point of the Y axis, if different than smallest value
     * @param {number} yAxisEnd - Starting point of the Y axis, if different than largest value
     * @param {boolean} xAxisLogScale - Use log scale for X axis
     * @param {boolean} yAxisLogScale - Use log scale for Y axis
     * @param {} studyViewFilter - A web service for supplying JSON formatted data to cBioPortal clients. Please note that this API is currently in beta and subject to change.
     */
    fetchClinicalDataDensityPlotUsingPOST(parameters: {
        'xAxisAttributeId': string,
        'xAxisBinCount' ? : number,
        'xAxisStart' ? : number,
        'xAxisEnd' ? : number,
        'yAxisAttributeId': string,
        'yAxisBinCount' ? : number,
        'yAxisStart' ? : number,
        'yAxisEnd' ? : number,
        'xAxisLogScale' ? : boolean,
        'yAxisLogScale' ? : boolean,
        'studyViewFilter' ? : StudyViewFilter,
        $queryParameters ? : any,
        $domain ? : string
    }): Promise < DensityPlotData > {
        return this.fetchClinicalDataDensityPlotUsingPOSTWithHttpInfo(parameters).then(function(response: request.Response) {
            return response.body;
        });
    };
    fetchClinicalEnrichmentsUsingPOSTURL(parameters: {
        'groupFilter' ? : GroupFilter,
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/api/clinical-data-enrichments/fetch';

        if (parameters.$queryParameters) {
            Object.keys(parameters.$queryParameters).forEach(function(parameterName) {
                var parameter = parameters.$queryParameters[parameterName];
                queryParameters[parameterName] = parameter;
            });
        }
        let keys = Object.keys(queryParameters);
        return this.domain + path + (keys.length > 0 ? '?' + (keys.map(key => key + '=' + encodeURIComponent(queryParameters[key])).join('&')) : '');
    };

    /**
     * Fetch clinical data enrichments for the sample groups
     * @method
     * @name CBioPortalAPIInternal#fetchClinicalEnrichmentsUsingPOST
     * @param {} groupFilter - A web service for supplying JSON formatted data to cBioPortal clients. Please note that this API is currently in beta and subject to change.
     */
    fetchClinicalEnrichmentsUsingPOSTWithHttpInfo(parameters: {
        'groupFilter' ? : GroupFilter,
        $queryParameters ? : any,
            $domain ? : string
    }): Promise < request.Response > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        const errorHandlers = this.errorHandlers;
        const request = this.request;
        let path = '/api/clinical-data-enrichments/fetch';
        let body: any;
        let queryParameters: any = {};
        let headers: any = {};
        let form: any = {};
        return new Promise(function(resolve, reject) {
            headers['Accept'] = 'application/json';
            headers['Content-Type'] = 'application/json';

            if (parameters['groupFilter'] !== undefined) {
                body = parameters['groupFilter'];
            }

            if (parameters.$queryParameters) {
                Object.keys(parameters.$queryParameters).forEach(function(parameterName) {
                    var parameter = parameters.$queryParameters[parameterName];
                    queryParameters[parameterName] = parameter;
                });
            }

            request('POST', domain + path, body, headers, queryParameters, form, reject, resolve, errorHandlers);

        });
    };

    /**
     * Fetch clinical data enrichments for the sample groups
     * @method
     * @name CBioPortalAPIInternal#fetchClinicalEnrichmentsUsingPOST
     * @param {} groupFilter - A web service for supplying JSON formatted data to cBioPortal clients. Please note that this API is currently in beta and subject to change.
     */
    fetchClinicalEnrichmentsUsingPOST(parameters: {
            'groupFilter' ? : GroupFilter,
            $queryParameters ? : any,
                $domain ? : string
        }): Promise < Array < ClinicalDataEnrichment >
        > {
            return this.fetchClinicalEnrichmentsUsingPOSTWithHttpInfo(parameters).then(function(response: request.Response) {
                return response.body;
            });
        };
    fetchClinicalDataClinicalTableUsingPOSTURL(parameters: {
        'pageSize' ? : number,
        'pageNumber' ? : number,
        'searchTerm' ? : string,
        'sortBy' ? : string,
        'direction' ? : "ASC" | "DESC",
        'studyViewFilter' ? : StudyViewFilter,
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/api/clinical-data-table/fetch';
        if (parameters['pageSize'] !== undefined) {
            queryParameters['pageSize'] = parameters['pageSize'];
        }

        if (parameters['pageNumber'] !== undefined) {
            queryParameters['pageNumber'] = parameters['pageNumber'];
        }

        if (parameters['searchTerm'] !== undefined) {
            queryParameters['searchTerm'] = parameters['searchTerm'];
        }

        if (parameters['sortBy'] !== undefined) {
            queryParameters['sortBy'] = parameters['sortBy'];
        }

        if (parameters['direction'] !== undefined) {
            queryParameters['direction'] = parameters['direction'];
        }

        if (parameters.$queryParameters) {
            Object.keys(parameters.$queryParameters).forEach(function(parameterName) {
                var parameter = parameters.$queryParameters[parameterName];
                queryParameters[parameterName] = parameter;
            });
        }
        let keys = Object.keys(queryParameters);
        return this.domain + path + (keys.length > 0 ? '?' + (keys.map(key => key + '=' + encodeURIComponent(queryParameters[key])).join('&')) : '');
    };

    /**
     * Fetch clinical data for the Clinical Tab of Study View
     * @method
     * @name CBioPortalAPIInternal#fetchClinicalDataClinicalTableUsingPOST
     * @param {integer} pageSize - Page size of the result list
     * @param {integer} pageNumber - Page number of the result list. Zero represents the first page.
     * @param {string} searchTerm - Search term to filter sample rows. Samples are returned with a partial match to the search term for any sample clinical attribute.
     * @param {string} sortBy - sampleId, patientId, or the ATTR_ID to sorted by
     * @param {string} direction - Direction of the sort
     * @param {} studyViewFilter - A web service for supplying JSON formatted data to cBioPortal clients. Please note that this API is currently in beta and subject to change.
     */
    fetchClinicalDataClinicalTableUsingPOSTWithHttpInfo(parameters: {
        'pageSize' ? : number,
        'pageNumber' ? : number,
        'searchTerm' ? : string,
        'sortBy' ? : string,
        'direction' ? : "ASC" | "DESC",
        'studyViewFilter' ? : StudyViewFilter,
        $queryParameters ? : any,
            $domain ? : string
    }): Promise < request.Response > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        const errorHandlers = this.errorHandlers;
        const request = this.request;
        let path = '/api/clinical-data-table/fetch';
        let body: any;
        let queryParameters: any = {};
        let headers: any = {};
        let form: any = {};
        return new Promise(function(resolve, reject) {
            headers['Accept'] = 'application/json';
            headers['Content-Type'] = 'application/json';

            if (parameters['pageSize'] !== undefined) {
                queryParameters['pageSize'] = parameters['pageSize'];
            }

            if (parameters['pageNumber'] !== undefined) {
                queryParameters['pageNumber'] = parameters['pageNumber'];
            }

            if (parameters['searchTerm'] !== undefined) {
                queryParameters['searchTerm'] = parameters['searchTerm'];
            }

            if (parameters['sortBy'] !== undefined) {
                queryParameters['sortBy'] = parameters['sortBy'];
            }

            if (parameters['direction'] !== undefined) {
                queryParameters['direction'] = parameters['direction'];
            }

            if (parameters['studyViewFilter'] !== undefined) {
                body = parameters['studyViewFilter'];
            }

            if (parameters.$queryParameters) {
                Object.keys(parameters.$queryParameters).forEach(function(parameterName) {
                    var parameter = parameters.$queryParameters[parameterName];
                    queryParameters[parameterName] = parameter;
                });
            }

            request('POST', domain + path, body, headers, queryParameters, form, reject, resolve, errorHandlers);

        });
    };

    /**
     * Fetch clinical data for the Clinical Tab of Study View
     * @method
     * @name CBioPortalAPIInternal#fetchClinicalDataClinicalTableUsingPOST
     * @param {integer} pageSize - Page size of the result list
     * @param {integer} pageNumber - Page number of the result list. Zero represents the first page.
     * @param {string} searchTerm - Search term to filter sample rows. Samples are returned with a partial match to the search term for any sample clinical attribute.
     * @param {string} sortBy - sampleId, patientId, or the ATTR_ID to sorted by
     * @param {string} direction - Direction of the sort
     * @param {} studyViewFilter - A web service for supplying JSON formatted data to cBioPortal clients. Please note that this API is currently in beta and subject to change.
     */
    fetchClinicalDataClinicalTableUsingPOST(parameters: {
        'pageSize' ? : number,
        'pageNumber' ? : number,
        'searchTerm' ? : string,
        'sortBy' ? : string,
        'direction' ? : "ASC" | "DESC",
        'studyViewFilter' ? : StudyViewFilter,
        $queryParameters ? : any,
            $domain ? : string
    }): Promise < SampleClinicalDataCollection > {
        return this.fetchClinicalDataClinicalTableUsingPOSTWithHttpInfo(parameters).then(function(response: request.Response) {
            return response.body;
        });
    };
    fetchClinicalDataViolinPlotsUsingPOSTURL(parameters: {
        'categoricalAttributeId': string,
        'numericalAttributeId': string,
        'axisStart' ? : number,
        'axisEnd' ? : number,
        'numCurvePoints' ? : number,
        'logScale' ? : boolean,
        'sigmaMultiplier' ? : number,
        'studyViewFilter' ? : StudyViewFilter,
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/api/clinical-data-violin-plots/fetch';
        if (parameters['categoricalAttributeId'] !== undefined) {
            queryParameters['categoricalAttributeId'] = parameters['categoricalAttributeId'];
        }

        if (parameters['numericalAttributeId'] !== undefined) {
            queryParameters['numericalAttributeId'] = parameters['numericalAttributeId'];
        }

        if (parameters['axisStart'] !== undefined) {
            queryParameters['axisStart'] = parameters['axisStart'];
        }

        if (parameters['axisEnd'] !== undefined) {
            queryParameters['axisEnd'] = parameters['axisEnd'];
        }

        if (parameters['numCurvePoints'] !== undefined) {
            queryParameters['numCurvePoints'] = parameters['numCurvePoints'];
        }

        if (parameters['logScale'] !== undefined) {
            queryParameters['logScale'] = parameters['logScale'];
        }

        if (parameters['sigmaMultiplier'] !== undefined) {
            queryParameters['sigmaMultiplier'] = parameters['sigmaMultiplier'];
        }

        if (parameters.$queryParameters) {
            Object.keys(parameters.$queryParameters).forEach(function(parameterName) {
                var parameter = parameters.$queryParameters[parameterName];
                queryParameters[parameterName] = parameter;
            });
        }
        let keys = Object.keys(queryParameters);
        return this.domain + path + (keys.length > 0 ? '?' + (keys.map(key => key + '=' + encodeURIComponent(queryParameters[key])).join('&')) : '');
    };

    /**
     * Fetch violin plot curves per categorical clinical data value, filtered by study view filter
     * @method
     * @name CBioPortalAPIInternal#fetchClinicalDataViolinPlotsUsingPOST
     * @param {string} categoricalAttributeId - Clinical Attribute ID of the categorical attribute
     * @param {string} numericalAttributeId - Clinical Attribute ID of the numerical attribute
     * @param {number} axisStart - Starting point of the violin plot axis, if different than smallest value
     * @param {number} axisEnd - Ending point  of the violin plot axis, if different than largest value
     * @param {number} numCurvePoints - Number of points in the curve
     * @param {boolean} logScale - Use log scale for the numerical attribute
     * @param {number} sigmaMultiplier - Sigma stepsize multiplier
     * @param {} studyViewFilter - A web service for supplying JSON formatted data to cBioPortal clients. Please note that this API is currently in beta and subject to change.
     */
    fetchClinicalDataViolinPlotsUsingPOSTWithHttpInfo(parameters: {
        'categoricalAttributeId': string,
        'numericalAttributeId': string,
        'axisStart' ? : number,
        'axisEnd' ? : number,
        'numCurvePoints' ? : number,
        'logScale' ? : boolean,
        'sigmaMultiplier' ? : number,
        'studyViewFilter' ? : StudyViewFilter,
        $queryParameters ? : any,
        $domain ? : string
    }): Promise < request.Response > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        const errorHandlers = this.errorHandlers;
        const request = this.request;
        let path = '/api/clinical-data-violin-plots/fetch';
        let body: any;
        let queryParameters: any = {};
        let headers: any = {};
        let form: any = {};
        return new Promise(function(resolve, reject) {
            headers['Accept'] = 'application/json';
            headers['Content-Type'] = 'application/json';

            if (parameters['categoricalAttributeId'] !== undefined) {
                queryParameters['categoricalAttributeId'] = parameters['categoricalAttributeId'];
            }

            if (parameters['categoricalAttributeId'] === undefined) {
                reject(new Error('Missing required  parameter: categoricalAttributeId'));
                return;
            }

            if (parameters['numericalAttributeId'] !== undefined) {
                queryParameters['numericalAttributeId'] = parameters['numericalAttributeId'];
            }

            if (parameters['numericalAttributeId'] === undefined) {
                reject(new Error('Missing required  parameter: numericalAttributeId'));
                return;
            }

            if (parameters['axisStart'] !== undefined) {
                queryParameters['axisStart'] = parameters['axisStart'];
            }

            if (parameters['axisEnd'] !== undefined) {
                queryParameters['axisEnd'] = parameters['axisEnd'];
            }

            if (parameters['numCurvePoints'] !== undefined) {
                queryParameters['numCurvePoints'] = parameters['numCurvePoints'];
            }

            if (parameters['logScale'] !== undefined) {
                queryParameters['logScale'] = parameters['logScale'];
            }

            if (parameters['sigmaMultiplier'] !== undefined) {
                queryParameters['sigmaMultiplier'] = parameters['sigmaMultiplier'];
            }

            if (parameters['studyViewFilter'] !== undefined) {
                body = parameters['studyViewFilter'];
            }

            if (parameters.$queryParameters) {
                Object.keys(parameters.$queryParameters).forEach(function(parameterName) {
                    var parameter = parameters.$queryParameters[parameterName];
                    queryParameters[parameterName] = parameter;
                });
            }

            request('POST', domain + path, body, headers, queryParameters, form, reject, resolve, errorHandlers);

        });
    };

    /**
     * Fetch violin plot curves per categorical clinical data value, filtered by study view filter
     * @method
     * @name CBioPortalAPIInternal#fetchClinicalDataViolinPlotsUsingPOST
     * @param {string} categoricalAttributeId - Clinical Attribute ID of the categorical attribute
     * @param {string} numericalAttributeId - Clinical Attribute ID of the numerical attribute
     * @param {number} axisStart - Starting point of the violin plot axis, if different than smallest value
     * @param {number} axisEnd - Ending point  of the violin plot axis, if different than largest value
     * @param {number} numCurvePoints - Number of points in the curve
     * @param {boolean} logScale - Use log scale for the numerical attribute
     * @param {number} sigmaMultiplier - Sigma stepsize multiplier
     * @param {} studyViewFilter - A web service for supplying JSON formatted data to cBioPortal clients. Please note that this API is currently in beta and subject to change.
     */
    fetchClinicalDataViolinPlotsUsingPOST(parameters: {
        'categoricalAttributeId': string,
        'numericalAttributeId': string,
        'axisStart' ? : number,
        'axisEnd' ? : number,
        'numCurvePoints' ? : number,
        'logScale' ? : boolean,
        'sigmaMultiplier' ? : number,
        'studyViewFilter' ? : StudyViewFilter,
        $queryParameters ? : any,
        $domain ? : string
    }): Promise < ClinicalViolinPlotData > {
        return this.fetchClinicalDataViolinPlotsUsingPOSTWithHttpInfo(parameters).then(function(response: request.Response) {
            return response.body;
        });
    };
    getClinicalEventTypeCountsUsingPOSTURL(parameters: {
        'studyViewFilter' ? : StudyViewFilter,
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/api/clinical-event-type-counts/fetch';

        if (parameters.$queryParameters) {
            Object.keys(parameters.$queryParameters).forEach(function(parameterName) {
                var parameter = parameters.$queryParameters[parameterName];
                queryParameters[parameterName] = parameter;
            });
        }
        let keys = Object.keys(queryParameters);
        return this.domain + path + (keys.length > 0 ? '?' + (keys.map(key => key + '=' + encodeURIComponent(queryParameters[key])).join('&')) : '');
    };

    /**
     * Get Counts of Clinical Event Types by Study View Filter
     * @method
     * @name CBioPortalAPIInternal#getClinicalEventTypeCountsUsingPOST
     * @param {} studyViewFilter - A web service for supplying JSON formatted data to cBioPortal clients. Please note that this API is currently in beta and subject to change.
     */
    getClinicalEventTypeCountsUsingPOSTWithHttpInfo(parameters: {
        'studyViewFilter' ? : StudyViewFilter,
        $queryParameters ? : any,
            $domain ? : string
    }): Promise < request.Response > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        const errorHandlers = this.errorHandlers;
        const request = this.request;
        let path = '/api/clinical-event-type-counts/fetch';
        let body: any;
        let queryParameters: any = {};
        let headers: any = {};
        let form: any = {};
        return new Promise(function(resolve, reject) {
            headers['Accept'] = 'application/json';
            headers['Content-Type'] = 'application/json';

            if (parameters['studyViewFilter'] !== undefined) {
                body = parameters['studyViewFilter'];
            }

            if (parameters.$queryParameters) {
                Object.keys(parameters.$queryParameters).forEach(function(parameterName) {
                    var parameter = parameters.$queryParameters[parameterName];
                    queryParameters[parameterName] = parameter;
                });
            }

            request('POST', domain + path, body, headers, queryParameters, form, reject, resolve, errorHandlers);

        });
    };

    /**
     * Get Counts of Clinical Event Types by Study View Filter
     * @method
     * @name CBioPortalAPIInternal#getClinicalEventTypeCountsUsingPOST
     * @param {} studyViewFilter - A web service for supplying JSON formatted data to cBioPortal clients. Please note that this API is currently in beta and subject to change.
     */
    getClinicalEventTypeCountsUsingPOST(parameters: {
            'studyViewFilter' ? : StudyViewFilter,
            $queryParameters ? : any,
                $domain ? : string
        }): Promise < Array < ClinicalEventTypeCount >
        > {
            return this.getClinicalEventTypeCountsUsingPOSTWithHttpInfo(parameters).then(function(response: request.Response) {
                return response.body;
            });
        };
    fetchClinicalEventsMetaUsingPOSTURL(parameters: {
        'clinicalEventAttributeRequest' ? : ClinicalEventAttributeRequest,
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/api/clinical-events-meta/fetch';

        if (parameters.$queryParameters) {
            Object.keys(parameters.$queryParameters).forEach(function(parameterName) {
                var parameter = parameters.$queryParameters[parameterName];
                queryParameters[parameterName] = parameter;
            });
        }
        let keys = Object.keys(queryParameters);
        return this.domain + path + (keys.length > 0 ? '?' + (keys.map(key => key + '=' + encodeURIComponent(queryParameters[key])).join('&')) : '');
    };

    /**
     * Fetch clinical events meta
     * @method
     * @name CBioPortalAPIInternal#fetchClinicalEventsMetaUsingPOST
     * @param {} clinicalEventAttributeRequest - A web service for supplying JSON formatted data to cBioPortal clients. Please note that this API is currently in beta and subject to change.
     */
    fetchClinicalEventsMetaUsingPOSTWithHttpInfo(parameters: {
        'clinicalEventAttributeRequest' ? : ClinicalEventAttributeRequest,
        $queryParameters ? : any,
            $domain ? : string
    }): Promise < request.Response > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        const errorHandlers = this.errorHandlers;
        const request = this.request;
        let path = '/api/clinical-events-meta/fetch';
        let body: any;
        let queryParameters: any = {};
        let headers: any = {};
        let form: any = {};
        return new Promise(function(resolve, reject) {
            headers['Accept'] = 'application/json';
            headers['Content-Type'] = 'application/json';

            if (parameters['clinicalEventAttributeRequest'] !== undefined) {
                body = parameters['clinicalEventAttributeRequest'];
            }

            if (parameters.$queryParameters) {
                Object.keys(parameters.$queryParameters).forEach(function(parameterName) {
                    var parameter = parameters.$queryParameters[parameterName];
                    queryParameters[parameterName] = parameter;
                });
            }

            request('POST', domain + path, body, headers, queryParameters, form, reject, resolve, errorHandlers);

        });
    };

    /**
     * Fetch clinical events meta
     * @method
     * @name CBioPortalAPIInternal#fetchClinicalEventsMetaUsingPOST
     * @param {} clinicalEventAttributeRequest - A web service for supplying JSON formatted data to cBioPortal clients. Please note that this API is currently in beta and subject to change.
     */
    fetchClinicalEventsMetaUsingPOST(parameters: {
            'clinicalEventAttributeRequest' ? : ClinicalEventAttributeRequest,
            $queryParameters ? : any,
                $domain ? : string
        }): Promise < Array < ClinicalEvent >
        > {
            return this.fetchClinicalEventsMetaUsingPOSTWithHttpInfo(parameters).then(function(response: request.Response) {
                return response.body;
            });
        };
    fetchCNAGenesUsingPOSTURL(parameters: {
        'studyViewFilter' ? : StudyViewFilter,
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/api/cna-genes/fetch';

        if (parameters.$queryParameters) {
            Object.keys(parameters.$queryParameters).forEach(function(parameterName) {
                var parameter = parameters.$queryParameters[parameterName];
                queryParameters[parameterName] = parameter;
            });
        }
        let keys = Object.keys(queryParameters);
        return this.domain + path + (keys.length > 0 ? '?' + (keys.map(key => key + '=' + encodeURIComponent(queryParameters[key])).join('&')) : '');
    };

    /**
     * Fetch CNA genes by study view filter
     * @method
     * @name CBioPortalAPIInternal#fetchCNAGenesUsingPOST
     * @param {} studyViewFilter - A web service for supplying JSON formatted data to cBioPortal clients. Please note that this API is currently in beta and subject to change.
     */
    fetchCNAGenesUsingPOSTWithHttpInfo(parameters: {
        'studyViewFilter' ? : StudyViewFilter,
        $queryParameters ? : any,
            $domain ? : string
    }): Promise < request.Response > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        const errorHandlers = this.errorHandlers;
        const request = this.request;
        let path = '/api/cna-genes/fetch';
        let body: any;
        let queryParameters: any = {};
        let headers: any = {};
        let form: any = {};
        return new Promise(function(resolve, reject) {
            headers['Accept'] = 'application/json';
            headers['Content-Type'] = 'application/json';

            if (parameters['studyViewFilter'] !== undefined) {
                body = parameters['studyViewFilter'];
            }

            if (parameters.$queryParameters) {
                Object.keys(parameters.$queryParameters).forEach(function(parameterName) {
                    var parameter = parameters.$queryParameters[parameterName];
                    queryParameters[parameterName] = parameter;
                });
            }

            request('POST', domain + path, body, headers, queryParameters, form, reject, resolve, errorHandlers);

        });
    };

    /**
     * Fetch CNA genes by study view filter
     * @method
     * @name CBioPortalAPIInternal#fetchCNAGenesUsingPOST
     * @param {} studyViewFilter - A web service for supplying JSON formatted data to cBioPortal clients. Please note that this API is currently in beta and subject to change.
     */
    fetchCNAGenesUsingPOST(parameters: {
            'studyViewFilter' ? : StudyViewFilter,
            $queryParameters ? : any,
                $domain ? : string
        }): Promise < Array < CopyNumberCountByGene >
        > {
            return this.fetchCNAGenesUsingPOSTWithHttpInfo(parameters).then(function(response: request.Response) {
                return response.body;
            });
        };
    fetchPatientTreatmentCountsUsingPOSTURL(parameters: {
        'tier' ? : "Agent" | "AgentClass" | "AgentTarget",
        'studyViewFilter' ? : StudyViewFilter,
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/api/column-store/treatments/patient-counts/fetch';
        if (parameters['tier'] !== undefined) {
            queryParameters['tier'] = parameters['tier'];
        }

        if (parameters.$queryParameters) {
            Object.keys(parameters.$queryParameters).forEach(function(parameterName) {
                var parameter = parameters.$queryParameters[parameterName];
                queryParameters[parameterName] = parameter;
            });
        }
        let keys = Object.keys(queryParameters);
        return this.domain + path + (keys.length > 0 ? '?' + (keys.map(key => key + '=' + encodeURIComponent(queryParameters[key])).join('&')) : '');
    };

    /**
     * Get all patient level treatments
     * @method
     * @name CBioPortalAPIInternal#fetchPatientTreatmentCountsUsingPOST
     * @param {string} tier - A web service for supplying JSON formatted data to cBioPortal clients. Please note that this API is currently in beta and subject to change.
     * @param {} studyViewFilter - A web service for supplying JSON formatted data to cBioPortal clients. Please note that this API is currently in beta and subject to change.
     */
    fetchPatientTreatmentCountsUsingPOSTWithHttpInfo(parameters: {
        'tier' ? : "Agent" | "AgentClass" | "AgentTarget",
        'studyViewFilter' ? : StudyViewFilter,
        $queryParameters ? : any,
            $domain ? : string
    }): Promise < request.Response > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        const errorHandlers = this.errorHandlers;
        const request = this.request;
        let path = '/api/column-store/treatments/patient-counts/fetch';
        let body: any;
        let queryParameters: any = {};
        let headers: any = {};
        let form: any = {};
        return new Promise(function(resolve, reject) {
            headers['Accept'] = 'application/json';
            headers['Content-Type'] = 'application/json';

            if (parameters['tier'] !== undefined) {
                queryParameters['tier'] = parameters['tier'];
            }

            if (parameters['studyViewFilter'] !== undefined) {
                body = parameters['studyViewFilter'];
            }

            if (parameters.$queryParameters) {
                Object.keys(parameters.$queryParameters).forEach(function(parameterName) {
                    var parameter = parameters.$queryParameters[parameterName];
                    queryParameters[parameterName] = parameter;
                });
            }

            request('POST', domain + path, body, headers, queryParameters, form, reject, resolve, errorHandlers);

        });
    };

    /**
     * Get all patient level treatments
     * @method
     * @name CBioPortalAPIInternal#fetchPatientTreatmentCountsUsingPOST
     * @param {string} tier - A web service for supplying JSON formatted data to cBioPortal clients. Please note that this API is currently in beta and subject to change.
     * @param {} studyViewFilter - A web service for supplying JSON formatted data to cBioPortal clients. Please note that this API is currently in beta and subject to change.
     */
    fetchPatientTreatmentCountsUsingPOST(parameters: {
        'tier' ? : "Agent" | "AgentClass" | "AgentTarget",
        'studyViewFilter' ? : StudyViewFilter,
        $queryParameters ? : any,
            $domain ? : string
    }): Promise < PatientTreatmentReport > {
        return this.fetchPatientTreatmentCountsUsingPOSTWithHttpInfo(parameters).then(function(response: request.Response) {
            return response.body;
        });
    };
    fetchSampleTreatmentCountsUsingPOSTURL(parameters: {
        'tier' ? : "Agent" | "AgentClass" | "AgentTarget",
        'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
        'studyViewFilter' ? : StudyViewFilter,
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/api/column-store/treatments/sample-counts/fetch';
        if (parameters['tier'] !== undefined) {
            queryParameters['tier'] = parameters['tier'];
        }

        if (parameters['projection'] !== undefined) {
            queryParameters['projection'] = parameters['projection'];
        }

        if (parameters.$queryParameters) {
            Object.keys(parameters.$queryParameters).forEach(function(parameterName) {
                var parameter = parameters.$queryParameters[parameterName];
                queryParameters[parameterName] = parameter;
            });
        }
        let keys = Object.keys(queryParameters);
        return this.domain + path + (keys.length > 0 ? '?' + (keys.map(key => key + '=' + encodeURIComponent(queryParameters[key])).join('&')) : '');
    };

    /**
     * 
     * @method
     * @name CBioPortalAPIInternal#fetchSampleTreatmentCountsUsingPOST
     * @param {string} tier - A web service for supplying JSON formatted data to cBioPortal clients. Please note that this API is currently in beta and subject to change.
     * @param {string} projection - Level of detail of the response
     * @param {} studyViewFilter - A web service for supplying JSON formatted data to cBioPortal clients. Please note that this API is currently in beta and subject to change.
     */
    fetchSampleTreatmentCountsUsingPOSTWithHttpInfo(parameters: {
        'tier' ? : "Agent" | "AgentClass" | "AgentTarget",
        'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
        'studyViewFilter' ? : StudyViewFilter,
        $queryParameters ? : any,
            $domain ? : string
    }): Promise < request.Response > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        const errorHandlers = this.errorHandlers;
        const request = this.request;
        let path = '/api/column-store/treatments/sample-counts/fetch';
        let body: any;
        let queryParameters: any = {};
        let headers: any = {};
        let form: any = {};
        return new Promise(function(resolve, reject) {
            headers['Accept'] = 'application/json';
            headers['Content-Type'] = 'application/json';

            if (parameters['tier'] !== undefined) {
                queryParameters['tier'] = parameters['tier'];
            }

            if (parameters['projection'] !== undefined) {
                queryParameters['projection'] = parameters['projection'];
            }

            if (parameters['studyViewFilter'] !== undefined) {
                body = parameters['studyViewFilter'];
            }

            if (parameters.$queryParameters) {
                Object.keys(parameters.$queryParameters).forEach(function(parameterName) {
                    var parameter = parameters.$queryParameters[parameterName];
                    queryParameters[parameterName] = parameter;
                });
            }

            request('POST', domain + path, body, headers, queryParameters, form, reject, resolve, errorHandlers);

        });
    };

    /**
     * 
     * @method
     * @name CBioPortalAPIInternal#fetchSampleTreatmentCountsUsingPOST
     * @param {string} tier - A web service for supplying JSON formatted data to cBioPortal clients. Please note that this API is currently in beta and subject to change.
     * @param {string} projection - Level of detail of the response
     * @param {} studyViewFilter - A web service for supplying JSON formatted data to cBioPortal clients. Please note that this API is currently in beta and subject to change.
     */
    fetchSampleTreatmentCountsUsingPOST(parameters: {
        'tier' ? : "Agent" | "AgentClass" | "AgentTarget",
        'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
        'studyViewFilter' ? : StudyViewFilter,
        $queryParameters ? : any,
            $domain ? : string
    }): Promise < SampleTreatmentReport > {
        return this.fetchSampleTreatmentCountsUsingPOSTWithHttpInfo(parameters).then(function(response: request.Response) {
            return response.body;
        });
    };
    fetchCustomDataBinCountsUsingPOSTURL(parameters: {
        'dataBinMethod' ? : "STATIC" | "DYNAMIC",
        'clinicalDataBinCountFilter' ? : ClinicalDataBinCountFilter,
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/api/custom-data-bin-counts/fetch';
        if (parameters['dataBinMethod'] !== undefined) {
            queryParameters['dataBinMethod'] = parameters['dataBinMethod'];
        }

        if (parameters.$queryParameters) {
            Object.keys(parameters.$queryParameters).forEach(function(parameterName) {
                var parameter = parameters.$queryParameters[parameterName];
                queryParameters[parameterName] = parameter;
            });
        }
        let keys = Object.keys(queryParameters);
        return this.domain + path + (keys.length > 0 ? '?' + (keys.map(key => key + '=' + encodeURIComponent(queryParameters[key])).join('&')) : '');
    };

    /**
     * Fetch custom data bin counts by study view filter
     * @method
     * @name CBioPortalAPIInternal#fetchCustomDataBinCountsUsingPOST
     * @param {string} dataBinMethod - Method for data binning
     * @param {} clinicalDataBinCountFilter - A web service for supplying JSON formatted data to cBioPortal clients. Please note that this API is currently in beta and subject to change.
     */
    fetchCustomDataBinCountsUsingPOSTWithHttpInfo(parameters: {
        'dataBinMethod' ? : "STATIC" | "DYNAMIC",
        'clinicalDataBinCountFilter' ? : ClinicalDataBinCountFilter,
        $queryParameters ? : any,
            $domain ? : string
    }): Promise < request.Response > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        const errorHandlers = this.errorHandlers;
        const request = this.request;
        let path = '/api/custom-data-bin-counts/fetch';
        let body: any;
        let queryParameters: any = {};
        let headers: any = {};
        let form: any = {};
        return new Promise(function(resolve, reject) {
            headers['Accept'] = 'application/json';
            headers['Content-Type'] = 'application/json';

            if (parameters['dataBinMethod'] !== undefined) {
                queryParameters['dataBinMethod'] = parameters['dataBinMethod'];
            }

            if (parameters['clinicalDataBinCountFilter'] !== undefined) {
                body = parameters['clinicalDataBinCountFilter'];
            }

            if (parameters.$queryParameters) {
                Object.keys(parameters.$queryParameters).forEach(function(parameterName) {
                    var parameter = parameters.$queryParameters[parameterName];
                    queryParameters[parameterName] = parameter;
                });
            }

            request('POST', domain + path, body, headers, queryParameters, form, reject, resolve, errorHandlers);

        });
    };

    /**
     * Fetch custom data bin counts by study view filter
     * @method
     * @name CBioPortalAPIInternal#fetchCustomDataBinCountsUsingPOST
     * @param {string} dataBinMethod - Method for data binning
     * @param {} clinicalDataBinCountFilter - A web service for supplying JSON formatted data to cBioPortal clients. Please note that this API is currently in beta and subject to change.
     */
    fetchCustomDataBinCountsUsingPOST(parameters: {
            'dataBinMethod' ? : "STATIC" | "DYNAMIC",
            'clinicalDataBinCountFilter' ? : ClinicalDataBinCountFilter,
            $queryParameters ? : any,
                $domain ? : string
        }): Promise < Array < ClinicalDataBin >
        > {
            return this.fetchCustomDataBinCountsUsingPOSTWithHttpInfo(parameters).then(function(response: request.Response) {
                return response.body;
            });
        };
    fetchCustomDataCountsUsingPOSTURL(parameters: {
        'clinicalDataCountFilter' ? : ClinicalDataCountFilter,
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/api/custom-data-counts/fetch';

        if (parameters.$queryParameters) {
            Object.keys(parameters.$queryParameters).forEach(function(parameterName) {
                var parameter = parameters.$queryParameters[parameterName];
                queryParameters[parameterName] = parameter;
            });
        }
        let keys = Object.keys(queryParameters);
        return this.domain + path + (keys.length > 0 ? '?' + (keys.map(key => key + '=' + encodeURIComponent(queryParameters[key])).join('&')) : '');
    };

    /**
     * Fetch custom data counts by study view filter
     * @method
     * @name CBioPortalAPIInternal#fetchCustomDataCountsUsingPOST
     * @param {} clinicalDataCountFilter - A web service for supplying JSON formatted data to cBioPortal clients. Please note that this API is currently in beta and subject to change.
     */
    fetchCustomDataCountsUsingPOSTWithHttpInfo(parameters: {
        'clinicalDataCountFilter' ? : ClinicalDataCountFilter,
        $queryParameters ? : any,
            $domain ? : string
    }): Promise < request.Response > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        const errorHandlers = this.errorHandlers;
        const request = this.request;
        let path = '/api/custom-data-counts/fetch';
        let body: any;
        let queryParameters: any = {};
        let headers: any = {};
        let form: any = {};
        return new Promise(function(resolve, reject) {
            headers['Accept'] = 'application/json';
            headers['Content-Type'] = 'application/json';

            if (parameters['clinicalDataCountFilter'] !== undefined) {
                body = parameters['clinicalDataCountFilter'];
            }

            if (parameters.$queryParameters) {
                Object.keys(parameters.$queryParameters).forEach(function(parameterName) {
                    var parameter = parameters.$queryParameters[parameterName];
                    queryParameters[parameterName] = parameter;
                });
            }

            request('POST', domain + path, body, headers, queryParameters, form, reject, resolve, errorHandlers);

        });
    };

    /**
     * Fetch custom data counts by study view filter
     * @method
     * @name CBioPortalAPIInternal#fetchCustomDataCountsUsingPOST
     * @param {} clinicalDataCountFilter - A web service for supplying JSON formatted data to cBioPortal clients. Please note that this API is currently in beta and subject to change.
     */
    fetchCustomDataCountsUsingPOST(parameters: {
            'clinicalDataCountFilter' ? : ClinicalDataCountFilter,
            $queryParameters ? : any,
                $domain ? : string
        }): Promise < Array < ClinicalDataCountItem >
        > {
            return this.fetchCustomDataCountsUsingPOSTWithHttpInfo(parameters).then(function(response: request.Response) {
                return response.body;
            });
        };
    fetchAlterationDriverAnnotationReportUsingPOSTURL(parameters: {
        'molecularProfileIds': Array < string > ,
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/api/custom-driver-annotation-report/fetch';

        if (parameters.$queryParameters) {
            Object.keys(parameters.$queryParameters).forEach(function(parameterName) {
                var parameter = parameters.$queryParameters[parameterName];
                queryParameters[parameterName] = parameter;
            });
        }
        let keys = Object.keys(queryParameters);
        return this.domain + path + (keys.length > 0 ? '?' + (keys.map(key => key + '=' + encodeURIComponent(queryParameters[key])).join('&')) : '');
    };

    /**
     * Return availability of custom driver annotations for molecular profiles
     * @method
     * @name CBioPortalAPIInternal#fetchAlterationDriverAnnotationReportUsingPOST
     * @param {} molecularProfileIds - A web service for supplying JSON formatted data to cBioPortal clients. Please note that this API is currently in beta and subject to change.
     */
    fetchAlterationDriverAnnotationReportUsingPOSTWithHttpInfo(parameters: {
        'molecularProfileIds': Array < string > ,
        $queryParameters ? : any,
        $domain ? : string
    }): Promise < request.Response > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        const errorHandlers = this.errorHandlers;
        const request = this.request;
        let path = '/api/custom-driver-annotation-report/fetch';
        let body: any;
        let queryParameters: any = {};
        let headers: any = {};
        let form: any = {};
        return new Promise(function(resolve, reject) {
            headers['Accept'] = 'application/json';
            headers['Content-Type'] = 'application/json';

            if (parameters['molecularProfileIds'] !== undefined) {
                body = parameters['molecularProfileIds'];
            }

            if (parameters['molecularProfileIds'] === undefined) {
                reject(new Error('Missing required  parameter: molecularProfileIds'));
                return;
            }

            if (parameters.$queryParameters) {
                Object.keys(parameters.$queryParameters).forEach(function(parameterName) {
                    var parameter = parameters.$queryParameters[parameterName];
                    queryParameters[parameterName] = parameter;
                });
            }

            request('POST', domain + path, body, headers, queryParameters, form, reject, resolve, errorHandlers);

        });
    };

    /**
     * Return availability of custom driver annotations for molecular profiles
     * @method
     * @name CBioPortalAPIInternal#fetchAlterationDriverAnnotationReportUsingPOST
     * @param {} molecularProfileIds - A web service for supplying JSON formatted data to cBioPortal clients. Please note that this API is currently in beta and subject to change.
     */
    fetchAlterationDriverAnnotationReportUsingPOST(parameters: {
        'molecularProfileIds': Array < string > ,
        $queryParameters ? : any,
        $domain ? : string
    }): Promise < CustomDriverAnnotationReport > {
        return this.fetchAlterationDriverAnnotationReportUsingPOSTWithHttpInfo(parameters).then(function(response: request.Response) {
            return response.body;
        });
    };
    downloadDataAccessTokenUsingGETURL(parameters: {
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/api/data-access-token';

        if (parameters.$queryParameters) {
            Object.keys(parameters.$queryParameters).forEach(function(parameterName) {
                var parameter = parameters.$queryParameters[parameterName];
                queryParameters[parameterName] = parameter;
            });
        }
        let keys = Object.keys(queryParameters);
        return this.domain + path + (keys.length > 0 ? '?' + (keys.map(key => key + '=' + encodeURIComponent(queryParameters[key])).join('&')) : '');
    };

    /**
     * Create a new data access token
     * @method
     * @name CBioPortalAPIInternal#downloadDataAccessTokenUsingGET
     */
    downloadDataAccessTokenUsingGETWithHttpInfo(parameters: {
        $queryParameters ? : any,
            $domain ? : string
    }): Promise < request.Response > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        const errorHandlers = this.errorHandlers;
        const request = this.request;
        let path = '/api/data-access-token';
        let body: any;
        let queryParameters: any = {};
        let headers: any = {};
        let form: any = {};
        return new Promise(function(resolve, reject) {
            headers['Accept'] = 'application/octet-stream';

            if (parameters.$queryParameters) {
                Object.keys(parameters.$queryParameters).forEach(function(parameterName) {
                    var parameter = parameters.$queryParameters[parameterName];
                    queryParameters[parameterName] = parameter;
                });
            }

            request('GET', domain + path, body, headers, queryParameters, form, reject, resolve, errorHandlers);

        });
    };

    /**
     * Create a new data access token
     * @method
     * @name CBioPortalAPIInternal#downloadDataAccessTokenUsingGET
     */
    downloadDataAccessTokenUsingGET(parameters: {
        $queryParameters ? : any,
            $domain ? : string
    }): Promise < string > {
        return this.downloadDataAccessTokenUsingGETWithHttpInfo(parameters).then(function(response: request.Response) {
            return response.body;
        });
    };
    downloadOAuth2DataAccessTokenUsingGETURL(parameters: {
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/api/data-access-token/oauth2';

        if (parameters.$queryParameters) {
            Object.keys(parameters.$queryParameters).forEach(function(parameterName) {
                var parameter = parameters.$queryParameters[parameterName];
                queryParameters[parameterName] = parameter;
            });
        }
        let keys = Object.keys(queryParameters);
        return this.domain + path + (keys.length > 0 ? '?' + (keys.map(key => key + '=' + encodeURIComponent(queryParameters[key])).join('&')) : '');
    };

    /**
     * 
     * @method
     * @name CBioPortalAPIInternal#downloadOAuth2DataAccessTokenUsingGET
     */
    downloadOAuth2DataAccessTokenUsingGETWithHttpInfo(parameters: {
        $queryParameters ? : any,
            $domain ? : string
    }): Promise < request.Response > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        const errorHandlers = this.errorHandlers;
        const request = this.request;
        let path = '/api/data-access-token/oauth2';
        let body: any;
        let queryParameters: any = {};
        let headers: any = {};
        let form: any = {};
        return new Promise(function(resolve, reject) {
            headers['Accept'] = 'application/octet-stream';

            if (parameters.$queryParameters) {
                Object.keys(parameters.$queryParameters).forEach(function(parameterName) {
                    var parameter = parameters.$queryParameters[parameterName];
                    queryParameters[parameterName] = parameter;
                });
            }

            request('GET', domain + path, body, headers, queryParameters, form, reject, resolve, errorHandlers);

        });
    };

    /**
     * 
     * @method
     * @name CBioPortalAPIInternal#downloadOAuth2DataAccessTokenUsingGET
     */
    downloadOAuth2DataAccessTokenUsingGET(parameters: {
        $queryParameters ? : any,
            $domain ? : string
    }): Promise < string > {
        return this.downloadOAuth2DataAccessTokenUsingGETWithHttpInfo(parameters).then(function(response: request.Response) {
            return response.body;
        });
    };
    revokeAllDataAccessTokensUsingDELETEURL(parameters: {
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/api/data-access-tokens';

        if (parameters.$queryParameters) {
            Object.keys(parameters.$queryParameters).forEach(function(parameterName) {
                var parameter = parameters.$queryParameters[parameterName];
                queryParameters[parameterName] = parameter;
            });
        }
        let keys = Object.keys(queryParameters);
        return this.domain + path + (keys.length > 0 ? '?' + (keys.map(key => key + '=' + encodeURIComponent(queryParameters[key])).join('&')) : '');
    };

    /**
     * Delete all data access tokens
     * @method
     * @name CBioPortalAPIInternal#revokeAllDataAccessTokensUsingDELETE
     */
    revokeAllDataAccessTokensUsingDELETEWithHttpInfo(parameters: {
        $queryParameters ? : any,
            $domain ? : string
    }): Promise < request.Response > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        const errorHandlers = this.errorHandlers;
        const request = this.request;
        let path = '/api/data-access-tokens';
        let body: any;
        let queryParameters: any = {};
        let headers: any = {};
        let form: any = {};
        return new Promise(function(resolve, reject) {

            if (parameters.$queryParameters) {
                Object.keys(parameters.$queryParameters).forEach(function(parameterName) {
                    var parameter = parameters.$queryParameters[parameterName];
                    queryParameters[parameterName] = parameter;
                });
            }

            request('DELETE', domain + path, body, headers, queryParameters, form, reject, resolve, errorHandlers);

        });
    };

    /**
     * Delete all data access tokens
     * @method
     * @name CBioPortalAPIInternal#revokeAllDataAccessTokensUsingDELETE
     */
    revokeAllDataAccessTokensUsingDELETE(parameters: {
        $queryParameters ? : any,
            $domain ? : string
    }): Promise < any > {
        return this.revokeAllDataAccessTokensUsingDELETEWithHttpInfo(parameters).then(function(response: request.Response) {
            return response.body;
        });
    };
    getAllDataAccessTokensUsingGETURL(parameters: {
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/api/data-access-tokens';

        if (parameters.$queryParameters) {
            Object.keys(parameters.$queryParameters).forEach(function(parameterName) {
                var parameter = parameters.$queryParameters[parameterName];
                queryParameters[parameterName] = parameter;
            });
        }
        let keys = Object.keys(queryParameters);
        return this.domain + path + (keys.length > 0 ? '?' + (keys.map(key => key + '=' + encodeURIComponent(queryParameters[key])).join('&')) : '');
    };

    /**
     * Retrieve all data access tokens
     * @method
     * @name CBioPortalAPIInternal#getAllDataAccessTokensUsingGET
     */
    getAllDataAccessTokensUsingGETWithHttpInfo(parameters: {
        $queryParameters ? : any,
            $domain ? : string
    }): Promise < request.Response > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        const errorHandlers = this.errorHandlers;
        const request = this.request;
        let path = '/api/data-access-tokens';
        let body: any;
        let queryParameters: any = {};
        let headers: any = {};
        let form: any = {};
        return new Promise(function(resolve, reject) {
            headers['Accept'] = 'application/octet-stream';

            if (parameters.$queryParameters) {
                Object.keys(parameters.$queryParameters).forEach(function(parameterName) {
                    var parameter = parameters.$queryParameters[parameterName];
                    queryParameters[parameterName] = parameter;
                });
            }

            request('GET', domain + path, body, headers, queryParameters, form, reject, resolve, errorHandlers);

        });
    };

    /**
     * Retrieve all data access tokens
     * @method
     * @name CBioPortalAPIInternal#getAllDataAccessTokensUsingGET
     */
    getAllDataAccessTokensUsingGET(parameters: {
            $queryParameters ? : any,
                $domain ? : string
        }): Promise < Array < DataAccessToken >
        > {
            return this.getAllDataAccessTokensUsingGETWithHttpInfo(parameters).then(function(response: request.Response) {
                return response.body;
            });
        };
    createDataAccessTokenUsingPOSTURL(parameters: {
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/api/data-access-tokens';

        if (parameters.$queryParameters) {
            Object.keys(parameters.$queryParameters).forEach(function(parameterName) {
                var parameter = parameters.$queryParameters[parameterName];
                queryParameters[parameterName] = parameter;
            });
        }
        let keys = Object.keys(queryParameters);
        return this.domain + path + (keys.length > 0 ? '?' + (keys.map(key => key + '=' + encodeURIComponent(queryParameters[key])).join('&')) : '');
    };

    /**
     * Get all data access tokens
     * @method
     * @name CBioPortalAPIInternal#createDataAccessTokenUsingPOST
     */
    createDataAccessTokenUsingPOSTWithHttpInfo(parameters: {
        $queryParameters ? : any,
            $domain ? : string
    }): Promise < request.Response > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        const errorHandlers = this.errorHandlers;
        const request = this.request;
        let path = '/api/data-access-tokens';
        let body: any;
        let queryParameters: any = {};
        let headers: any = {};
        let form: any = {};
        return new Promise(function(resolve, reject) {
            headers['Accept'] = 'application/json';

            if (parameters.$queryParameters) {
                Object.keys(parameters.$queryParameters).forEach(function(parameterName) {
                    var parameter = parameters.$queryParameters[parameterName];
                    queryParameters[parameterName] = parameter;
                });
            }

            request('POST', domain + path, body, headers, queryParameters, form, reject, resolve, errorHandlers);

        });
    };

    /**
     * Get all data access tokens
     * @method
     * @name CBioPortalAPIInternal#createDataAccessTokenUsingPOST
     */
    createDataAccessTokenUsingPOST(parameters: {
        $queryParameters ? : any,
            $domain ? : string
    }): Promise < DataAccessToken > {
        return this.createDataAccessTokenUsingPOSTWithHttpInfo(parameters).then(function(response: request.Response) {
            return response.body;
        });
    };
    revokeDataAccessTokenUsingDELETEURL(parameters: {
        'token': string,
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/api/data-access-tokens/{token}';

        path = path.replace('{token}', parameters['token'] + '');

        if (parameters.$queryParameters) {
            Object.keys(parameters.$queryParameters).forEach(function(parameterName) {
                var parameter = parameters.$queryParameters[parameterName];
                queryParameters[parameterName] = parameter;
            });
        }
        let keys = Object.keys(queryParameters);
        return this.domain + path + (keys.length > 0 ? '?' + (keys.map(key => key + '=' + encodeURIComponent(queryParameters[key])).join('&')) : '');
    };

    /**
     * Delete a data access token
     * @method
     * @name CBioPortalAPIInternal#revokeDataAccessTokenUsingDELETE
     * @param {string} token - token
     */
    revokeDataAccessTokenUsingDELETEWithHttpInfo(parameters: {
        'token': string,
        $queryParameters ? : any,
        $domain ? : string
    }): Promise < request.Response > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        const errorHandlers = this.errorHandlers;
        const request = this.request;
        let path = '/api/data-access-tokens/{token}';
        let body: any;
        let queryParameters: any = {};
        let headers: any = {};
        let form: any = {};
        return new Promise(function(resolve, reject) {

            path = path.replace('{token}', parameters['token'] + '');

            if (parameters['token'] === undefined) {
                reject(new Error('Missing required  parameter: token'));
                return;
            }

            if (parameters.$queryParameters) {
                Object.keys(parameters.$queryParameters).forEach(function(parameterName) {
                    var parameter = parameters.$queryParameters[parameterName];
                    queryParameters[parameterName] = parameter;
                });
            }

            request('DELETE', domain + path, body, headers, queryParameters, form, reject, resolve, errorHandlers);

        });
    };

    /**
     * Delete a data access token
     * @method
     * @name CBioPortalAPIInternal#revokeDataAccessTokenUsingDELETE
     * @param {string} token - token
     */
    revokeDataAccessTokenUsingDELETE(parameters: {
        'token': string,
        $queryParameters ? : any,
        $domain ? : string
    }): Promise < any > {
        return this.revokeDataAccessTokenUsingDELETEWithHttpInfo(parameters).then(function(response: request.Response) {
            return response.body;
        });
    };
    getDataAccessTokenUsingGETURL(parameters: {
        'token': string,
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/api/data-access-tokens/{token}';

        path = path.replace('{token}', parameters['token'] + '');

        if (parameters.$queryParameters) {
            Object.keys(parameters.$queryParameters).forEach(function(parameterName) {
                var parameter = parameters.$queryParameters[parameterName];
                queryParameters[parameterName] = parameter;
            });
        }
        let keys = Object.keys(queryParameters);
        return this.domain + path + (keys.length > 0 ? '?' + (keys.map(key => key + '=' + encodeURIComponent(queryParameters[key])).join('&')) : '');
    };

    /**
     * Retrieve an existing data access token
     * @method
     * @name CBioPortalAPIInternal#getDataAccessTokenUsingGET
     * @param {string} token - token
     */
    getDataAccessTokenUsingGETWithHttpInfo(parameters: {
        'token': string,
        $queryParameters ? : any,
        $domain ? : string
    }): Promise < request.Response > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        const errorHandlers = this.errorHandlers;
        const request = this.request;
        let path = '/api/data-access-tokens/{token}';
        let body: any;
        let queryParameters: any = {};
        let headers: any = {};
        let form: any = {};
        return new Promise(function(resolve, reject) {
            headers['Accept'] = 'application/octet-stream';

            path = path.replace('{token}', parameters['token'] + '');

            if (parameters['token'] === undefined) {
                reject(new Error('Missing required  parameter: token'));
                return;
            }

            if (parameters.$queryParameters) {
                Object.keys(parameters.$queryParameters).forEach(function(parameterName) {
                    var parameter = parameters.$queryParameters[parameterName];
                    queryParameters[parameterName] = parameter;
                });
            }

            request('GET', domain + path, body, headers, queryParameters, form, reject, resolve, errorHandlers);

        });
    };

    /**
     * Retrieve an existing data access token
     * @method
     * @name CBioPortalAPIInternal#getDataAccessTokenUsingGET
     * @param {string} token - token
     */
    getDataAccessTokenUsingGET(parameters: {
        'token': string,
        $queryParameters ? : any,
        $domain ? : string
    }): Promise < DataAccessToken > {
        return this.getDataAccessTokenUsingGETWithHttpInfo(parameters).then(function(response: request.Response) {
            return response.body;
        });
    };
    fetchGenomicEnrichmentsUsingPOSTURL(parameters: {
        'enrichmentType' ? : "SAMPLE" | "PATIENT",
        'groupsContainingSampleAndMolecularProfileIdentifiers' ? : Array < MolecularProfileCasesGroupFilter > ,
            $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/api/expression-enrichments/fetch';
        if (parameters['enrichmentType'] !== undefined) {
            queryParameters['enrichmentType'] = parameters['enrichmentType'];
        }

        if (parameters.$queryParameters) {
            Object.keys(parameters.$queryParameters).forEach(function(parameterName) {
                var parameter = parameters.$queryParameters[parameterName];
                queryParameters[parameterName] = parameter;
            });
        }
        let keys = Object.keys(queryParameters);
        return this.domain + path + (keys.length > 0 ? '?' + (keys.map(key => key + '=' + encodeURIComponent(queryParameters[key])).join('&')) : '');
    };

    /**
     * Fetch genomic enrichments in a molecular profile
     * @method
     * @name CBioPortalAPIInternal#fetchGenomicEnrichmentsUsingPOST
     * @param {string} enrichmentType - Type of the enrichment e.g. SAMPLE or PATIENT
     * @param {} groupsContainingSampleAndMolecularProfileIdentifiers - A web service for supplying JSON formatted data to cBioPortal clients. Please note that this API is currently in beta and subject to change.
     */
    fetchGenomicEnrichmentsUsingPOSTWithHttpInfo(parameters: {
        'enrichmentType' ? : "SAMPLE" | "PATIENT",
        'groupsContainingSampleAndMolecularProfileIdentifiers' ? : Array < MolecularProfileCasesGroupFilter > ,
            $queryParameters ? : any,
            $domain ? : string
    }): Promise < request.Response > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        const errorHandlers = this.errorHandlers;
        const request = this.request;
        let path = '/api/expression-enrichments/fetch';
        let body: any;
        let queryParameters: any = {};
        let headers: any = {};
        let form: any = {};
        return new Promise(function(resolve, reject) {
            headers['Accept'] = 'application/json';
            headers['Content-Type'] = 'application/json';

            if (parameters['enrichmentType'] !== undefined) {
                queryParameters['enrichmentType'] = parameters['enrichmentType'];
            }

            if (parameters['groupsContainingSampleAndMolecularProfileIdentifiers'] !== undefined) {
                body = parameters['groupsContainingSampleAndMolecularProfileIdentifiers'];
            }

            if (parameters.$queryParameters) {
                Object.keys(parameters.$queryParameters).forEach(function(parameterName) {
                    var parameter = parameters.$queryParameters[parameterName];
                    queryParameters[parameterName] = parameter;
                });
            }

            request('POST', domain + path, body, headers, queryParameters, form, reject, resolve, errorHandlers);

        });
    };

    /**
     * Fetch genomic enrichments in a molecular profile
     * @method
     * @name CBioPortalAPIInternal#fetchGenomicEnrichmentsUsingPOST
     * @param {string} enrichmentType - Type of the enrichment e.g. SAMPLE or PATIENT
     * @param {} groupsContainingSampleAndMolecularProfileIdentifiers - A web service for supplying JSON formatted data to cBioPortal clients. Please note that this API is currently in beta and subject to change.
     */
    fetchGenomicEnrichmentsUsingPOST(parameters: {
            'enrichmentType' ? : "SAMPLE" | "PATIENT",
            'groupsContainingSampleAndMolecularProfileIdentifiers' ? : Array < MolecularProfileCasesGroupFilter > ,
                $queryParameters ? : any,
                $domain ? : string
        }): Promise < Array < GenomicEnrichment >
        > {
            return this.fetchGenomicEnrichmentsUsingPOSTWithHttpInfo(parameters).then(function(response: request.Response) {
                return response.body;
            });
        };
    fetchFilteredSamplesUsingPOSTURL(parameters: {
        'negateFilters' ? : boolean,
        'studyViewFilter' ? : StudyViewFilter,
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/api/filtered-samples/fetch';
        if (parameters['negateFilters'] !== undefined) {
            queryParameters['negateFilters'] = parameters['negateFilters'];
        }

        if (parameters.$queryParameters) {
            Object.keys(parameters.$queryParameters).forEach(function(parameterName) {
                var parameter = parameters.$queryParameters[parameterName];
                queryParameters[parameterName] = parameter;
            });
        }
        let keys = Object.keys(queryParameters);
        return this.domain + path + (keys.length > 0 ? '?' + (keys.map(key => key + '=' + encodeURIComponent(queryParameters[key])).join('&')) : '');
    };

    /**
     * Fetch sample IDs by study view filter
     * @method
     * @name CBioPortalAPIInternal#fetchFilteredSamplesUsingPOST
     * @param {boolean} negateFilters - Whether to negate the study view filters
     * @param {} studyViewFilter - A web service for supplying JSON formatted data to cBioPortal clients. Please note that this API is currently in beta and subject to change.
     */
    fetchFilteredSamplesUsingPOSTWithHttpInfo(parameters: {
        'negateFilters' ? : boolean,
        'studyViewFilter' ? : StudyViewFilter,
        $queryParameters ? : any,
            $domain ? : string
    }): Promise < request.Response > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        const errorHandlers = this.errorHandlers;
        const request = this.request;
        let path = '/api/filtered-samples/fetch';
        let body: any;
        let queryParameters: any = {};
        let headers: any = {};
        let form: any = {};
        return new Promise(function(resolve, reject) {
            headers['Accept'] = 'application/json';
            headers['Content-Type'] = 'application/json';

            if (parameters['negateFilters'] !== undefined) {
                queryParameters['negateFilters'] = parameters['negateFilters'];
            }

            if (parameters['studyViewFilter'] !== undefined) {
                body = parameters['studyViewFilter'];
            }

            if (parameters.$queryParameters) {
                Object.keys(parameters.$queryParameters).forEach(function(parameterName) {
                    var parameter = parameters.$queryParameters[parameterName];
                    queryParameters[parameterName] = parameter;
                });
            }

            request('POST', domain + path, body, headers, queryParameters, form, reject, resolve, errorHandlers);

        });
    };

    /**
     * Fetch sample IDs by study view filter
     * @method
     * @name CBioPortalAPIInternal#fetchFilteredSamplesUsingPOST
     * @param {boolean} negateFilters - Whether to negate the study view filters
     * @param {} studyViewFilter - A web service for supplying JSON formatted data to cBioPortal clients. Please note that this API is currently in beta and subject to change.
     */
    fetchFilteredSamplesUsingPOST(parameters: {
            'negateFilters' ? : boolean,
            'studyViewFilter' ? : StudyViewFilter,
            $queryParameters ? : any,
                $domain ? : string
        }): Promise < Array < Sample >
        > {
            return this.fetchFilteredSamplesUsingPOSTWithHttpInfo(parameters).then(function(response: request.Response) {
                return response.body;
            });
        };
    fetchGenericAssayBinaryDataEnrichmentInMultipleMolecularProfilesUsingPOSTURL(parameters: {
        'enrichmentType' ? : "SAMPLE" | "PATIENT",
        'groupsContainingSampleAndMolecularProfileIdentifiers' ? : Array < MolecularProfileCasesGroupFilter > ,
            $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/api/generic-assay-binary-enrichments/fetch';
        if (parameters['enrichmentType'] !== undefined) {
            queryParameters['enrichmentType'] = parameters['enrichmentType'];
        }

        if (parameters.$queryParameters) {
            Object.keys(parameters.$queryParameters).forEach(function(parameterName) {
                var parameter = parameters.$queryParameters[parameterName];
                queryParameters[parameterName] = parameter;
            });
        }
        let keys = Object.keys(queryParameters);
        return this.domain + path + (keys.length > 0 ? '?' + (keys.map(key => key + '=' + encodeURIComponent(queryParameters[key])).join('&')) : '');
    };

    /**
     * Fetch generic assay binary data enrichments in a molecular profile
     * @method
     * @name CBioPortalAPIInternal#fetchGenericAssayBinaryDataEnrichmentInMultipleMolecularProfilesUsingPOST
     * @param {string} enrichmentType - Type of the enrichment e.g. SAMPLE or PATIENT
     * @param {} groupsContainingSampleAndMolecularProfileIdentifiers - A web service for supplying JSON formatted data to cBioPortal clients. Please note that this API is currently in beta and subject to change.
     */
    fetchGenericAssayBinaryDataEnrichmentInMultipleMolecularProfilesUsingPOSTWithHttpInfo(parameters: {
        'enrichmentType' ? : "SAMPLE" | "PATIENT",
        'groupsContainingSampleAndMolecularProfileIdentifiers' ? : Array < MolecularProfileCasesGroupFilter > ,
            $queryParameters ? : any,
            $domain ? : string
    }): Promise < request.Response > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        const errorHandlers = this.errorHandlers;
        const request = this.request;
        let path = '/api/generic-assay-binary-enrichments/fetch';
        let body: any;
        let queryParameters: any = {};
        let headers: any = {};
        let form: any = {};
        return new Promise(function(resolve, reject) {
            headers['Accept'] = 'application/json';
            headers['Content-Type'] = 'application/json';

            if (parameters['enrichmentType'] !== undefined) {
                queryParameters['enrichmentType'] = parameters['enrichmentType'];
            }

            if (parameters['groupsContainingSampleAndMolecularProfileIdentifiers'] !== undefined) {
                body = parameters['groupsContainingSampleAndMolecularProfileIdentifiers'];
            }

            if (parameters.$queryParameters) {
                Object.keys(parameters.$queryParameters).forEach(function(parameterName) {
                    var parameter = parameters.$queryParameters[parameterName];
                    queryParameters[parameterName] = parameter;
                });
            }

            request('POST', domain + path, body, headers, queryParameters, form, reject, resolve, errorHandlers);

        });
    };

    /**
     * Fetch generic assay binary data enrichments in a molecular profile
     * @method
     * @name CBioPortalAPIInternal#fetchGenericAssayBinaryDataEnrichmentInMultipleMolecularProfilesUsingPOST
     * @param {string} enrichmentType - Type of the enrichment e.g. SAMPLE or PATIENT
     * @param {} groupsContainingSampleAndMolecularProfileIdentifiers - A web service for supplying JSON formatted data to cBioPortal clients. Please note that this API is currently in beta and subject to change.
     */
    fetchGenericAssayBinaryDataEnrichmentInMultipleMolecularProfilesUsingPOST(parameters: {
            'enrichmentType' ? : "SAMPLE" | "PATIENT",
            'groupsContainingSampleAndMolecularProfileIdentifiers' ? : Array < MolecularProfileCasesGroupFilter > ,
                $queryParameters ? : any,
                $domain ? : string
        }): Promise < Array < GenericAssayBinaryEnrichment >
        > {
            return this.fetchGenericAssayBinaryDataEnrichmentInMultipleMolecularProfilesUsingPOSTWithHttpInfo(parameters).then(function(response: request.Response) {
                return response.body;
            });
        };
    fetchGenericAssayCategoricalDataEnrichmentInMultipleMolecularProfilesUsingPOSTURL(parameters: {
        'enrichmentType' ? : "SAMPLE" | "PATIENT",
        'groupsContainingSampleAndMolecularProfileIdentifiers' ? : Array < MolecularProfileCasesGroupFilter > ,
            $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/api/generic-assay-categorical-enrichments/fetch';
        if (parameters['enrichmentType'] !== undefined) {
            queryParameters['enrichmentType'] = parameters['enrichmentType'];
        }

        if (parameters.$queryParameters) {
            Object.keys(parameters.$queryParameters).forEach(function(parameterName) {
                var parameter = parameters.$queryParameters[parameterName];
                queryParameters[parameterName] = parameter;
            });
        }
        let keys = Object.keys(queryParameters);
        return this.domain + path + (keys.length > 0 ? '?' + (keys.map(key => key + '=' + encodeURIComponent(queryParameters[key])).join('&')) : '');
    };

    /**
     * Fetch generic assay categorical data enrichments in a molecular profile
     * @method
     * @name CBioPortalAPIInternal#fetchGenericAssayCategoricalDataEnrichmentInMultipleMolecularProfilesUsingPOST
     * @param {string} enrichmentType - Type of the enrichment e.g. SAMPLE or PATIENT
     * @param {} groupsContainingSampleAndMolecularProfileIdentifiers - A web service for supplying JSON formatted data to cBioPortal clients. Please note that this API is currently in beta and subject to change.
     */
    fetchGenericAssayCategoricalDataEnrichmentInMultipleMolecularProfilesUsingPOSTWithHttpInfo(parameters: {
        'enrichmentType' ? : "SAMPLE" | "PATIENT",
        'groupsContainingSampleAndMolecularProfileIdentifiers' ? : Array < MolecularProfileCasesGroupFilter > ,
            $queryParameters ? : any,
            $domain ? : string
    }): Promise < request.Response > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        const errorHandlers = this.errorHandlers;
        const request = this.request;
        let path = '/api/generic-assay-categorical-enrichments/fetch';
        let body: any;
        let queryParameters: any = {};
        let headers: any = {};
        let form: any = {};
        return new Promise(function(resolve, reject) {
            headers['Accept'] = 'application/json';
            headers['Content-Type'] = 'application/json';

            if (parameters['enrichmentType'] !== undefined) {
                queryParameters['enrichmentType'] = parameters['enrichmentType'];
            }

            if (parameters['groupsContainingSampleAndMolecularProfileIdentifiers'] !== undefined) {
                body = parameters['groupsContainingSampleAndMolecularProfileIdentifiers'];
            }

            if (parameters.$queryParameters) {
                Object.keys(parameters.$queryParameters).forEach(function(parameterName) {
                    var parameter = parameters.$queryParameters[parameterName];
                    queryParameters[parameterName] = parameter;
                });
            }

            request('POST', domain + path, body, headers, queryParameters, form, reject, resolve, errorHandlers);

        });
    };

    /**
     * Fetch generic assay categorical data enrichments in a molecular profile
     * @method
     * @name CBioPortalAPIInternal#fetchGenericAssayCategoricalDataEnrichmentInMultipleMolecularProfilesUsingPOST
     * @param {string} enrichmentType - Type of the enrichment e.g. SAMPLE or PATIENT
     * @param {} groupsContainingSampleAndMolecularProfileIdentifiers - A web service for supplying JSON formatted data to cBioPortal clients. Please note that this API is currently in beta and subject to change.
     */
    fetchGenericAssayCategoricalDataEnrichmentInMultipleMolecularProfilesUsingPOST(parameters: {
            'enrichmentType' ? : "SAMPLE" | "PATIENT",
            'groupsContainingSampleAndMolecularProfileIdentifiers' ? : Array < MolecularProfileCasesGroupFilter > ,
                $queryParameters ? : any,
                $domain ? : string
        }): Promise < Array < GenericAssayCategoricalEnrichment >
        > {
            return this.fetchGenericAssayCategoricalDataEnrichmentInMultipleMolecularProfilesUsingPOSTWithHttpInfo(parameters).then(function(response: request.Response) {
                return response.body;
            });
        };
    fetchGenericAssayDataBinCountsUsingPOSTURL(parameters: {
        'dataBinMethod' ? : "STATIC" | "DYNAMIC",
        'genericAssayDataBinCountFilter' ? : GenericAssayDataBinCountFilter,
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/api/generic-assay-data-bin-counts/fetch';
        if (parameters['dataBinMethod'] !== undefined) {
            queryParameters['dataBinMethod'] = parameters['dataBinMethod'];
        }

        if (parameters.$queryParameters) {
            Object.keys(parameters.$queryParameters).forEach(function(parameterName) {
                var parameter = parameters.$queryParameters[parameterName];
                queryParameters[parameterName] = parameter;
            });
        }
        let keys = Object.keys(queryParameters);
        return this.domain + path + (keys.length > 0 ? '?' + (keys.map(key => key + '=' + encodeURIComponent(queryParameters[key])).join('&')) : '');
    };

    /**
     * Fetch generic assay data bin counts by study view filter
     * @method
     * @name CBioPortalAPIInternal#fetchGenericAssayDataBinCountsUsingPOST
     * @param {string} dataBinMethod - Method for data binning
     * @param {} genericAssayDataBinCountFilter - A web service for supplying JSON formatted data to cBioPortal clients. Please note that this API is currently in beta and subject to change.
     */
    fetchGenericAssayDataBinCountsUsingPOSTWithHttpInfo(parameters: {
        'dataBinMethod' ? : "STATIC" | "DYNAMIC",
        'genericAssayDataBinCountFilter' ? : GenericAssayDataBinCountFilter,
        $queryParameters ? : any,
            $domain ? : string
    }): Promise < request.Response > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        const errorHandlers = this.errorHandlers;
        const request = this.request;
        let path = '/api/generic-assay-data-bin-counts/fetch';
        let body: any;
        let queryParameters: any = {};
        let headers: any = {};
        let form: any = {};
        return new Promise(function(resolve, reject) {
            headers['Accept'] = 'application/json';
            headers['Content-Type'] = 'application/json';

            if (parameters['dataBinMethod'] !== undefined) {
                queryParameters['dataBinMethod'] = parameters['dataBinMethod'];
            }

            if (parameters['genericAssayDataBinCountFilter'] !== undefined) {
                body = parameters['genericAssayDataBinCountFilter'];
            }

            if (parameters.$queryParameters) {
                Object.keys(parameters.$queryParameters).forEach(function(parameterName) {
                    var parameter = parameters.$queryParameters[parameterName];
                    queryParameters[parameterName] = parameter;
                });
            }

            request('POST', domain + path, body, headers, queryParameters, form, reject, resolve, errorHandlers);

        });
    };

    /**
     * Fetch generic assay data bin counts by study view filter
     * @method
     * @name CBioPortalAPIInternal#fetchGenericAssayDataBinCountsUsingPOST
     * @param {string} dataBinMethod - Method for data binning
     * @param {} genericAssayDataBinCountFilter - A web service for supplying JSON formatted data to cBioPortal clients. Please note that this API is currently in beta and subject to change.
     */
    fetchGenericAssayDataBinCountsUsingPOST(parameters: {
            'dataBinMethod' ? : "STATIC" | "DYNAMIC",
            'genericAssayDataBinCountFilter' ? : GenericAssayDataBinCountFilter,
            $queryParameters ? : any,
                $domain ? : string
        }): Promise < Array < GenericAssayDataBin >
        > {
            return this.fetchGenericAssayDataBinCountsUsingPOSTWithHttpInfo(parameters).then(function(response: request.Response) {
                return response.body;
            });
        };
    fetchGenericAssayDataCountsUsingPOSTURL(parameters: {
        'genericAssayDataCountFilter' ? : GenericAssayDataCountFilter,
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/api/generic-assay-data-counts/fetch';

        if (parameters.$queryParameters) {
            Object.keys(parameters.$queryParameters).forEach(function(parameterName) {
                var parameter = parameters.$queryParameters[parameterName];
                queryParameters[parameterName] = parameter;
            });
        }
        let keys = Object.keys(queryParameters);
        return this.domain + path + (keys.length > 0 ? '?' + (keys.map(key => key + '=' + encodeURIComponent(queryParameters[key])).join('&')) : '');
    };

    /**
     * Fetch generic assay data counts by study view filter
     * @method
     * @name CBioPortalAPIInternal#fetchGenericAssayDataCountsUsingPOST
     * @param {} genericAssayDataCountFilter - A web service for supplying JSON formatted data to cBioPortal clients. Please note that this API is currently in beta and subject to change.
     */
    fetchGenericAssayDataCountsUsingPOSTWithHttpInfo(parameters: {
        'genericAssayDataCountFilter' ? : GenericAssayDataCountFilter,
        $queryParameters ? : any,
            $domain ? : string
    }): Promise < request.Response > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        const errorHandlers = this.errorHandlers;
        const request = this.request;
        let path = '/api/generic-assay-data-counts/fetch';
        let body: any;
        let queryParameters: any = {};
        let headers: any = {};
        let form: any = {};
        return new Promise(function(resolve, reject) {
            headers['Accept'] = 'application/json';
            headers['Content-Type'] = 'application/json';

            if (parameters['genericAssayDataCountFilter'] !== undefined) {
                body = parameters['genericAssayDataCountFilter'];
            }

            if (parameters.$queryParameters) {
                Object.keys(parameters.$queryParameters).forEach(function(parameterName) {
                    var parameter = parameters.$queryParameters[parameterName];
                    queryParameters[parameterName] = parameter;
                });
            }

            request('POST', domain + path, body, headers, queryParameters, form, reject, resolve, errorHandlers);

        });
    };

    /**
     * Fetch generic assay data counts by study view filter
     * @method
     * @name CBioPortalAPIInternal#fetchGenericAssayDataCountsUsingPOST
     * @param {} genericAssayDataCountFilter - A web service for supplying JSON formatted data to cBioPortal clients. Please note that this API is currently in beta and subject to change.
     */
    fetchGenericAssayDataCountsUsingPOST(parameters: {
            'genericAssayDataCountFilter' ? : GenericAssayDataCountFilter,
            $queryParameters ? : any,
                $domain ? : string
        }): Promise < Array < GenericAssayDataCountItem >
        > {
            return this.fetchGenericAssayDataCountsUsingPOSTWithHttpInfo(parameters).then(function(response: request.Response) {
                return response.body;
            });
        };
    fetchGenericAssayEnrichmentsUsingPOSTURL(parameters: {
        'enrichmentType' ? : "SAMPLE" | "PATIENT",
        'groupsContainingSampleAndMolecularProfileIdentifiers' ? : Array < MolecularProfileCasesGroupFilter > ,
            $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/api/generic-assay-enrichments/fetch';
        if (parameters['enrichmentType'] !== undefined) {
            queryParameters['enrichmentType'] = parameters['enrichmentType'];
        }

        if (parameters.$queryParameters) {
            Object.keys(parameters.$queryParameters).forEach(function(parameterName) {
                var parameter = parameters.$queryParameters[parameterName];
                queryParameters[parameterName] = parameter;
            });
        }
        let keys = Object.keys(queryParameters);
        return this.domain + path + (keys.length > 0 ? '?' + (keys.map(key => key + '=' + encodeURIComponent(queryParameters[key])).join('&')) : '');
    };

    /**
     * Fetch generic assay enrichments in a molecular profile
     * @method
     * @name CBioPortalAPIInternal#fetchGenericAssayEnrichmentsUsingPOST
     * @param {string} enrichmentType - Type of the enrichment e.g. SAMPLE or PATIENT
     * @param {} groupsContainingSampleAndMolecularProfileIdentifiers - A web service for supplying JSON formatted data to cBioPortal clients. Please note that this API is currently in beta and subject to change.
     */
    fetchGenericAssayEnrichmentsUsingPOSTWithHttpInfo(parameters: {
        'enrichmentType' ? : "SAMPLE" | "PATIENT",
        'groupsContainingSampleAndMolecularProfileIdentifiers' ? : Array < MolecularProfileCasesGroupFilter > ,
            $queryParameters ? : any,
            $domain ? : string
    }): Promise < request.Response > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        const errorHandlers = this.errorHandlers;
        const request = this.request;
        let path = '/api/generic-assay-enrichments/fetch';
        let body: any;
        let queryParameters: any = {};
        let headers: any = {};
        let form: any = {};
        return new Promise(function(resolve, reject) {
            headers['Accept'] = 'application/json';
            headers['Content-Type'] = 'application/json';

            if (parameters['enrichmentType'] !== undefined) {
                queryParameters['enrichmentType'] = parameters['enrichmentType'];
            }

            if (parameters['groupsContainingSampleAndMolecularProfileIdentifiers'] !== undefined) {
                body = parameters['groupsContainingSampleAndMolecularProfileIdentifiers'];
            }

            if (parameters.$queryParameters) {
                Object.keys(parameters.$queryParameters).forEach(function(parameterName) {
                    var parameter = parameters.$queryParameters[parameterName];
                    queryParameters[parameterName] = parameter;
                });
            }

            request('POST', domain + path, body, headers, queryParameters, form, reject, resolve, errorHandlers);

        });
    };

    /**
     * Fetch generic assay enrichments in a molecular profile
     * @method
     * @name CBioPortalAPIInternal#fetchGenericAssayEnrichmentsUsingPOST
     * @param {string} enrichmentType - Type of the enrichment e.g. SAMPLE or PATIENT
     * @param {} groupsContainingSampleAndMolecularProfileIdentifiers - A web service for supplying JSON formatted data to cBioPortal clients. Please note that this API is currently in beta and subject to change.
     */
    fetchGenericAssayEnrichmentsUsingPOST(parameters: {
            'enrichmentType' ? : "SAMPLE" | "PATIENT",
            'groupsContainingSampleAndMolecularProfileIdentifiers' ? : Array < MolecularProfileCasesGroupFilter > ,
                $queryParameters ? : any,
                $domain ? : string
        }): Promise < Array < GenericAssayEnrichment >
        > {
            return this.fetchGenericAssayEnrichmentsUsingPOSTWithHttpInfo(parameters).then(function(response: request.Response) {
                return response.body;
            });
        };
    fetchGenesetHierarchyInfoUsingPOSTURL(parameters: {
        'geneticProfileId': string,
        'percentile' ? : number,
        'scoreThreshold' ? : number,
        'pvalueThreshold' ? : number,
        'sampleListId' ? : string,
        'fillThisOneIfYouWantToSpecifyASubsetOfSamplesSampleidsCustomListOfSamplesOrPatientsToQueryEgTcgaA1A0Sd01TcgaA1A0Se01' ? : Array < string > ,
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/api/geneset-hierarchy/fetch';
        if (parameters['geneticProfileId'] !== undefined) {
            queryParameters['geneticProfileId'] = parameters['geneticProfileId'];
        }

        if (parameters['percentile'] !== undefined) {
            queryParameters['percentile'] = parameters['percentile'];
        }

        if (parameters['scoreThreshold'] !== undefined) {
            queryParameters['scoreThreshold'] = parameters['scoreThreshold'];
        }

        if (parameters['pvalueThreshold'] !== undefined) {
            queryParameters['pvalueThreshold'] = parameters['pvalueThreshold'];
        }

        if (parameters['sampleListId'] !== undefined) {
            queryParameters['sampleListId'] = parameters['sampleListId'];
        }

        if (parameters.$queryParameters) {
            Object.keys(parameters.$queryParameters).forEach(function(parameterName) {
                var parameter = parameters.$queryParameters[parameterName];
                queryParameters[parameterName] = parameter;
            });
        }
        let keys = Object.keys(queryParameters);
        return this.domain + path + (keys.length > 0 ? '?' + (keys.map(key => key + '=' + encodeURIComponent(queryParameters[key])).join('&')) : '');
    };

    /**
     * Get gene set hierarchical organization information. I.e. how different gene sets relate to other gene sets, in a hierarchy
     * @method
     * @name CBioPortalAPIInternal#fetchGenesetHierarchyInfoUsingPOST
     * @param {string} geneticProfileId - Genetic Profile ID e.g. gbm_tcga_gsva_scores. The final hierarchy  will only include gene sets scored in the specified profile.
     * @param {integer} percentile - Percentile (for score calculation). Which percentile to use when determining the *representative score*
     * @param {number} scoreThreshold - Gene set score threshold (for absolute score value). Filters out gene sets where the GSVA(like) *representative score* is under this threshold.
     * @param {number} pvalueThreshold - p-value threshold. Filters out gene sets for which the score p-value is higher than this threshold.
     * @param {string} sampleListId - Identifier of pre-defined sample list with samples to query, e.g. brca_tcga_all
     * @param {} fillThisOneIfYouWantToSpecifyASubsetOfSamplesSampleidsCustomListOfSamplesOrPatientsToQueryEgTcgaA1A0Sd01TcgaA1A0Se01 - A web service for supplying JSON formatted data to cBioPortal clients. Please note that this API is currently in beta and subject to change.
     */
    fetchGenesetHierarchyInfoUsingPOSTWithHttpInfo(parameters: {
        'geneticProfileId': string,
        'percentile' ? : number,
        'scoreThreshold' ? : number,
        'pvalueThreshold' ? : number,
        'sampleListId' ? : string,
        'fillThisOneIfYouWantToSpecifyASubsetOfSamplesSampleidsCustomListOfSamplesOrPatientsToQueryEgTcgaA1A0Sd01TcgaA1A0Se01' ? : Array < string > ,
        $queryParameters ? : any,
        $domain ? : string
    }): Promise < request.Response > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        const errorHandlers = this.errorHandlers;
        const request = this.request;
        let path = '/api/geneset-hierarchy/fetch';
        let body: any;
        let queryParameters: any = {};
        let headers: any = {};
        let form: any = {};
        return new Promise(function(resolve, reject) {
            headers['Accept'] = 'application/json';
            headers['Content-Type'] = 'application/json';

            if (parameters['geneticProfileId'] !== undefined) {
                queryParameters['geneticProfileId'] = parameters['geneticProfileId'];
            }

            if (parameters['geneticProfileId'] === undefined) {
                reject(new Error('Missing required  parameter: geneticProfileId'));
                return;
            }

            if (parameters['percentile'] !== undefined) {
                queryParameters['percentile'] = parameters['percentile'];
            }

            if (parameters['scoreThreshold'] !== undefined) {
                queryParameters['scoreThreshold'] = parameters['scoreThreshold'];
            }

            if (parameters['pvalueThreshold'] !== undefined) {
                queryParameters['pvalueThreshold'] = parameters['pvalueThreshold'];
            }

            if (parameters['sampleListId'] !== undefined) {
                queryParameters['sampleListId'] = parameters['sampleListId'];
            }

            if (parameters['fillThisOneIfYouWantToSpecifyASubsetOfSamplesSampleidsCustomListOfSamplesOrPatientsToQueryEgTcgaA1A0Sd01TcgaA1A0Se01'] !== undefined) {
                body = parameters['fillThisOneIfYouWantToSpecifyASubsetOfSamplesSampleidsCustomListOfSamplesOrPatientsToQueryEgTcgaA1A0Sd01TcgaA1A0Se01'];
            }

            if (parameters.$queryParameters) {
                Object.keys(parameters.$queryParameters).forEach(function(parameterName) {
                    var parameter = parameters.$queryParameters[parameterName];
                    queryParameters[parameterName] = parameter;
                });
            }

            request('POST', domain + path, body, headers, queryParameters, form, reject, resolve, errorHandlers);

        });
    };

    /**
     * Get gene set hierarchical organization information. I.e. how different gene sets relate to other gene sets, in a hierarchy
     * @method
     * @name CBioPortalAPIInternal#fetchGenesetHierarchyInfoUsingPOST
     * @param {string} geneticProfileId - Genetic Profile ID e.g. gbm_tcga_gsva_scores. The final hierarchy  will only include gene sets scored in the specified profile.
     * @param {integer} percentile - Percentile (for score calculation). Which percentile to use when determining the *representative score*
     * @param {number} scoreThreshold - Gene set score threshold (for absolute score value). Filters out gene sets where the GSVA(like) *representative score* is under this threshold.
     * @param {number} pvalueThreshold - p-value threshold. Filters out gene sets for which the score p-value is higher than this threshold.
     * @param {string} sampleListId - Identifier of pre-defined sample list with samples to query, e.g. brca_tcga_all
     * @param {} fillThisOneIfYouWantToSpecifyASubsetOfSamplesSampleidsCustomListOfSamplesOrPatientsToQueryEgTcgaA1A0Sd01TcgaA1A0Se01 - A web service for supplying JSON formatted data to cBioPortal clients. Please note that this API is currently in beta and subject to change.
     */
    fetchGenesetHierarchyInfoUsingPOST(parameters: {
            'geneticProfileId': string,
            'percentile' ? : number,
            'scoreThreshold' ? : number,
            'pvalueThreshold' ? : number,
            'sampleListId' ? : string,
            'fillThisOneIfYouWantToSpecifyASubsetOfSamplesSampleidsCustomListOfSamplesOrPatientsToQueryEgTcgaA1A0Sd01TcgaA1A0Se01' ? : Array < string > ,
            $queryParameters ? : any,
            $domain ? : string
        }): Promise < Array < GenesetHierarchyInfo >
        > {
            return this.fetchGenesetHierarchyInfoUsingPOSTWithHttpInfo(parameters).then(function(response: request.Response) {
                return response.body;
            });
        };
    getAllGenesetsUsingGETURL(parameters: {
        'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
        'pageSize' ? : number,
        'pageNumber' ? : number,
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/api/genesets';
        if (parameters['projection'] !== undefined) {
            queryParameters['projection'] = parameters['projection'];
        }

        if (parameters['pageSize'] !== undefined) {
            queryParameters['pageSize'] = parameters['pageSize'];
        }

        if (parameters['pageNumber'] !== undefined) {
            queryParameters['pageNumber'] = parameters['pageNumber'];
        }

        if (parameters.$queryParameters) {
            Object.keys(parameters.$queryParameters).forEach(function(parameterName) {
                var parameter = parameters.$queryParameters[parameterName];
                queryParameters[parameterName] = parameter;
            });
        }
        let keys = Object.keys(queryParameters);
        return this.domain + path + (keys.length > 0 ? '?' + (keys.map(key => key + '=' + encodeURIComponent(queryParameters[key])).join('&')) : '');
    };

    /**
     * Get all gene sets
     * @method
     * @name CBioPortalAPIInternal#getAllGenesetsUsingGET
     * @param {string} projection - Level of detail of the response
     * @param {integer} pageSize - Page size of the result list
     * @param {integer} pageNumber - Page number of the result list
     */
    getAllGenesetsUsingGETWithHttpInfo(parameters: {
        'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
        'pageSize' ? : number,
        'pageNumber' ? : number,
        $queryParameters ? : any,
            $domain ? : string
    }): Promise < request.Response > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        const errorHandlers = this.errorHandlers;
        const request = this.request;
        let path = '/api/genesets';
        let body: any;
        let queryParameters: any = {};
        let headers: any = {};
        let form: any = {};
        return new Promise(function(resolve, reject) {
            headers['Accept'] = 'application/json';

            if (parameters['projection'] !== undefined) {
                queryParameters['projection'] = parameters['projection'];
            }

            if (parameters['pageSize'] !== undefined) {
                queryParameters['pageSize'] = parameters['pageSize'];
            }

            if (parameters['pageNumber'] !== undefined) {
                queryParameters['pageNumber'] = parameters['pageNumber'];
            }

            if (parameters.$queryParameters) {
                Object.keys(parameters.$queryParameters).forEach(function(parameterName) {
                    var parameter = parameters.$queryParameters[parameterName];
                    queryParameters[parameterName] = parameter;
                });
            }

            request('GET', domain + path, body, headers, queryParameters, form, reject, resolve, errorHandlers);

        });
    };

    /**
     * Get all gene sets
     * @method
     * @name CBioPortalAPIInternal#getAllGenesetsUsingGET
     * @param {string} projection - Level of detail of the response
     * @param {integer} pageSize - Page size of the result list
     * @param {integer} pageNumber - Page number of the result list
     */
    getAllGenesetsUsingGET(parameters: {
            'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
            'pageSize' ? : number,
            'pageNumber' ? : number,
            $queryParameters ? : any,
                $domain ? : string
        }): Promise < Array < Geneset >
        > {
            return this.getAllGenesetsUsingGETWithHttpInfo(parameters).then(function(response: request.Response) {
                return response.body;
            });
        };
    fetchGenesetsUsingPOSTURL(parameters: {
        'genesetIds': Array < string > ,
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/api/genesets/fetch';

        if (parameters.$queryParameters) {
            Object.keys(parameters.$queryParameters).forEach(function(parameterName) {
                var parameter = parameters.$queryParameters[parameterName];
                queryParameters[parameterName] = parameter;
            });
        }
        let keys = Object.keys(queryParameters);
        return this.domain + path + (keys.length > 0 ? '?' + (keys.map(key => key + '=' + encodeURIComponent(queryParameters[key])).join('&')) : '');
    };

    /**
     * Fetch gene sets by ID
     * @method
     * @name CBioPortalAPIInternal#fetchGenesetsUsingPOST
     * @param {} genesetIds - A web service for supplying JSON formatted data to cBioPortal clients. Please note that this API is currently in beta and subject to change.
     */
    fetchGenesetsUsingPOSTWithHttpInfo(parameters: {
        'genesetIds': Array < string > ,
        $queryParameters ? : any,
        $domain ? : string
    }): Promise < request.Response > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        const errorHandlers = this.errorHandlers;
        const request = this.request;
        let path = '/api/genesets/fetch';
        let body: any;
        let queryParameters: any = {};
        let headers: any = {};
        let form: any = {};
        return new Promise(function(resolve, reject) {
            headers['Accept'] = 'application/json';
            headers['Content-Type'] = 'application/json';

            if (parameters['genesetIds'] !== undefined) {
                body = parameters['genesetIds'];
            }

            if (parameters['genesetIds'] === undefined) {
                reject(new Error('Missing required  parameter: genesetIds'));
                return;
            }

            if (parameters.$queryParameters) {
                Object.keys(parameters.$queryParameters).forEach(function(parameterName) {
                    var parameter = parameters.$queryParameters[parameterName];
                    queryParameters[parameterName] = parameter;
                });
            }

            request('POST', domain + path, body, headers, queryParameters, form, reject, resolve, errorHandlers);

        });
    };

    /**
     * Fetch gene sets by ID
     * @method
     * @name CBioPortalAPIInternal#fetchGenesetsUsingPOST
     * @param {} genesetIds - A web service for supplying JSON formatted data to cBioPortal clients. Please note that this API is currently in beta and subject to change.
     */
    fetchGenesetsUsingPOST(parameters: {
            'genesetIds': Array < string > ,
            $queryParameters ? : any,
            $domain ? : string
        }): Promise < Array < Geneset >
        > {
            return this.fetchGenesetsUsingPOSTWithHttpInfo(parameters).then(function(response: request.Response) {
                return response.body;
            });
        };
    getGenesetVersionUsingGETURL(parameters: {
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/api/genesets/version';

        if (parameters.$queryParameters) {
            Object.keys(parameters.$queryParameters).forEach(function(parameterName) {
                var parameter = parameters.$queryParameters[parameterName];
                queryParameters[parameterName] = parameter;
            });
        }
        let keys = Object.keys(queryParameters);
        return this.domain + path + (keys.length > 0 ? '?' + (keys.map(key => key + '=' + encodeURIComponent(queryParameters[key])).join('&')) : '');
    };

    /**
     * Get the geneset version
     * @method
     * @name CBioPortalAPIInternal#getGenesetVersionUsingGET
     */
    getGenesetVersionUsingGETWithHttpInfo(parameters: {
        $queryParameters ? : any,
            $domain ? : string
    }): Promise < request.Response > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        const errorHandlers = this.errorHandlers;
        const request = this.request;
        let path = '/api/genesets/version';
        let body: any;
        let queryParameters: any = {};
        let headers: any = {};
        let form: any = {};
        return new Promise(function(resolve, reject) {
            headers['Accept'] = 'application/json';

            if (parameters.$queryParameters) {
                Object.keys(parameters.$queryParameters).forEach(function(parameterName) {
                    var parameter = parameters.$queryParameters[parameterName];
                    queryParameters[parameterName] = parameter;
                });
            }

            request('GET', domain + path, body, headers, queryParameters, form, reject, resolve, errorHandlers);

        });
    };

    /**
     * Get the geneset version
     * @method
     * @name CBioPortalAPIInternal#getGenesetVersionUsingGET
     */
    getGenesetVersionUsingGET(parameters: {
        $queryParameters ? : any,
            $domain ? : string
    }): Promise < string > {
        return this.getGenesetVersionUsingGETWithHttpInfo(parameters).then(function(response: request.Response) {
            return response.body;
        });
    };
    getGenesetUsingGETURL(parameters: {
        'genesetId': string,
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/api/genesets/{genesetId}';

        path = path.replace('{genesetId}', parameters['genesetId'] + '');

        if (parameters.$queryParameters) {
            Object.keys(parameters.$queryParameters).forEach(function(parameterName) {
                var parameter = parameters.$queryParameters[parameterName];
                queryParameters[parameterName] = parameter;
            });
        }
        let keys = Object.keys(queryParameters);
        return this.domain + path + (keys.length > 0 ? '?' + (keys.map(key => key + '=' + encodeURIComponent(queryParameters[key])).join('&')) : '');
    };

    /**
     * Get a gene set
     * @method
     * @name CBioPortalAPIInternal#getGenesetUsingGET
     * @param {string} genesetId - Gene set ID e.g. GNF2_ZAP70
     */
    getGenesetUsingGETWithHttpInfo(parameters: {
        'genesetId': string,
        $queryParameters ? : any,
        $domain ? : string
    }): Promise < request.Response > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        const errorHandlers = this.errorHandlers;
        const request = this.request;
        let path = '/api/genesets/{genesetId}';
        let body: any;
        let queryParameters: any = {};
        let headers: any = {};
        let form: any = {};
        return new Promise(function(resolve, reject) {
            headers['Accept'] = 'application/json';

            path = path.replace('{genesetId}', parameters['genesetId'] + '');

            if (parameters['genesetId'] === undefined) {
                reject(new Error('Missing required  parameter: genesetId'));
                return;
            }

            if (parameters.$queryParameters) {
                Object.keys(parameters.$queryParameters).forEach(function(parameterName) {
                    var parameter = parameters.$queryParameters[parameterName];
                    queryParameters[parameterName] = parameter;
                });
            }

            request('GET', domain + path, body, headers, queryParameters, form, reject, resolve, errorHandlers);

        });
    };

    /**
     * Get a gene set
     * @method
     * @name CBioPortalAPIInternal#getGenesetUsingGET
     * @param {string} genesetId - Gene set ID e.g. GNF2_ZAP70
     */
    getGenesetUsingGET(parameters: {
        'genesetId': string,
        $queryParameters ? : any,
        $domain ? : string
    }): Promise < Geneset > {
        return this.getGenesetUsingGETWithHttpInfo(parameters).then(function(response: request.Response) {
            return response.body;
        });
    };
    fetchCorrelatedGenesUsingPOSTURL(parameters: {
        'genesetId': string,
        'geneticProfileId': string,
        'correlationThreshold' ? : number,
        'sampleListId' ? : string,
        'fillThisOneIfYouWantToSpecifyASubsetOfSamplesSampleidsCustomListOfSamplesOrPatientsToQueryEgTcgaA1A0Sd01TcgaA1A0Se01' ? : Array < string > ,
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/api/genesets/{genesetId}/expression-correlation/fetch';

        path = path.replace('{genesetId}', parameters['genesetId'] + '');
        if (parameters['geneticProfileId'] !== undefined) {
            queryParameters['geneticProfileId'] = parameters['geneticProfileId'];
        }

        if (parameters['correlationThreshold'] !== undefined) {
            queryParameters['correlationThreshold'] = parameters['correlationThreshold'];
        }

        if (parameters['sampleListId'] !== undefined) {
            queryParameters['sampleListId'] = parameters['sampleListId'];
        }

        if (parameters.$queryParameters) {
            Object.keys(parameters.$queryParameters).forEach(function(parameterName) {
                var parameter = parameters.$queryParameters[parameterName];
                queryParameters[parameterName] = parameter;
            });
        }
        let keys = Object.keys(queryParameters);
        return this.domain + path + (keys.length > 0 ? '?' + (keys.map(key => key + '=' + encodeURIComponent(queryParameters[key])).join('&')) : '');
    };

    /**
     * Get the genes in a gene set that have expression correlated to the gene set scores (calculated using Spearman's correlation)
     * @method
     * @name CBioPortalAPIInternal#fetchCorrelatedGenesUsingPOST
     * @param {string} genesetId - Gene set ID, e.g. HINATA_NFKB_MATRIX.
     * @param {string} geneticProfileId - Genetic Profile ID e.g. gbm_tcga_gsva_scores
     * @param {number} correlationThreshold - Correlation threshold (for absolute correlation value, Spearman correlation)
     * @param {string} sampleListId - Identifier of pre-defined sample list with samples to query, e.g. brca_tcga_all
     * @param {} fillThisOneIfYouWantToSpecifyASubsetOfSamplesSampleidsCustomListOfSamplesOrPatientsToQueryEgTcgaA1A0Sd01TcgaA1A0Se01 - A web service for supplying JSON formatted data to cBioPortal clients. Please note that this API is currently in beta and subject to change.
     */
    fetchCorrelatedGenesUsingPOSTWithHttpInfo(parameters: {
        'genesetId': string,
        'geneticProfileId': string,
        'correlationThreshold' ? : number,
        'sampleListId' ? : string,
        'fillThisOneIfYouWantToSpecifyASubsetOfSamplesSampleidsCustomListOfSamplesOrPatientsToQueryEgTcgaA1A0Sd01TcgaA1A0Se01' ? : Array < string > ,
        $queryParameters ? : any,
        $domain ? : string
    }): Promise < request.Response > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        const errorHandlers = this.errorHandlers;
        const request = this.request;
        let path = '/api/genesets/{genesetId}/expression-correlation/fetch';
        let body: any;
        let queryParameters: any = {};
        let headers: any = {};
        let form: any = {};
        return new Promise(function(resolve, reject) {
            headers['Accept'] = 'application/json';
            headers['Content-Type'] = 'application/json';

            path = path.replace('{genesetId}', parameters['genesetId'] + '');

            if (parameters['genesetId'] === undefined) {
                reject(new Error('Missing required  parameter: genesetId'));
                return;
            }

            if (parameters['geneticProfileId'] !== undefined) {
                queryParameters['geneticProfileId'] = parameters['geneticProfileId'];
            }

            if (parameters['geneticProfileId'] === undefined) {
                reject(new Error('Missing required  parameter: geneticProfileId'));
                return;
            }

            if (parameters['correlationThreshold'] !== undefined) {
                queryParameters['correlationThreshold'] = parameters['correlationThreshold'];
            }

            if (parameters['sampleListId'] !== undefined) {
                queryParameters['sampleListId'] = parameters['sampleListId'];
            }

            if (parameters['fillThisOneIfYouWantToSpecifyASubsetOfSamplesSampleidsCustomListOfSamplesOrPatientsToQueryEgTcgaA1A0Sd01TcgaA1A0Se01'] !== undefined) {
                body = parameters['fillThisOneIfYouWantToSpecifyASubsetOfSamplesSampleidsCustomListOfSamplesOrPatientsToQueryEgTcgaA1A0Sd01TcgaA1A0Se01'];
            }

            if (parameters.$queryParameters) {
                Object.keys(parameters.$queryParameters).forEach(function(parameterName) {
                    var parameter = parameters.$queryParameters[parameterName];
                    queryParameters[parameterName] = parameter;
                });
            }

            request('POST', domain + path, body, headers, queryParameters, form, reject, resolve, errorHandlers);

        });
    };

    /**
     * Get the genes in a gene set that have expression correlated to the gene set scores (calculated using Spearman's correlation)
     * @method
     * @name CBioPortalAPIInternal#fetchCorrelatedGenesUsingPOST
     * @param {string} genesetId - Gene set ID, e.g. HINATA_NFKB_MATRIX.
     * @param {string} geneticProfileId - Genetic Profile ID e.g. gbm_tcga_gsva_scores
     * @param {number} correlationThreshold - Correlation threshold (for absolute correlation value, Spearman correlation)
     * @param {string} sampleListId - Identifier of pre-defined sample list with samples to query, e.g. brca_tcga_all
     * @param {} fillThisOneIfYouWantToSpecifyASubsetOfSamplesSampleidsCustomListOfSamplesOrPatientsToQueryEgTcgaA1A0Sd01TcgaA1A0Se01 - A web service for supplying JSON formatted data to cBioPortal clients. Please note that this API is currently in beta and subject to change.
     */
    fetchCorrelatedGenesUsingPOST(parameters: {
            'genesetId': string,
            'geneticProfileId': string,
            'correlationThreshold' ? : number,
            'sampleListId' ? : string,
            'fillThisOneIfYouWantToSpecifyASubsetOfSamplesSampleidsCustomListOfSamplesOrPatientsToQueryEgTcgaA1A0Sd01TcgaA1A0Se01' ? : Array < string > ,
            $queryParameters ? : any,
            $domain ? : string
        }): Promise < Array < GenesetCorrelation >
        > {
            return this.fetchCorrelatedGenesUsingPOSTWithHttpInfo(parameters).then(function(response: request.Response) {
                return response.body;
            });
        };
    fetchGeneticDataItemsUsingPOSTURL(parameters: {
        'geneticProfileId': string,
        'genesetDataFilterCriteria': GenesetDataFilterCriteria,
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/api/genetic-profiles/{geneticProfileId}/geneset-genetic-data/fetch';

        path = path.replace('{geneticProfileId}', parameters['geneticProfileId'] + '');

        if (parameters.$queryParameters) {
            Object.keys(parameters.$queryParameters).forEach(function(parameterName) {
                var parameter = parameters.$queryParameters[parameterName];
                queryParameters[parameterName] = parameter;
            });
        }
        let keys = Object.keys(queryParameters);
        return this.domain + path + (keys.length > 0 ? '?' + (keys.map(key => key + '=' + encodeURIComponent(queryParameters[key])).join('&')) : '');
    };

    /**
     * Fetch gene set "genetic data" items (gene set scores) by profile Id, gene set ids and sample ids
     * @method
     * @name CBioPortalAPIInternal#fetchGeneticDataItemsUsingPOST
     * @param {string} geneticProfileId - Genetic profile ID, e.g. gbm_tcga_gsva_scores
     * @param {} genesetDataFilterCriteria - A web service for supplying JSON formatted data to cBioPortal clients. Please note that this API is currently in beta and subject to change.
     */
    fetchGeneticDataItemsUsingPOSTWithHttpInfo(parameters: {
        'geneticProfileId': string,
        'genesetDataFilterCriteria': GenesetDataFilterCriteria,
        $queryParameters ? : any,
        $domain ? : string
    }): Promise < request.Response > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        const errorHandlers = this.errorHandlers;
        const request = this.request;
        let path = '/api/genetic-profiles/{geneticProfileId}/geneset-genetic-data/fetch';
        let body: any;
        let queryParameters: any = {};
        let headers: any = {};
        let form: any = {};
        return new Promise(function(resolve, reject) {
            headers['Accept'] = 'application/json';
            headers['Content-Type'] = 'application/json';

            path = path.replace('{geneticProfileId}', parameters['geneticProfileId'] + '');

            if (parameters['geneticProfileId'] === undefined) {
                reject(new Error('Missing required  parameter: geneticProfileId'));
                return;
            }

            if (parameters['genesetDataFilterCriteria'] !== undefined) {
                body = parameters['genesetDataFilterCriteria'];
            }

            if (parameters['genesetDataFilterCriteria'] === undefined) {
                reject(new Error('Missing required  parameter: genesetDataFilterCriteria'));
                return;
            }

            if (parameters.$queryParameters) {
                Object.keys(parameters.$queryParameters).forEach(function(parameterName) {
                    var parameter = parameters.$queryParameters[parameterName];
                    queryParameters[parameterName] = parameter;
                });
            }

            request('POST', domain + path, body, headers, queryParameters, form, reject, resolve, errorHandlers);

        });
    };

    /**
     * Fetch gene set "genetic data" items (gene set scores) by profile Id, gene set ids and sample ids
     * @method
     * @name CBioPortalAPIInternal#fetchGeneticDataItemsUsingPOST
     * @param {string} geneticProfileId - Genetic profile ID, e.g. gbm_tcga_gsva_scores
     * @param {} genesetDataFilterCriteria - A web service for supplying JSON formatted data to cBioPortal clients. Please note that this API is currently in beta and subject to change.
     */
    fetchGeneticDataItemsUsingPOST(parameters: {
            'geneticProfileId': string,
            'genesetDataFilterCriteria': GenesetDataFilterCriteria,
            $queryParameters ? : any,
            $domain ? : string
        }): Promise < Array < GenesetMolecularData >
        > {
            return this.fetchGeneticDataItemsUsingPOSTWithHttpInfo(parameters).then(function(response: request.Response) {
                return response.body;
            });
        };
    fetchGenomicDataBinCountsUsingPOSTURL(parameters: {
        'dataBinMethod' ? : "STATIC" | "DYNAMIC",
        'genomicDataBinCountFilter' ? : GenomicDataBinCountFilter,
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/api/genomic-data-bin-counts/fetch';
        if (parameters['dataBinMethod'] !== undefined) {
            queryParameters['dataBinMethod'] = parameters['dataBinMethod'];
        }

        if (parameters.$queryParameters) {
            Object.keys(parameters.$queryParameters).forEach(function(parameterName) {
                var parameter = parameters.$queryParameters[parameterName];
                queryParameters[parameterName] = parameter;
            });
        }
        let keys = Object.keys(queryParameters);
        return this.domain + path + (keys.length > 0 ? '?' + (keys.map(key => key + '=' + encodeURIComponent(queryParameters[key])).join('&')) : '');
    };

    /**
     * Fetch genomic data bin counts by study view filter
     * @method
     * @name CBioPortalAPIInternal#fetchGenomicDataBinCountsUsingPOST
     * @param {string} dataBinMethod - Method for data binning
     * @param {} genomicDataBinCountFilter - A web service for supplying JSON formatted data to cBioPortal clients. Please note that this API is currently in beta and subject to change.
     */
    fetchGenomicDataBinCountsUsingPOSTWithHttpInfo(parameters: {
        'dataBinMethod' ? : "STATIC" | "DYNAMIC",
        'genomicDataBinCountFilter' ? : GenomicDataBinCountFilter,
        $queryParameters ? : any,
            $domain ? : string
    }): Promise < request.Response > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        const errorHandlers = this.errorHandlers;
        const request = this.request;
        let path = '/api/genomic-data-bin-counts/fetch';
        let body: any;
        let queryParameters: any = {};
        let headers: any = {};
        let form: any = {};
        return new Promise(function(resolve, reject) {
            headers['Accept'] = 'application/json';
            headers['Content-Type'] = 'application/json';

            if (parameters['dataBinMethod'] !== undefined) {
                queryParameters['dataBinMethod'] = parameters['dataBinMethod'];
            }

            if (parameters['genomicDataBinCountFilter'] !== undefined) {
                body = parameters['genomicDataBinCountFilter'];
            }

            if (parameters.$queryParameters) {
                Object.keys(parameters.$queryParameters).forEach(function(parameterName) {
                    var parameter = parameters.$queryParameters[parameterName];
                    queryParameters[parameterName] = parameter;
                });
            }

            request('POST', domain + path, body, headers, queryParameters, form, reject, resolve, errorHandlers);

        });
    };

    /**
     * Fetch genomic data bin counts by study view filter
     * @method
     * @name CBioPortalAPIInternal#fetchGenomicDataBinCountsUsingPOST
     * @param {string} dataBinMethod - Method for data binning
     * @param {} genomicDataBinCountFilter - A web service for supplying JSON formatted data to cBioPortal clients. Please note that this API is currently in beta and subject to change.
     */
    fetchGenomicDataBinCountsUsingPOST(parameters: {
            'dataBinMethod' ? : "STATIC" | "DYNAMIC",
            'genomicDataBinCountFilter' ? : GenomicDataBinCountFilter,
            $queryParameters ? : any,
                $domain ? : string
        }): Promise < Array < GenomicDataBin >
        > {
            return this.fetchGenomicDataBinCountsUsingPOSTWithHttpInfo(parameters).then(function(response: request.Response) {
                return response.body;
            });
        };
    fetchGenomicDataCountsUsingPOSTURL(parameters: {
        'genomicDataCountFilter' ? : GenomicDataCountFilter,
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/api/genomic-data-counts/fetch';

        if (parameters.$queryParameters) {
            Object.keys(parameters.$queryParameters).forEach(function(parameterName) {
                var parameter = parameters.$queryParameters[parameterName];
                queryParameters[parameterName] = parameter;
            });
        }
        let keys = Object.keys(queryParameters);
        return this.domain + path + (keys.length > 0 ? '?' + (keys.map(key => key + '=' + encodeURIComponent(queryParameters[key])).join('&')) : '');
    };

    /**
     * Fetch genomic data counts by GenomicDataCountFilter
     * @method
     * @name CBioPortalAPIInternal#fetchGenomicDataCountsUsingPOST
     * @param {} genomicDataCountFilter - A web service for supplying JSON formatted data to cBioPortal clients. Please note that this API is currently in beta and subject to change.
     */
    fetchGenomicDataCountsUsingPOSTWithHttpInfo(parameters: {
        'genomicDataCountFilter' ? : GenomicDataCountFilter,
        $queryParameters ? : any,
            $domain ? : string
    }): Promise < request.Response > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        const errorHandlers = this.errorHandlers;
        const request = this.request;
        let path = '/api/genomic-data-counts/fetch';
        let body: any;
        let queryParameters: any = {};
        let headers: any = {};
        let form: any = {};
        return new Promise(function(resolve, reject) {
            headers['Accept'] = 'application/json';
            headers['Content-Type'] = 'application/json';

            if (parameters['genomicDataCountFilter'] !== undefined) {
                body = parameters['genomicDataCountFilter'];
            }

            if (parameters.$queryParameters) {
                Object.keys(parameters.$queryParameters).forEach(function(parameterName) {
                    var parameter = parameters.$queryParameters[parameterName];
                    queryParameters[parameterName] = parameter;
                });
            }

            request('POST', domain + path, body, headers, queryParameters, form, reject, resolve, errorHandlers);

        });
    };

    /**
     * Fetch genomic data counts by GenomicDataCountFilter
     * @method
     * @name CBioPortalAPIInternal#fetchGenomicDataCountsUsingPOST
     * @param {} genomicDataCountFilter - A web service for supplying JSON formatted data to cBioPortal clients. Please note that this API is currently in beta and subject to change.
     */
    fetchGenomicDataCountsUsingPOST(parameters: {
            'genomicDataCountFilter' ? : GenomicDataCountFilter,
            $queryParameters ? : any,
                $domain ? : string
        }): Promise < Array < GenomicDataCountItem >
        > {
            return this.fetchGenomicDataCountsUsingPOSTWithHttpInfo(parameters).then(function(response: request.Response) {
                return response.body;
            });
        };
    fetchMolecularProfileSampleCountsUsingPOSTURL(parameters: {
        'studyViewFilter' ? : StudyViewFilter,
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/api/molecular-profile-sample-counts/fetch';

        if (parameters.$queryParameters) {
            Object.keys(parameters.$queryParameters).forEach(function(parameterName) {
                var parameter = parameters.$queryParameters[parameterName];
                queryParameters[parameterName] = parameter;
            });
        }
        let keys = Object.keys(queryParameters);
        return this.domain + path + (keys.length > 0 ? '?' + (keys.map(key => key + '=' + encodeURIComponent(queryParameters[key])).join('&')) : '');
    };

    /**
     * Fetch sample counts by study view filter
     * @method
     * @name CBioPortalAPIInternal#fetchMolecularProfileSampleCountsUsingPOST
     * @param {} studyViewFilter - A web service for supplying JSON formatted data to cBioPortal clients. Please note that this API is currently in beta and subject to change.
     */
    fetchMolecularProfileSampleCountsUsingPOSTWithHttpInfo(parameters: {
        'studyViewFilter' ? : StudyViewFilter,
        $queryParameters ? : any,
            $domain ? : string
    }): Promise < request.Response > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        const errorHandlers = this.errorHandlers;
        const request = this.request;
        let path = '/api/molecular-profile-sample-counts/fetch';
        let body: any;
        let queryParameters: any = {};
        let headers: any = {};
        let form: any = {};
        return new Promise(function(resolve, reject) {
            headers['Accept'] = 'application/json';
            headers['Content-Type'] = 'application/json';

            if (parameters['studyViewFilter'] !== undefined) {
                body = parameters['studyViewFilter'];
            }

            if (parameters.$queryParameters) {
                Object.keys(parameters.$queryParameters).forEach(function(parameterName) {
                    var parameter = parameters.$queryParameters[parameterName];
                    queryParameters[parameterName] = parameter;
                });
            }

            request('POST', domain + path, body, headers, queryParameters, form, reject, resolve, errorHandlers);

        });
    };

    /**
     * Fetch sample counts by study view filter
     * @method
     * @name CBioPortalAPIInternal#fetchMolecularProfileSampleCountsUsingPOST
     * @param {} studyViewFilter - A web service for supplying JSON formatted data to cBioPortal clients. Please note that this API is currently in beta and subject to change.
     */
    fetchMolecularProfileSampleCountsUsingPOST(parameters: {
            'studyViewFilter' ? : StudyViewFilter,
            $queryParameters ? : any,
                $domain ? : string
        }): Promise < Array < GenomicDataCount >
        > {
            return this.fetchMolecularProfileSampleCountsUsingPOSTWithHttpInfo(parameters).then(function(response: request.Response) {
                return response.body;
            });
        };
    fetchCoExpressionsUsingPOSTURL(parameters: {
        'molecularProfileIdA': string,
        'molecularProfileIdB': string,
        'threshold' ? : number,
        'coExpressionFilter': CoExpressionFilter,
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/api/molecular-profiles/co-expressions/fetch';
        if (parameters['molecularProfileIdA'] !== undefined) {
            queryParameters['molecularProfileIdA'] = parameters['molecularProfileIdA'];
        }

        if (parameters['molecularProfileIdB'] !== undefined) {
            queryParameters['molecularProfileIdB'] = parameters['molecularProfileIdB'];
        }

        if (parameters['threshold'] !== undefined) {
            queryParameters['threshold'] = parameters['threshold'];
        }

        if (parameters.$queryParameters) {
            Object.keys(parameters.$queryParameters).forEach(function(parameterName) {
                var parameter = parameters.$queryParameters[parameterName];
                queryParameters[parameterName] = parameter;
            });
        }
        let keys = Object.keys(queryParameters);
        return this.domain + path + (keys.length > 0 ? '?' + (keys.map(key => key + '=' + encodeURIComponent(queryParameters[key])).join('&')) : '');
    };

    /**
     * Calculates correlations between a genetic entity from a specific profile and another profile from the same study
     * @method
     * @name CBioPortalAPIInternal#fetchCoExpressionsUsingPOST
     * @param {string} molecularProfileIdA - Molecular Profile ID from the Genetic Entity referenced in the co-expression filter e.g. acc_tcga_rna_seq_v2_mrna
     * @param {string} molecularProfileIdB - Molecular Profile ID (can be the same as molecularProfileIdA) e.g. acc_tcga_rna_seq_v2_mrna
     * @param {number} threshold - Threshold
     * @param {} coExpressionFilter - A web service for supplying JSON formatted data to cBioPortal clients. Please note that this API is currently in beta and subject to change.
     */
    fetchCoExpressionsUsingPOSTWithHttpInfo(parameters: {
        'molecularProfileIdA': string,
        'molecularProfileIdB': string,
        'threshold' ? : number,
        'coExpressionFilter': CoExpressionFilter,
        $queryParameters ? : any,
        $domain ? : string
    }): Promise < request.Response > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        const errorHandlers = this.errorHandlers;
        const request = this.request;
        let path = '/api/molecular-profiles/co-expressions/fetch';
        let body: any;
        let queryParameters: any = {};
        let headers: any = {};
        let form: any = {};
        return new Promise(function(resolve, reject) {
            headers['Accept'] = 'application/json';
            headers['Content-Type'] = 'application/json';

            if (parameters['molecularProfileIdA'] !== undefined) {
                queryParameters['molecularProfileIdA'] = parameters['molecularProfileIdA'];
            }

            if (parameters['molecularProfileIdA'] === undefined) {
                reject(new Error('Missing required  parameter: molecularProfileIdA'));
                return;
            }

            if (parameters['molecularProfileIdB'] !== undefined) {
                queryParameters['molecularProfileIdB'] = parameters['molecularProfileIdB'];
            }

            if (parameters['molecularProfileIdB'] === undefined) {
                reject(new Error('Missing required  parameter: molecularProfileIdB'));
                return;
            }

            if (parameters['threshold'] !== undefined) {
                queryParameters['threshold'] = parameters['threshold'];
            }

            if (parameters['coExpressionFilter'] !== undefined) {
                body = parameters['coExpressionFilter'];
            }

            if (parameters['coExpressionFilter'] === undefined) {
                reject(new Error('Missing required  parameter: coExpressionFilter'));
                return;
            }

            if (parameters.$queryParameters) {
                Object.keys(parameters.$queryParameters).forEach(function(parameterName) {
                    var parameter = parameters.$queryParameters[parameterName];
                    queryParameters[parameterName] = parameter;
                });
            }

            request('POST', domain + path, body, headers, queryParameters, form, reject, resolve, errorHandlers);

        });
    };

    /**
     * Calculates correlations between a genetic entity from a specific profile and another profile from the same study
     * @method
     * @name CBioPortalAPIInternal#fetchCoExpressionsUsingPOST
     * @param {string} molecularProfileIdA - Molecular Profile ID from the Genetic Entity referenced in the co-expression filter e.g. acc_tcga_rna_seq_v2_mrna
     * @param {string} molecularProfileIdB - Molecular Profile ID (can be the same as molecularProfileIdA) e.g. acc_tcga_rna_seq_v2_mrna
     * @param {number} threshold - Threshold
     * @param {} coExpressionFilter - A web service for supplying JSON formatted data to cBioPortal clients. Please note that this API is currently in beta and subject to change.
     */
    fetchCoExpressionsUsingPOST(parameters: {
            'molecularProfileIdA': string,
            'molecularProfileIdB': string,
            'threshold' ? : number,
            'coExpressionFilter': CoExpressionFilter,
            $queryParameters ? : any,
            $domain ? : string
        }): Promise < Array < CoExpression >
        > {
            return this.fetchCoExpressionsUsingPOSTWithHttpInfo(parameters).then(function(response: request.Response) {
                return response.body;
            });
        };
    fetchCopyNumberCountsUsingPOSTURL(parameters: {
        'molecularProfileId': string,
        'copyNumberCountIdentifiers': Array < CopyNumberCountIdentifier > ,
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/api/molecular-profiles/{molecularProfileId}/discrete-copy-number-counts/fetch';

        path = path.replace('{molecularProfileId}', parameters['molecularProfileId'] + '');

        if (parameters.$queryParameters) {
            Object.keys(parameters.$queryParameters).forEach(function(parameterName) {
                var parameter = parameters.$queryParameters[parameterName];
                queryParameters[parameterName] = parameter;
            });
        }
        let keys = Object.keys(queryParameters);
        return this.domain + path + (keys.length > 0 ? '?' + (keys.map(key => key + '=' + encodeURIComponent(queryParameters[key])).join('&')) : '');
    };

    /**
     * Get counts of specific genes and alterations within a CNA molecular profile
     * @method
     * @name CBioPortalAPIInternal#fetchCopyNumberCountsUsingPOST
     * @param {string} molecularProfileId - Molecular Profile ID e.g. acc_tcga_gistic
     * @param {} copyNumberCountIdentifiers - A web service for supplying JSON formatted data to cBioPortal clients. Please note that this API is currently in beta and subject to change.
     */
    fetchCopyNumberCountsUsingPOSTWithHttpInfo(parameters: {
        'molecularProfileId': string,
        'copyNumberCountIdentifiers': Array < CopyNumberCountIdentifier > ,
        $queryParameters ? : any,
        $domain ? : string
    }): Promise < request.Response > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        const errorHandlers = this.errorHandlers;
        const request = this.request;
        let path = '/api/molecular-profiles/{molecularProfileId}/discrete-copy-number-counts/fetch';
        let body: any;
        let queryParameters: any = {};
        let headers: any = {};
        let form: any = {};
        return new Promise(function(resolve, reject) {
            headers['Accept'] = 'application/json';
            headers['Content-Type'] = 'application/json';

            path = path.replace('{molecularProfileId}', parameters['molecularProfileId'] + '');

            if (parameters['molecularProfileId'] === undefined) {
                reject(new Error('Missing required  parameter: molecularProfileId'));
                return;
            }

            if (parameters['copyNumberCountIdentifiers'] !== undefined) {
                body = parameters['copyNumberCountIdentifiers'];
            }

            if (parameters['copyNumberCountIdentifiers'] === undefined) {
                reject(new Error('Missing required  parameter: copyNumberCountIdentifiers'));
                return;
            }

            if (parameters.$queryParameters) {
                Object.keys(parameters.$queryParameters).forEach(function(parameterName) {
                    var parameter = parameters.$queryParameters[parameterName];
                    queryParameters[parameterName] = parameter;
                });
            }

            request('POST', domain + path, body, headers, queryParameters, form, reject, resolve, errorHandlers);

        });
    };

    /**
     * Get counts of specific genes and alterations within a CNA molecular profile
     * @method
     * @name CBioPortalAPIInternal#fetchCopyNumberCountsUsingPOST
     * @param {string} molecularProfileId - Molecular Profile ID e.g. acc_tcga_gistic
     * @param {} copyNumberCountIdentifiers - A web service for supplying JSON formatted data to cBioPortal clients. Please note that this API is currently in beta and subject to change.
     */
    fetchCopyNumberCountsUsingPOST(parameters: {
            'molecularProfileId': string,
            'copyNumberCountIdentifiers': Array < CopyNumberCountIdentifier > ,
            $queryParameters ? : any,
            $domain ? : string
        }): Promise < Array < CopyNumberCount >
        > {
            return this.fetchCopyNumberCountsUsingPOSTWithHttpInfo(parameters).then(function(response: request.Response) {
                return response.body;
            });
        };
    fetchMrnaPercentileUsingPOSTURL(parameters: {
        'molecularProfileId': string,
        'sampleId': string,
        'entrezGeneIds': Array < number > ,
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/api/molecular-profiles/{molecularProfileId}/mrna-percentile/fetch';

        path = path.replace('{molecularProfileId}', parameters['molecularProfileId'] + '');
        if (parameters['sampleId'] !== undefined) {
            queryParameters['sampleId'] = parameters['sampleId'];
        }

        if (parameters.$queryParameters) {
            Object.keys(parameters.$queryParameters).forEach(function(parameterName) {
                var parameter = parameters.$queryParameters[parameterName];
                queryParameters[parameterName] = parameter;
            });
        }
        let keys = Object.keys(queryParameters);
        return this.domain + path + (keys.length > 0 ? '?' + (keys.map(key => key + '=' + encodeURIComponent(queryParameters[key])).join('&')) : '');
    };

    /**
     * Get mRNA expression percentiles for list of genes for a sample
     * @method
     * @name CBioPortalAPIInternal#fetchMrnaPercentileUsingPOST
     * @param {string} molecularProfileId - Molecular Profile ID e.g. acc_tcga_rna_seq_v2_mrna
     * @param {string} sampleId - Sample ID e.g. TCGA-OR-A5J2-01
     * @param {} entrezGeneIds - A web service for supplying JSON formatted data to cBioPortal clients. Please note that this API is currently in beta and subject to change.
     */
    fetchMrnaPercentileUsingPOSTWithHttpInfo(parameters: {
        'molecularProfileId': string,
        'sampleId': string,
        'entrezGeneIds': Array < number > ,
        $queryParameters ? : any,
        $domain ? : string
    }): Promise < request.Response > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        const errorHandlers = this.errorHandlers;
        const request = this.request;
        let path = '/api/molecular-profiles/{molecularProfileId}/mrna-percentile/fetch';
        let body: any;
        let queryParameters: any = {};
        let headers: any = {};
        let form: any = {};
        return new Promise(function(resolve, reject) {
            headers['Accept'] = 'application/json';
            headers['Content-Type'] = 'application/json';

            path = path.replace('{molecularProfileId}', parameters['molecularProfileId'] + '');

            if (parameters['molecularProfileId'] === undefined) {
                reject(new Error('Missing required  parameter: molecularProfileId'));
                return;
            }

            if (parameters['sampleId'] !== undefined) {
                queryParameters['sampleId'] = parameters['sampleId'];
            }

            if (parameters['sampleId'] === undefined) {
                reject(new Error('Missing required  parameter: sampleId'));
                return;
            }

            if (parameters['entrezGeneIds'] !== undefined) {
                body = parameters['entrezGeneIds'];
            }

            if (parameters['entrezGeneIds'] === undefined) {
                reject(new Error('Missing required  parameter: entrezGeneIds'));
                return;
            }

            if (parameters.$queryParameters) {
                Object.keys(parameters.$queryParameters).forEach(function(parameterName) {
                    var parameter = parameters.$queryParameters[parameterName];
                    queryParameters[parameterName] = parameter;
                });
            }

            request('POST', domain + path, body, headers, queryParameters, form, reject, resolve, errorHandlers);

        });
    };

    /**
     * Get mRNA expression percentiles for list of genes for a sample
     * @method
     * @name CBioPortalAPIInternal#fetchMrnaPercentileUsingPOST
     * @param {string} molecularProfileId - Molecular Profile ID e.g. acc_tcga_rna_seq_v2_mrna
     * @param {string} sampleId - Sample ID e.g. TCGA-OR-A5J2-01
     * @param {} entrezGeneIds - A web service for supplying JSON formatted data to cBioPortal clients. Please note that this API is currently in beta and subject to change.
     */
    fetchMrnaPercentileUsingPOST(parameters: {
            'molecularProfileId': string,
            'sampleId': string,
            'entrezGeneIds': Array < number > ,
            $queryParameters ? : any,
            $domain ? : string
        }): Promise < Array < MrnaPercentile >
        > {
            return this.fetchMrnaPercentileUsingPOSTWithHttpInfo(parameters).then(function(response: request.Response) {
                return response.body;
            });
        };
    fetchMutationSpectrumsUsingPOSTURL(parameters: {
        'molecularProfileId': string,
        'mutationSpectrumFilter': MutationSpectrumFilter,
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/api/molecular-profiles/{molecularProfileId}/mutation-spectrums/fetch';

        path = path.replace('{molecularProfileId}', parameters['molecularProfileId'] + '');

        if (parameters.$queryParameters) {
            Object.keys(parameters.$queryParameters).forEach(function(parameterName) {
                var parameter = parameters.$queryParameters[parameterName];
                queryParameters[parameterName] = parameter;
            });
        }
        let keys = Object.keys(queryParameters);
        return this.domain + path + (keys.length > 0 ? '?' + (keys.map(key => key + '=' + encodeURIComponent(queryParameters[key])).join('&')) : '');
    };

    /**
     * Fetch mutation spectrums in a molecular profile
     * @method
     * @name CBioPortalAPIInternal#fetchMutationSpectrumsUsingPOST
     * @param {string} molecularProfileId - Molecular Profile ID e.g. acc_tcga_mutations
     * @param {} mutationSpectrumFilter - A web service for supplying JSON formatted data to cBioPortal clients. Please note that this API is currently in beta and subject to change.
     */
    fetchMutationSpectrumsUsingPOSTWithHttpInfo(parameters: {
        'molecularProfileId': string,
        'mutationSpectrumFilter': MutationSpectrumFilter,
        $queryParameters ? : any,
        $domain ? : string
    }): Promise < request.Response > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        const errorHandlers = this.errorHandlers;
        const request = this.request;
        let path = '/api/molecular-profiles/{molecularProfileId}/mutation-spectrums/fetch';
        let body: any;
        let queryParameters: any = {};
        let headers: any = {};
        let form: any = {};
        return new Promise(function(resolve, reject) {
            headers['Accept'] = 'application/json';
            headers['Content-Type'] = 'application/json';

            path = path.replace('{molecularProfileId}', parameters['molecularProfileId'] + '');

            if (parameters['molecularProfileId'] === undefined) {
                reject(new Error('Missing required  parameter: molecularProfileId'));
                return;
            }

            if (parameters['mutationSpectrumFilter'] !== undefined) {
                body = parameters['mutationSpectrumFilter'];
            }

            if (parameters['mutationSpectrumFilter'] === undefined) {
                reject(new Error('Missing required  parameter: mutationSpectrumFilter'));
                return;
            }

            if (parameters.$queryParameters) {
                Object.keys(parameters.$queryParameters).forEach(function(parameterName) {
                    var parameter = parameters.$queryParameters[parameterName];
                    queryParameters[parameterName] = parameter;
                });
            }

            request('POST', domain + path, body, headers, queryParameters, form, reject, resolve, errorHandlers);

        });
    };

    /**
     * Fetch mutation spectrums in a molecular profile
     * @method
     * @name CBioPortalAPIInternal#fetchMutationSpectrumsUsingPOST
     * @param {string} molecularProfileId - Molecular Profile ID e.g. acc_tcga_mutations
     * @param {} mutationSpectrumFilter - A web service for supplying JSON formatted data to cBioPortal clients. Please note that this API is currently in beta and subject to change.
     */
    fetchMutationSpectrumsUsingPOST(parameters: {
            'molecularProfileId': string,
            'mutationSpectrumFilter': MutationSpectrumFilter,
            $queryParameters ? : any,
            $domain ? : string
        }): Promise < Array < MutationSpectrum >
        > {
            return this.fetchMutationSpectrumsUsingPOSTWithHttpInfo(parameters).then(function(response: request.Response) {
                return response.body;
            });
        };
    fetchVariantCountsUsingPOSTURL(parameters: {
        'molecularProfileId': string,
        'variantCountIdentifiers': Array < VariantCountIdentifier > ,
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/api/molecular-profiles/{molecularProfileId}/variant-counts/fetch';

        path = path.replace('{molecularProfileId}', parameters['molecularProfileId'] + '');

        if (parameters.$queryParameters) {
            Object.keys(parameters.$queryParameters).forEach(function(parameterName) {
                var parameter = parameters.$queryParameters[parameterName];
                queryParameters[parameterName] = parameter;
            });
        }
        let keys = Object.keys(queryParameters);
        return this.domain + path + (keys.length > 0 ? '?' + (keys.map(key => key + '=' + encodeURIComponent(queryParameters[key])).join('&')) : '');
    };

    /**
     * Get counts of specific variants within a mutation molecular profile
     * @method
     * @name CBioPortalAPIInternal#fetchVariantCountsUsingPOST
     * @param {string} molecularProfileId - Molecular Profile ID e.g. acc_tcga_mutations
     * @param {} variantCountIdentifiers - A web service for supplying JSON formatted data to cBioPortal clients. Please note that this API is currently in beta and subject to change.
     */
    fetchVariantCountsUsingPOSTWithHttpInfo(parameters: {
        'molecularProfileId': string,
        'variantCountIdentifiers': Array < VariantCountIdentifier > ,
        $queryParameters ? : any,
        $domain ? : string
    }): Promise < request.Response > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        const errorHandlers = this.errorHandlers;
        const request = this.request;
        let path = '/api/molecular-profiles/{molecularProfileId}/variant-counts/fetch';
        let body: any;
        let queryParameters: any = {};
        let headers: any = {};
        let form: any = {};
        return new Promise(function(resolve, reject) {
            headers['Accept'] = 'application/json';
            headers['Content-Type'] = 'application/json';

            path = path.replace('{molecularProfileId}', parameters['molecularProfileId'] + '');

            if (parameters['molecularProfileId'] === undefined) {
                reject(new Error('Missing required  parameter: molecularProfileId'));
                return;
            }

            if (parameters['variantCountIdentifiers'] !== undefined) {
                body = parameters['variantCountIdentifiers'];
            }

            if (parameters['variantCountIdentifiers'] === undefined) {
                reject(new Error('Missing required  parameter: variantCountIdentifiers'));
                return;
            }

            if (parameters.$queryParameters) {
                Object.keys(parameters.$queryParameters).forEach(function(parameterName) {
                    var parameter = parameters.$queryParameters[parameterName];
                    queryParameters[parameterName] = parameter;
                });
            }

            request('POST', domain + path, body, headers, queryParameters, form, reject, resolve, errorHandlers);

        });
    };

    /**
     * Get counts of specific variants within a mutation molecular profile
     * @method
     * @name CBioPortalAPIInternal#fetchVariantCountsUsingPOST
     * @param {string} molecularProfileId - Molecular Profile ID e.g. acc_tcga_mutations
     * @param {} variantCountIdentifiers - A web service for supplying JSON formatted data to cBioPortal clients. Please note that this API is currently in beta and subject to change.
     */
    fetchVariantCountsUsingPOST(parameters: {
            'molecularProfileId': string,
            'variantCountIdentifiers': Array < VariantCountIdentifier > ,
            $queryParameters ? : any,
            $domain ? : string
        }): Promise < Array < VariantCount >
        > {
            return this.fetchVariantCountsUsingPOSTWithHttpInfo(parameters).then(function(response: request.Response) {
                return response.body;
            });
        };
    fetchMutatedGenesUsingPOSTURL(parameters: {
        'studyViewFilter' ? : StudyViewFilter,
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/api/mutated-genes/fetch';

        if (parameters.$queryParameters) {
            Object.keys(parameters.$queryParameters).forEach(function(parameterName) {
                var parameter = parameters.$queryParameters[parameterName];
                queryParameters[parameterName] = parameter;
            });
        }
        let keys = Object.keys(queryParameters);
        return this.domain + path + (keys.length > 0 ? '?' + (keys.map(key => key + '=' + encodeURIComponent(queryParameters[key])).join('&')) : '');
    };

    /**
     * Fetch mutated genes by study view filter
     * @method
     * @name CBioPortalAPIInternal#fetchMutatedGenesUsingPOST
     * @param {} studyViewFilter - A web service for supplying JSON formatted data to cBioPortal clients. Please note that this API is currently in beta and subject to change.
     */
    fetchMutatedGenesUsingPOSTWithHttpInfo(parameters: {
        'studyViewFilter' ? : StudyViewFilter,
        $queryParameters ? : any,
            $domain ? : string
    }): Promise < request.Response > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        const errorHandlers = this.errorHandlers;
        const request = this.request;
        let path = '/api/mutated-genes/fetch';
        let body: any;
        let queryParameters: any = {};
        let headers: any = {};
        let form: any = {};
        return new Promise(function(resolve, reject) {
            headers['Accept'] = 'application/json';
            headers['Content-Type'] = 'application/json';

            if (parameters['studyViewFilter'] !== undefined) {
                body = parameters['studyViewFilter'];
            }

            if (parameters.$queryParameters) {
                Object.keys(parameters.$queryParameters).forEach(function(parameterName) {
                    var parameter = parameters.$queryParameters[parameterName];
                    queryParameters[parameterName] = parameter;
                });
            }

            request('POST', domain + path, body, headers, queryParameters, form, reject, resolve, errorHandlers);

        });
    };

    /**
     * Fetch mutated genes by study view filter
     * @method
     * @name CBioPortalAPIInternal#fetchMutatedGenesUsingPOST
     * @param {} studyViewFilter - A web service for supplying JSON formatted data to cBioPortal clients. Please note that this API is currently in beta and subject to change.
     */
    fetchMutatedGenesUsingPOST(parameters: {
            'studyViewFilter' ? : StudyViewFilter,
            $queryParameters ? : any,
                $domain ? : string
        }): Promise < Array < AlterationCountByGene >
        > {
            return this.fetchMutatedGenesUsingPOSTWithHttpInfo(parameters).then(function(response: request.Response) {
                return response.body;
            });
        };
    fetchMutationCountsByPositionUsingPOSTURL(parameters: {
        'mutationPositionIdentifiers': Array < MutationPositionIdentifier > ,
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/api/mutation-counts-by-position/fetch';

        if (parameters.$queryParameters) {
            Object.keys(parameters.$queryParameters).forEach(function(parameterName) {
                var parameter = parameters.$queryParameters[parameterName];
                queryParameters[parameterName] = parameter;
            });
        }
        let keys = Object.keys(queryParameters);
        return this.domain + path + (keys.length > 0 ? '?' + (keys.map(key => key + '=' + encodeURIComponent(queryParameters[key])).join('&')) : '');
    };

    /**
     * Fetch mutation counts in all studies by gene and position
     * @method
     * @name CBioPortalAPIInternal#fetchMutationCountsByPositionUsingPOST
     * @param {} mutationPositionIdentifiers - A web service for supplying JSON formatted data to cBioPortal clients. Please note that this API is currently in beta and subject to change.
     */
    fetchMutationCountsByPositionUsingPOSTWithHttpInfo(parameters: {
        'mutationPositionIdentifiers': Array < MutationPositionIdentifier > ,
        $queryParameters ? : any,
        $domain ? : string
    }): Promise < request.Response > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        const errorHandlers = this.errorHandlers;
        const request = this.request;
        let path = '/api/mutation-counts-by-position/fetch';
        let body: any;
        let queryParameters: any = {};
        let headers: any = {};
        let form: any = {};
        return new Promise(function(resolve, reject) {
            headers['Accept'] = 'application/json';
            headers['Content-Type'] = 'application/json';

            if (parameters['mutationPositionIdentifiers'] !== undefined) {
                body = parameters['mutationPositionIdentifiers'];
            }

            if (parameters['mutationPositionIdentifiers'] === undefined) {
                reject(new Error('Missing required  parameter: mutationPositionIdentifiers'));
                return;
            }

            if (parameters.$queryParameters) {
                Object.keys(parameters.$queryParameters).forEach(function(parameterName) {
                    var parameter = parameters.$queryParameters[parameterName];
                    queryParameters[parameterName] = parameter;
                });
            }

            request('POST', domain + path, body, headers, queryParameters, form, reject, resolve, errorHandlers);

        });
    };

    /**
     * Fetch mutation counts in all studies by gene and position
     * @method
     * @name CBioPortalAPIInternal#fetchMutationCountsByPositionUsingPOST
     * @param {} mutationPositionIdentifiers - A web service for supplying JSON formatted data to cBioPortal clients. Please note that this API is currently in beta and subject to change.
     */
    fetchMutationCountsByPositionUsingPOST(parameters: {
            'mutationPositionIdentifiers': Array < MutationPositionIdentifier > ,
            $queryParameters ? : any,
            $domain ? : string
        }): Promise < Array < MutationCountByPosition >
        > {
            return this.fetchMutationCountsByPositionUsingPOSTWithHttpInfo(parameters).then(function(response: request.Response) {
                return response.body;
            });
        };
    fetchMutationDataCountsUsingPOSTURL(parameters: {
        'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
        'genomicDataCountFilter' ? : GenomicDataCountFilter,
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/api/mutation-data-counts/fetch';
        if (parameters['projection'] !== undefined) {
            queryParameters['projection'] = parameters['projection'];
        }

        if (parameters.$queryParameters) {
            Object.keys(parameters.$queryParameters).forEach(function(parameterName) {
                var parameter = parameters.$queryParameters[parameterName];
                queryParameters[parameterName] = parameter;
            });
        }
        let keys = Object.keys(queryParameters);
        return this.domain + path + (keys.length > 0 ? '?' + (keys.map(key => key + '=' + encodeURIComponent(queryParameters[key])).join('&')) : '');
    };

    /**
     * Fetch mutation data counts by GenomicDataCountFilter
     * @method
     * @name CBioPortalAPIInternal#fetchMutationDataCountsUsingPOST
     * @param {string} projection - Level of detail of the response
     * @param {} genomicDataCountFilter - A web service for supplying JSON formatted data to cBioPortal clients. Please note that this API is currently in beta and subject to change.
     */
    fetchMutationDataCountsUsingPOSTWithHttpInfo(parameters: {
        'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
        'genomicDataCountFilter' ? : GenomicDataCountFilter,
        $queryParameters ? : any,
            $domain ? : string
    }): Promise < request.Response > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        const errorHandlers = this.errorHandlers;
        const request = this.request;
        let path = '/api/mutation-data-counts/fetch';
        let body: any;
        let queryParameters: any = {};
        let headers: any = {};
        let form: any = {};
        return new Promise(function(resolve, reject) {
            headers['Accept'] = 'application/json';
            headers['Content-Type'] = 'application/json';

            if (parameters['projection'] !== undefined) {
                queryParameters['projection'] = parameters['projection'];
            }

            if (parameters['genomicDataCountFilter'] !== undefined) {
                body = parameters['genomicDataCountFilter'];
            }

            if (parameters.$queryParameters) {
                Object.keys(parameters.$queryParameters).forEach(function(parameterName) {
                    var parameter = parameters.$queryParameters[parameterName];
                    queryParameters[parameterName] = parameter;
                });
            }

            request('POST', domain + path, body, headers, queryParameters, form, reject, resolve, errorHandlers);

        });
    };

    /**
     * Fetch mutation data counts by GenomicDataCountFilter
     * @method
     * @name CBioPortalAPIInternal#fetchMutationDataCountsUsingPOST
     * @param {string} projection - Level of detail of the response
     * @param {} genomicDataCountFilter - A web service for supplying JSON formatted data to cBioPortal clients. Please note that this API is currently in beta and subject to change.
     */
    fetchMutationDataCountsUsingPOST(parameters: {
            'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
            'genomicDataCountFilter' ? : GenomicDataCountFilter,
            $queryParameters ? : any,
                $domain ? : string
        }): Promise < Array < GenomicDataCountItem >
        > {
            return this.fetchMutationDataCountsUsingPOSTWithHttpInfo(parameters).then(function(response: request.Response) {
                return response.body;
            });
        };
    getNamespaceAttributeCountsUsingPOSTURL(parameters: {
        'namespaceAttributeCountFilter' ? : NamespaceAttributeCountFilter,
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/api/namespace-attributes/counts/fetch';

        if (parameters.$queryParameters) {
            Object.keys(parameters.$queryParameters).forEach(function(parameterName) {
                var parameter = parameters.$queryParameters[parameterName];
                queryParameters[parameterName] = parameter;
            });
        }
        let keys = Object.keys(queryParameters);
        return this.domain + path + (keys.length > 0 ? '?' + (keys.map(key => key + '=' + encodeURIComponent(queryParameters[key])).join('&')) : '');
    };

    /**
     * Get counts for namespace attributes according to their data availability for selected samples/patients
     * @method
     * @name CBioPortalAPIInternal#getNamespaceAttributeCountsUsingPOST
     * @param {} namespaceAttributeCountFilter - A web service for supplying JSON formatted data to cBioPortal clients. Please note that this API is currently in beta and subject to change.
     */
    getNamespaceAttributeCountsUsingPOSTWithHttpInfo(parameters: {
        'namespaceAttributeCountFilter' ? : NamespaceAttributeCountFilter,
        $queryParameters ? : any,
            $domain ? : string
    }): Promise < request.Response > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        const errorHandlers = this.errorHandlers;
        const request = this.request;
        let path = '/api/namespace-attributes/counts/fetch';
        let body: any;
        let queryParameters: any = {};
        let headers: any = {};
        let form: any = {};
        return new Promise(function(resolve, reject) {
            headers['Accept'] = 'application/json';
            headers['Content-Type'] = 'application/json';

            if (parameters['namespaceAttributeCountFilter'] !== undefined) {
                body = parameters['namespaceAttributeCountFilter'];
            }

            if (parameters.$queryParameters) {
                Object.keys(parameters.$queryParameters).forEach(function(parameterName) {
                    var parameter = parameters.$queryParameters[parameterName];
                    queryParameters[parameterName] = parameter;
                });
            }

            request('POST', domain + path, body, headers, queryParameters, form, reject, resolve, errorHandlers);

        });
    };

    /**
     * Get counts for namespace attributes according to their data availability for selected samples/patients
     * @method
     * @name CBioPortalAPIInternal#getNamespaceAttributeCountsUsingPOST
     * @param {} namespaceAttributeCountFilter - A web service for supplying JSON formatted data to cBioPortal clients. Please note that this API is currently in beta and subject to change.
     */
    getNamespaceAttributeCountsUsingPOST(parameters: {
            'namespaceAttributeCountFilter' ? : NamespaceAttributeCountFilter,
            $queryParameters ? : any,
                $domain ? : string
        }): Promise < Array < NamespaceAttributeCount >
        > {
            return this.getNamespaceAttributeCountsUsingPOSTWithHttpInfo(parameters).then(function(response: request.Response) {
                return response.body;
            });
        };
    fetchNamespaceDataCountsUsingPOSTURL(parameters: {
        'namespaceDataCountFilter' ? : NamespaceDataCountFilter,
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/api/namespace-data-counts/fetch';

        if (parameters.$queryParameters) {
            Object.keys(parameters.$queryParameters).forEach(function(parameterName) {
                var parameter = parameters.$queryParameters[parameterName];
                queryParameters[parameterName] = parameter;
            });
        }
        let keys = Object.keys(queryParameters);
        return this.domain + path + (keys.length > 0 ? '?' + (keys.map(key => key + '=' + encodeURIComponent(queryParameters[key])).join('&')) : '');
    };

    /**
     * Fetch namespace data counts by study view filter
     * @method
     * @name CBioPortalAPIInternal#fetchNamespaceDataCountsUsingPOST
     * @param {} namespaceDataCountFilter - A web service for supplying JSON formatted data to cBioPortal clients. Please note that this API is currently in beta and subject to change.
     */
    fetchNamespaceDataCountsUsingPOSTWithHttpInfo(parameters: {
        'namespaceDataCountFilter' ? : NamespaceDataCountFilter,
        $queryParameters ? : any,
            $domain ? : string
    }): Promise < request.Response > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        const errorHandlers = this.errorHandlers;
        const request = this.request;
        let path = '/api/namespace-data-counts/fetch';
        let body: any;
        let queryParameters: any = {};
        let headers: any = {};
        let form: any = {};
        return new Promise(function(resolve, reject) {
            headers['Accept'] = 'application/json';
            headers['Content-Type'] = 'application/json';

            if (parameters['namespaceDataCountFilter'] !== undefined) {
                body = parameters['namespaceDataCountFilter'];
            }

            if (parameters.$queryParameters) {
                Object.keys(parameters.$queryParameters).forEach(function(parameterName) {
                    var parameter = parameters.$queryParameters[parameterName];
                    queryParameters[parameterName] = parameter;
                });
            }

            request('POST', domain + path, body, headers, queryParameters, form, reject, resolve, errorHandlers);

        });
    };

    /**
     * Fetch namespace data counts by study view filter
     * @method
     * @name CBioPortalAPIInternal#fetchNamespaceDataCountsUsingPOST
     * @param {} namespaceDataCountFilter - A web service for supplying JSON formatted data to cBioPortal clients. Please note that this API is currently in beta and subject to change.
     */
    fetchNamespaceDataCountsUsingPOST(parameters: {
            'namespaceDataCountFilter' ? : NamespaceDataCountFilter,
            $queryParameters ? : any,
                $domain ? : string
        }): Promise < Array < NamespaceDataCountItem >
        > {
            return this.fetchNamespaceDataCountsUsingPOSTWithHttpInfo(parameters).then(function(response: request.Response) {
                return response.body;
            });
        };
    getNamespaceDataForComparisonUsingPOSTURL(parameters: {
        'namespaceComparisonFilter' ? : NamespaceComparisonFilter,
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/api/namespace-data/fetch';

        if (parameters.$queryParameters) {
            Object.keys(parameters.$queryParameters).forEach(function(parameterName) {
                var parameter = parameters.$queryParameters[parameterName];
                queryParameters[parameterName] = parameter;
            });
        }
        let keys = Object.keys(queryParameters);
        return this.domain + path + (keys.length > 0 ? '?' + (keys.map(key => key + '=' + encodeURIComponent(queryParameters[key])).join('&')) : '');
    };

    /**
     * Get namespace data for comparison page for the selected samples and values
     * @method
     * @name CBioPortalAPIInternal#getNamespaceDataForComparisonUsingPOST
     * @param {} namespaceComparisonFilter - A web service for supplying JSON formatted data to cBioPortal clients. Please note that this API is currently in beta and subject to change.
     */
    getNamespaceDataForComparisonUsingPOSTWithHttpInfo(parameters: {
        'namespaceComparisonFilter' ? : NamespaceComparisonFilter,
        $queryParameters ? : any,
            $domain ? : string
    }): Promise < request.Response > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        const errorHandlers = this.errorHandlers;
        const request = this.request;
        let path = '/api/namespace-data/fetch';
        let body: any;
        let queryParameters: any = {};
        let headers: any = {};
        let form: any = {};
        return new Promise(function(resolve, reject) {
            headers['Accept'] = 'application/json';
            headers['Content-Type'] = 'application/json';

            if (parameters['namespaceComparisonFilter'] !== undefined) {
                body = parameters['namespaceComparisonFilter'];
            }

            if (parameters.$queryParameters) {
                Object.keys(parameters.$queryParameters).forEach(function(parameterName) {
                    var parameter = parameters.$queryParameters[parameterName];
                    queryParameters[parameterName] = parameter;
                });
            }

            request('POST', domain + path, body, headers, queryParameters, form, reject, resolve, errorHandlers);

        });
    };

    /**
     * Get namespace data for comparison page for the selected samples and values
     * @method
     * @name CBioPortalAPIInternal#getNamespaceDataForComparisonUsingPOST
     * @param {} namespaceComparisonFilter - A web service for supplying JSON formatted data to cBioPortal clients. Please note that this API is currently in beta and subject to change.
     */
    getNamespaceDataForComparisonUsingPOST(parameters: {
            'namespaceComparisonFilter' ? : NamespaceComparisonFilter,
            $queryParameters ? : any,
                $domain ? : string
        }): Promise < Array < NamespaceData >
        > {
            return this.getNamespaceDataForComparisonUsingPOSTWithHttpInfo(parameters).then(function(response: request.Response) {
                return response.body;
            });
        };
    getAllReferenceGenomeGenesUsingGETURL(parameters: {
        'genomeName': string,
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/api/reference-genome-genes/{genomeName}';

        path = path.replace('{genomeName}', parameters['genomeName'] + '');

        if (parameters.$queryParameters) {
            Object.keys(parameters.$queryParameters).forEach(function(parameterName) {
                var parameter = parameters.$queryParameters[parameterName];
                queryParameters[parameterName] = parameter;
            });
        }
        let keys = Object.keys(queryParameters);
        return this.domain + path + (keys.length > 0 ? '?' + (keys.map(key => key + '=' + encodeURIComponent(queryParameters[key])).join('&')) : '');
    };

    /**
     * Get all reference genes
     * @method
     * @name CBioPortalAPIInternal#getAllReferenceGenomeGenesUsingGET
     * @param {string} genomeName - Name of Reference Genome hg19
     */
    getAllReferenceGenomeGenesUsingGETWithHttpInfo(parameters: {
        'genomeName': string,
        $queryParameters ? : any,
        $domain ? : string
    }): Promise < request.Response > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        const errorHandlers = this.errorHandlers;
        const request = this.request;
        let path = '/api/reference-genome-genes/{genomeName}';
        let body: any;
        let queryParameters: any = {};
        let headers: any = {};
        let form: any = {};
        return new Promise(function(resolve, reject) {
            headers['Accept'] = 'application/json';

            path = path.replace('{genomeName}', parameters['genomeName'] + '');

            if (parameters['genomeName'] === undefined) {
                reject(new Error('Missing required  parameter: genomeName'));
                return;
            }

            if (parameters.$queryParameters) {
                Object.keys(parameters.$queryParameters).forEach(function(parameterName) {
                    var parameter = parameters.$queryParameters[parameterName];
                    queryParameters[parameterName] = parameter;
                });
            }

            request('GET', domain + path, body, headers, queryParameters, form, reject, resolve, errorHandlers);

        });
    };

    /**
     * Get all reference genes
     * @method
     * @name CBioPortalAPIInternal#getAllReferenceGenomeGenesUsingGET
     * @param {string} genomeName - Name of Reference Genome hg19
     */
    getAllReferenceGenomeGenesUsingGET(parameters: {
            'genomeName': string,
            $queryParameters ? : any,
            $domain ? : string
        }): Promise < Array < ReferenceGenomeGene >
        > {
            return this.getAllReferenceGenomeGenesUsingGETWithHttpInfo(parameters).then(function(response: request.Response) {
                return response.body;
            });
        };
    fetchReferenceGenomeGenesUsingPOSTURL(parameters: {
        'genomeName': string,
        'geneIds': Array < string > ,
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/api/reference-genome-genes/{genomeName}/fetch';

        path = path.replace('{genomeName}', parameters['genomeName'] + '');

        if (parameters.$queryParameters) {
            Object.keys(parameters.$queryParameters).forEach(function(parameterName) {
                var parameter = parameters.$queryParameters[parameterName];
                queryParameters[parameterName] = parameter;
            });
        }
        let keys = Object.keys(queryParameters);
        return this.domain + path + (keys.length > 0 ? '?' + (keys.map(key => key + '=' + encodeURIComponent(queryParameters[key])).join('&')) : '');
    };

    /**
     * Fetch genes of reference genome of interest
     * @method
     * @name CBioPortalAPIInternal#fetchReferenceGenomeGenesUsingPOST
     * @param {string} genomeName - Name of Reference Genome hg19
     * @param {} geneIds - A web service for supplying JSON formatted data to cBioPortal clients. Please note that this API is currently in beta and subject to change.
     */
    fetchReferenceGenomeGenesUsingPOSTWithHttpInfo(parameters: {
        'genomeName': string,
        'geneIds': Array < string > ,
        $queryParameters ? : any,
        $domain ? : string
    }): Promise < request.Response > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        const errorHandlers = this.errorHandlers;
        const request = this.request;
        let path = '/api/reference-genome-genes/{genomeName}/fetch';
        let body: any;
        let queryParameters: any = {};
        let headers: any = {};
        let form: any = {};
        return new Promise(function(resolve, reject) {
            headers['Accept'] = 'application/json';
            headers['Content-Type'] = 'application/json';

            path = path.replace('{genomeName}', parameters['genomeName'] + '');

            if (parameters['genomeName'] === undefined) {
                reject(new Error('Missing required  parameter: genomeName'));
                return;
            }

            if (parameters['geneIds'] !== undefined) {
                body = parameters['geneIds'];
            }

            if (parameters['geneIds'] === undefined) {
                reject(new Error('Missing required  parameter: geneIds'));
                return;
            }

            if (parameters.$queryParameters) {
                Object.keys(parameters.$queryParameters).forEach(function(parameterName) {
                    var parameter = parameters.$queryParameters[parameterName];
                    queryParameters[parameterName] = parameter;
                });
            }

            request('POST', domain + path, body, headers, queryParameters, form, reject, resolve, errorHandlers);

        });
    };

    /**
     * Fetch genes of reference genome of interest
     * @method
     * @name CBioPortalAPIInternal#fetchReferenceGenomeGenesUsingPOST
     * @param {string} genomeName - Name of Reference Genome hg19
     * @param {} geneIds - A web service for supplying JSON formatted data to cBioPortal clients. Please note that this API is currently in beta and subject to change.
     */
    fetchReferenceGenomeGenesUsingPOST(parameters: {
            'genomeName': string,
            'geneIds': Array < string > ,
            $queryParameters ? : any,
            $domain ? : string
        }): Promise < Array < ReferenceGenomeGene >
        > {
            return this.fetchReferenceGenomeGenesUsingPOSTWithHttpInfo(parameters).then(function(response: request.Response) {
                return response.body;
            });
        };
    getReferenceGenomeGeneUsingGETURL(parameters: {
        'genomeName': string,
        'geneId': number,
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/api/reference-genome-genes/{genomeName}/{geneId}';

        path = path.replace('{genomeName}', parameters['genomeName'] + '');

        path = path.replace('{geneId}', parameters['geneId'] + '');

        if (parameters.$queryParameters) {
            Object.keys(parameters.$queryParameters).forEach(function(parameterName) {
                var parameter = parameters.$queryParameters[parameterName];
                queryParameters[parameterName] = parameter;
            });
        }
        let keys = Object.keys(queryParameters);
        return this.domain + path + (keys.length > 0 ? '?' + (keys.map(key => key + '=' + encodeURIComponent(queryParameters[key])).join('&')) : '');
    };

    /**
     * Get a gene of a reference genome of interest
     * @method
     * @name CBioPortalAPIInternal#getReferenceGenomeGeneUsingGET
     * @param {string} genomeName - Name of Reference Genome hg19
     * @param {integer} geneId - Entrez Gene ID 207
     */
    getReferenceGenomeGeneUsingGETWithHttpInfo(parameters: {
        'genomeName': string,
        'geneId': number,
        $queryParameters ? : any,
        $domain ? : string
    }): Promise < request.Response > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        const errorHandlers = this.errorHandlers;
        const request = this.request;
        let path = '/api/reference-genome-genes/{genomeName}/{geneId}';
        let body: any;
        let queryParameters: any = {};
        let headers: any = {};
        let form: any = {};
        return new Promise(function(resolve, reject) {
            headers['Accept'] = 'application/json';

            path = path.replace('{genomeName}', parameters['genomeName'] + '');

            if (parameters['genomeName'] === undefined) {
                reject(new Error('Missing required  parameter: genomeName'));
                return;
            }

            path = path.replace('{geneId}', parameters['geneId'] + '');

            if (parameters['geneId'] === undefined) {
                reject(new Error('Missing required  parameter: geneId'));
                return;
            }

            if (parameters.$queryParameters) {
                Object.keys(parameters.$queryParameters).forEach(function(parameterName) {
                    var parameter = parameters.$queryParameters[parameterName];
                    queryParameters[parameterName] = parameter;
                });
            }

            request('GET', domain + path, body, headers, queryParameters, form, reject, resolve, errorHandlers);

        });
    };

    /**
     * Get a gene of a reference genome of interest
     * @method
     * @name CBioPortalAPIInternal#getReferenceGenomeGeneUsingGET
     * @param {string} genomeName - Name of Reference Genome hg19
     * @param {integer} geneId - Entrez Gene ID 207
     */
    getReferenceGenomeGeneUsingGET(parameters: {
        'genomeName': string,
        'geneId': number,
        $queryParameters ? : any,
        $domain ? : string
    }): Promise < ReferenceGenomeGene > {
        return this.getReferenceGenomeGeneUsingGETWithHttpInfo(parameters).then(function(response: request.Response) {
            return response.body;
        });
    };
    fetchResourceDefinitionsUsingPOSTURL(parameters: {
        'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
        'studyIds': Array < string > ,
            $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/api/resource-definitions/fetch';
        if (parameters['projection'] !== undefined) {
            queryParameters['projection'] = parameters['projection'];
        }

        if (parameters.$queryParameters) {
            Object.keys(parameters.$queryParameters).forEach(function(parameterName) {
                var parameter = parameters.$queryParameters[parameterName];
                queryParameters[parameterName] = parameter;
            });
        }
        let keys = Object.keys(queryParameters);
        return this.domain + path + (keys.length > 0 ? '?' + (keys.map(key => key + '=' + encodeURIComponent(queryParameters[key])).join('&')) : '');
    };

    /**
     * Get all resource definitions for specified studies
     * @method
     * @name CBioPortalAPIInternal#fetchResourceDefinitionsUsingPOST
     * @param {string} projection - Level of detail of the response
     * @param {} studyIds - A web service for supplying JSON formatted data to cBioPortal clients. Please note that this API is currently in beta and subject to change.
     */
    fetchResourceDefinitionsUsingPOSTWithHttpInfo(parameters: {
        'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
        'studyIds': Array < string > ,
            $queryParameters ? : any,
            $domain ? : string
    }): Promise < request.Response > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        const errorHandlers = this.errorHandlers;
        const request = this.request;
        let path = '/api/resource-definitions/fetch';
        let body: any;
        let queryParameters: any = {};
        let headers: any = {};
        let form: any = {};
        return new Promise(function(resolve, reject) {
            headers['Accept'] = 'application/json';
            headers['Content-Type'] = 'application/json';

            if (parameters['projection'] !== undefined) {
                queryParameters['projection'] = parameters['projection'];
            }

            if (parameters['studyIds'] !== undefined) {
                body = parameters['studyIds'];
            }

            if (parameters['studyIds'] === undefined) {
                reject(new Error('Missing required  parameter: studyIds'));
                return;
            }

            if (parameters.$queryParameters) {
                Object.keys(parameters.$queryParameters).forEach(function(parameterName) {
                    var parameter = parameters.$queryParameters[parameterName];
                    queryParameters[parameterName] = parameter;
                });
            }

            request('POST', domain + path, body, headers, queryParameters, form, reject, resolve, errorHandlers);

        });
    };

    /**
     * Get all resource definitions for specified studies
     * @method
     * @name CBioPortalAPIInternal#fetchResourceDefinitionsUsingPOST
     * @param {string} projection - Level of detail of the response
     * @param {} studyIds - A web service for supplying JSON formatted data to cBioPortal clients. Please note that this API is currently in beta and subject to change.
     */
    fetchResourceDefinitionsUsingPOST(parameters: {
            'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
            'studyIds': Array < string > ,
                $queryParameters ? : any,
                $domain ? : string
        }): Promise < Array < ResourceDefinition >
        > {
            return this.fetchResourceDefinitionsUsingPOSTWithHttpInfo(parameters).then(function(response: request.Response) {
                return response.body;
            });
        };
    fetchCaseListCountsUsingPOSTURL(parameters: {
        'studyViewFilter' ? : StudyViewFilter,
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/api/sample-lists-counts/fetch';

        if (parameters.$queryParameters) {
            Object.keys(parameters.$queryParameters).forEach(function(parameterName) {
                var parameter = parameters.$queryParameters[parameterName];
                queryParameters[parameterName] = parameter;
            });
        }
        let keys = Object.keys(queryParameters);
        return this.domain + path + (keys.length > 0 ? '?' + (keys.map(key => key + '=' + encodeURIComponent(queryParameters[key])).join('&')) : '');
    };

    /**
     * Fetch case list sample counts by study view filter
     * @method
     * @name CBioPortalAPIInternal#fetchCaseListCountsUsingPOST
     * @param {} studyViewFilter - A web service for supplying JSON formatted data to cBioPortal clients. Please note that this API is currently in beta and subject to change.
     */
    fetchCaseListCountsUsingPOSTWithHttpInfo(parameters: {
        'studyViewFilter' ? : StudyViewFilter,
        $queryParameters ? : any,
            $domain ? : string
    }): Promise < request.Response > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        const errorHandlers = this.errorHandlers;
        const request = this.request;
        let path = '/api/sample-lists-counts/fetch';
        let body: any;
        let queryParameters: any = {};
        let headers: any = {};
        let form: any = {};
        return new Promise(function(resolve, reject) {
            headers['Accept'] = 'application/json';
            headers['Content-Type'] = 'application/json';

            if (parameters['studyViewFilter'] !== undefined) {
                body = parameters['studyViewFilter'];
            }

            if (parameters.$queryParameters) {
                Object.keys(parameters.$queryParameters).forEach(function(parameterName) {
                    var parameter = parameters.$queryParameters[parameterName];
                    queryParameters[parameterName] = parameter;
                });
            }

            request('POST', domain + path, body, headers, queryParameters, form, reject, resolve, errorHandlers);

        });
    };

    /**
     * Fetch case list sample counts by study view filter
     * @method
     * @name CBioPortalAPIInternal#fetchCaseListCountsUsingPOST
     * @param {} studyViewFilter - A web service for supplying JSON formatted data to cBioPortal clients. Please note that this API is currently in beta and subject to change.
     */
    fetchCaseListCountsUsingPOST(parameters: {
            'studyViewFilter' ? : StudyViewFilter,
            $queryParameters ? : any,
                $domain ? : string
        }): Promise < Array < CaseListDataCount >
        > {
            return this.fetchCaseListCountsUsingPOSTWithHttpInfo(parameters).then(function(response: request.Response) {
                return response.body;
            });
        };
    fetchStructuralVariantsUsingPOSTURL(parameters: {
        'structuralVariantFilter' ? : StructuralVariantFilter,
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/api/structural-variant/fetch';

        if (parameters.$queryParameters) {
            Object.keys(parameters.$queryParameters).forEach(function(parameterName) {
                var parameter = parameters.$queryParameters[parameterName];
                queryParameters[parameterName] = parameter;
            });
        }
        let keys = Object.keys(queryParameters);
        return this.domain + path + (keys.length > 0 ? '?' + (keys.map(key => key + '=' + encodeURIComponent(queryParameters[key])).join('&')) : '');
    };

    /**
     * Fetch structural variants for entrezGeneIds and molecularProfileIds or sampleMolecularIdentifiers
     * @method
     * @name CBioPortalAPIInternal#fetchStructuralVariantsUsingPOST
     * @param {} structuralVariantFilter - A web service for supplying JSON formatted data to cBioPortal clients. Please note that this API is currently in beta and subject to change.
     */
    fetchStructuralVariantsUsingPOSTWithHttpInfo(parameters: {
        'structuralVariantFilter' ? : StructuralVariantFilter,
        $queryParameters ? : any,
            $domain ? : string
    }): Promise < request.Response > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        const errorHandlers = this.errorHandlers;
        const request = this.request;
        let path = '/api/structural-variant/fetch';
        let body: any;
        let queryParameters: any = {};
        let headers: any = {};
        let form: any = {};
        return new Promise(function(resolve, reject) {
            headers['Accept'] = 'application/json';
            headers['Content-Type'] = 'application/json';

            if (parameters['structuralVariantFilter'] !== undefined) {
                body = parameters['structuralVariantFilter'];
            }

            if (parameters.$queryParameters) {
                Object.keys(parameters.$queryParameters).forEach(function(parameterName) {
                    var parameter = parameters.$queryParameters[parameterName];
                    queryParameters[parameterName] = parameter;
                });
            }

            request('POST', domain + path, body, headers, queryParameters, form, reject, resolve, errorHandlers);

        });
    };

    /**
     * Fetch structural variants for entrezGeneIds and molecularProfileIds or sampleMolecularIdentifiers
     * @method
     * @name CBioPortalAPIInternal#fetchStructuralVariantsUsingPOST
     * @param {} structuralVariantFilter - A web service for supplying JSON formatted data to cBioPortal clients. Please note that this API is currently in beta and subject to change.
     */
    fetchStructuralVariantsUsingPOST(parameters: {
            'structuralVariantFilter' ? : StructuralVariantFilter,
            $queryParameters ? : any,
                $domain ? : string
        }): Promise < Array < StructuralVariant >
        > {
            return this.fetchStructuralVariantsUsingPOSTWithHttpInfo(parameters).then(function(response: request.Response) {
                return response.body;
            });
        };
    fetchStructuralVariantCountsUsingPOSTURL(parameters: {
        'studyViewFilter' ? : StudyViewFilter,
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/api/structuralvariant-counts/fetch';

        if (parameters.$queryParameters) {
            Object.keys(parameters.$queryParameters).forEach(function(parameterName) {
                var parameter = parameters.$queryParameters[parameterName];
                queryParameters[parameterName] = parameter;
            });
        }
        let keys = Object.keys(queryParameters);
        return this.domain + path + (keys.length > 0 ? '?' + (keys.map(key => key + '=' + encodeURIComponent(queryParameters[key])).join('&')) : '');
    };

    /**
     * Fetch structural variant genes by study view filter
     * @method
     * @name CBioPortalAPIInternal#fetchStructuralVariantCountsUsingPOST
     * @param {} studyViewFilter - A web service for supplying JSON formatted data to cBioPortal clients. Please note that this API is currently in beta and subject to change.
     */
    fetchStructuralVariantCountsUsingPOSTWithHttpInfo(parameters: {
        'studyViewFilter' ? : StudyViewFilter,
        $queryParameters ? : any,
            $domain ? : string
    }): Promise < request.Response > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        const errorHandlers = this.errorHandlers;
        const request = this.request;
        let path = '/api/structuralvariant-counts/fetch';
        let body: any;
        let queryParameters: any = {};
        let headers: any = {};
        let form: any = {};
        return new Promise(function(resolve, reject) {
            headers['Accept'] = 'application/json';
            headers['Content-Type'] = 'application/json';

            if (parameters['studyViewFilter'] !== undefined) {
                body = parameters['studyViewFilter'];
            }

            if (parameters.$queryParameters) {
                Object.keys(parameters.$queryParameters).forEach(function(parameterName) {
                    var parameter = parameters.$queryParameters[parameterName];
                    queryParameters[parameterName] = parameter;
                });
            }

            request('POST', domain + path, body, headers, queryParameters, form, reject, resolve, errorHandlers);

        });
    };

    /**
     * Fetch structural variant genes by study view filter
     * @method
     * @name CBioPortalAPIInternal#fetchStructuralVariantCountsUsingPOST
     * @param {} studyViewFilter - A web service for supplying JSON formatted data to cBioPortal clients. Please note that this API is currently in beta and subject to change.
     */
    fetchStructuralVariantCountsUsingPOST(parameters: {
            'studyViewFilter' ? : StudyViewFilter,
            $queryParameters ? : any,
                $domain ? : string
        }): Promise < Array < AlterationCountByStructuralVariant >
        > {
            return this.fetchStructuralVariantCountsUsingPOSTWithHttpInfo(parameters).then(function(response: request.Response) {
                return response.body;
            });
        };
    fetchStructuralVariantGenesUsingPOSTURL(parameters: {
        'studyViewFilter' ? : StudyViewFilter,
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/api/structuralvariant-genes/fetch';

        if (parameters.$queryParameters) {
            Object.keys(parameters.$queryParameters).forEach(function(parameterName) {
                var parameter = parameters.$queryParameters[parameterName];
                queryParameters[parameterName] = parameter;
            });
        }
        let keys = Object.keys(queryParameters);
        return this.domain + path + (keys.length > 0 ? '?' + (keys.map(key => key + '=' + encodeURIComponent(queryParameters[key])).join('&')) : '');
    };

    /**
     * Fetch structural variant genes by study view filter
     * @method
     * @name CBioPortalAPIInternal#fetchStructuralVariantGenesUsingPOST
     * @param {} studyViewFilter - A web service for supplying JSON formatted data to cBioPortal clients. Please note that this API is currently in beta and subject to change.
     */
    fetchStructuralVariantGenesUsingPOSTWithHttpInfo(parameters: {
        'studyViewFilter' ? : StudyViewFilter,
        $queryParameters ? : any,
            $domain ? : string
    }): Promise < request.Response > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        const errorHandlers = this.errorHandlers;
        const request = this.request;
        let path = '/api/structuralvariant-genes/fetch';
        let body: any;
        let queryParameters: any = {};
        let headers: any = {};
        let form: any = {};
        return new Promise(function(resolve, reject) {
            headers['Accept'] = 'application/json';
            headers['Content-Type'] = 'application/json';

            if (parameters['studyViewFilter'] !== undefined) {
                body = parameters['studyViewFilter'];
            }

            if (parameters.$queryParameters) {
                Object.keys(parameters.$queryParameters).forEach(function(parameterName) {
                    var parameter = parameters.$queryParameters[parameterName];
                    queryParameters[parameterName] = parameter;
                });
            }

            request('POST', domain + path, body, headers, queryParameters, form, reject, resolve, errorHandlers);

        });
    };

    /**
     * Fetch structural variant genes by study view filter
     * @method
     * @name CBioPortalAPIInternal#fetchStructuralVariantGenesUsingPOST
     * @param {} studyViewFilter - A web service for supplying JSON formatted data to cBioPortal clients. Please note that this API is currently in beta and subject to change.
     */
    fetchStructuralVariantGenesUsingPOST(parameters: {
            'studyViewFilter' ? : StudyViewFilter,
            $queryParameters ? : any,
                $domain ? : string
        }): Promise < Array < AlterationCountByGene >
        > {
            return this.fetchStructuralVariantGenesUsingPOSTWithHttpInfo(parameters).then(function(response: request.Response) {
                return response.body;
            });
        };
    getAllClinicalEventsInStudyUsingGETURL(parameters: {
        'studyId': string,
        'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
        'pageSize' ? : number,
        'pageNumber' ? : number,
        'sortBy' ? : "eventType" | "startNumberOfDaysSinceDiagnosis" | "endNumberOfDaysSinceDiagnosis",
        'direction' ? : "ASC" | "DESC",
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/api/studies/{studyId}/clinical-events';

        path = path.replace('{studyId}', parameters['studyId'] + '');
        if (parameters['projection'] !== undefined) {
            queryParameters['projection'] = parameters['projection'];
        }

        if (parameters['pageSize'] !== undefined) {
            queryParameters['pageSize'] = parameters['pageSize'];
        }

        if (parameters['pageNumber'] !== undefined) {
            queryParameters['pageNumber'] = parameters['pageNumber'];
        }

        if (parameters['sortBy'] !== undefined) {
            queryParameters['sortBy'] = parameters['sortBy'];
        }

        if (parameters['direction'] !== undefined) {
            queryParameters['direction'] = parameters['direction'];
        }

        if (parameters.$queryParameters) {
            Object.keys(parameters.$queryParameters).forEach(function(parameterName) {
                var parameter = parameters.$queryParameters[parameterName];
                queryParameters[parameterName] = parameter;
            });
        }
        let keys = Object.keys(queryParameters);
        return this.domain + path + (keys.length > 0 ? '?' + (keys.map(key => key + '=' + encodeURIComponent(queryParameters[key])).join('&')) : '');
    };

    /**
     * Get all clinical events in a study
     * @method
     * @name CBioPortalAPIInternal#getAllClinicalEventsInStudyUsingGET
     * @param {string} studyId - Study ID e.g. lgg_ucsf_2014
     * @param {string} projection - Level of detail of the response
     * @param {integer} pageSize - Page size of the result list
     * @param {integer} pageNumber - Page number of the result list
     * @param {string} sortBy - Name of the property that the result list is sorted by
     * @param {string} direction - Direction of the sort
     */
    getAllClinicalEventsInStudyUsingGETWithHttpInfo(parameters: {
        'studyId': string,
        'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
        'pageSize' ? : number,
        'pageNumber' ? : number,
        'sortBy' ? : "eventType" | "startNumberOfDaysSinceDiagnosis" | "endNumberOfDaysSinceDiagnosis",
        'direction' ? : "ASC" | "DESC",
        $queryParameters ? : any,
        $domain ? : string
    }): Promise < request.Response > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        const errorHandlers = this.errorHandlers;
        const request = this.request;
        let path = '/api/studies/{studyId}/clinical-events';
        let body: any;
        let queryParameters: any = {};
        let headers: any = {};
        let form: any = {};
        return new Promise(function(resolve, reject) {
            headers['Accept'] = 'application/json';

            path = path.replace('{studyId}', parameters['studyId'] + '');

            if (parameters['studyId'] === undefined) {
                reject(new Error('Missing required  parameter: studyId'));
                return;
            }

            if (parameters['projection'] !== undefined) {
                queryParameters['projection'] = parameters['projection'];
            }

            if (parameters['pageSize'] !== undefined) {
                queryParameters['pageSize'] = parameters['pageSize'];
            }

            if (parameters['pageNumber'] !== undefined) {
                queryParameters['pageNumber'] = parameters['pageNumber'];
            }

            if (parameters['sortBy'] !== undefined) {
                queryParameters['sortBy'] = parameters['sortBy'];
            }

            if (parameters['direction'] !== undefined) {
                queryParameters['direction'] = parameters['direction'];
            }

            if (parameters.$queryParameters) {
                Object.keys(parameters.$queryParameters).forEach(function(parameterName) {
                    var parameter = parameters.$queryParameters[parameterName];
                    queryParameters[parameterName] = parameter;
                });
            }

            request('GET', domain + path, body, headers, queryParameters, form, reject, resolve, errorHandlers);

        });
    };

    /**
     * Get all clinical events in a study
     * @method
     * @name CBioPortalAPIInternal#getAllClinicalEventsInStudyUsingGET
     * @param {string} studyId - Study ID e.g. lgg_ucsf_2014
     * @param {string} projection - Level of detail of the response
     * @param {integer} pageSize - Page size of the result list
     * @param {integer} pageNumber - Page number of the result list
     * @param {string} sortBy - Name of the property that the result list is sorted by
     * @param {string} direction - Direction of the sort
     */
    getAllClinicalEventsInStudyUsingGET(parameters: {
            'studyId': string,
            'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
            'pageSize' ? : number,
            'pageNumber' ? : number,
            'sortBy' ? : "eventType" | "startNumberOfDaysSinceDiagnosis" | "endNumberOfDaysSinceDiagnosis",
            'direction' ? : "ASC" | "DESC",
            $queryParameters ? : any,
            $domain ? : string
        }): Promise < Array < ClinicalEvent >
        > {
            return this.getAllClinicalEventsInStudyUsingGETWithHttpInfo(parameters).then(function(response: request.Response) {
                return response.body;
            });
        };
    getAllClinicalEventsOfPatientInStudyUsingGETURL(parameters: {
        'studyId': string,
        'patientId': string,
        'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
        'pageSize' ? : number,
        'pageNumber' ? : number,
        'sortBy' ? : "eventType" | "startNumberOfDaysSinceDiagnosis" | "endNumberOfDaysSinceDiagnosis",
        'direction' ? : "ASC" | "DESC",
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/api/studies/{studyId}/patients/{patientId}/clinical-events';

        path = path.replace('{studyId}', parameters['studyId'] + '');

        path = path.replace('{patientId}', parameters['patientId'] + '');
        if (parameters['projection'] !== undefined) {
            queryParameters['projection'] = parameters['projection'];
        }

        if (parameters['pageSize'] !== undefined) {
            queryParameters['pageSize'] = parameters['pageSize'];
        }

        if (parameters['pageNumber'] !== undefined) {
            queryParameters['pageNumber'] = parameters['pageNumber'];
        }

        if (parameters['sortBy'] !== undefined) {
            queryParameters['sortBy'] = parameters['sortBy'];
        }

        if (parameters['direction'] !== undefined) {
            queryParameters['direction'] = parameters['direction'];
        }

        if (parameters.$queryParameters) {
            Object.keys(parameters.$queryParameters).forEach(function(parameterName) {
                var parameter = parameters.$queryParameters[parameterName];
                queryParameters[parameterName] = parameter;
            });
        }
        let keys = Object.keys(queryParameters);
        return this.domain + path + (keys.length > 0 ? '?' + (keys.map(key => key + '=' + encodeURIComponent(queryParameters[key])).join('&')) : '');
    };

    /**
     * Get all clinical events of a patient in a study
     * @method
     * @name CBioPortalAPIInternal#getAllClinicalEventsOfPatientInStudyUsingGET
     * @param {string} studyId - Study ID e.g. lgg_ucsf_2014
     * @param {string} patientId - Patient ID e.g. P01
     * @param {string} projection - Level of detail of the response
     * @param {integer} pageSize - Page size of the result list
     * @param {integer} pageNumber - Page number of the result list
     * @param {string} sortBy - Name of the property that the result list is sorted by
     * @param {string} direction - Direction of the sort
     */
    getAllClinicalEventsOfPatientInStudyUsingGETWithHttpInfo(parameters: {
        'studyId': string,
        'patientId': string,
        'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
        'pageSize' ? : number,
        'pageNumber' ? : number,
        'sortBy' ? : "eventType" | "startNumberOfDaysSinceDiagnosis" | "endNumberOfDaysSinceDiagnosis",
        'direction' ? : "ASC" | "DESC",
        $queryParameters ? : any,
        $domain ? : string
    }): Promise < request.Response > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        const errorHandlers = this.errorHandlers;
        const request = this.request;
        let path = '/api/studies/{studyId}/patients/{patientId}/clinical-events';
        let body: any;
        let queryParameters: any = {};
        let headers: any = {};
        let form: any = {};
        return new Promise(function(resolve, reject) {
            headers['Accept'] = 'application/json';

            path = path.replace('{studyId}', parameters['studyId'] + '');

            if (parameters['studyId'] === undefined) {
                reject(new Error('Missing required  parameter: studyId'));
                return;
            }

            path = path.replace('{patientId}', parameters['patientId'] + '');

            if (parameters['patientId'] === undefined) {
                reject(new Error('Missing required  parameter: patientId'));
                return;
            }

            if (parameters['projection'] !== undefined) {
                queryParameters['projection'] = parameters['projection'];
            }

            if (parameters['pageSize'] !== undefined) {
                queryParameters['pageSize'] = parameters['pageSize'];
            }

            if (parameters['pageNumber'] !== undefined) {
                queryParameters['pageNumber'] = parameters['pageNumber'];
            }

            if (parameters['sortBy'] !== undefined) {
                queryParameters['sortBy'] = parameters['sortBy'];
            }

            if (parameters['direction'] !== undefined) {
                queryParameters['direction'] = parameters['direction'];
            }

            if (parameters.$queryParameters) {
                Object.keys(parameters.$queryParameters).forEach(function(parameterName) {
                    var parameter = parameters.$queryParameters[parameterName];
                    queryParameters[parameterName] = parameter;
                });
            }

            request('GET', domain + path, body, headers, queryParameters, form, reject, resolve, errorHandlers);

        });
    };

    /**
     * Get all clinical events of a patient in a study
     * @method
     * @name CBioPortalAPIInternal#getAllClinicalEventsOfPatientInStudyUsingGET
     * @param {string} studyId - Study ID e.g. lgg_ucsf_2014
     * @param {string} patientId - Patient ID e.g. P01
     * @param {string} projection - Level of detail of the response
     * @param {integer} pageSize - Page size of the result list
     * @param {integer} pageNumber - Page number of the result list
     * @param {string} sortBy - Name of the property that the result list is sorted by
     * @param {string} direction - Direction of the sort
     */
    getAllClinicalEventsOfPatientInStudyUsingGET(parameters: {
            'studyId': string,
            'patientId': string,
            'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
            'pageSize' ? : number,
            'pageNumber' ? : number,
            'sortBy' ? : "eventType" | "startNumberOfDaysSinceDiagnosis" | "endNumberOfDaysSinceDiagnosis",
            'direction' ? : "ASC" | "DESC",
            $queryParameters ? : any,
            $domain ? : string
        }): Promise < Array < ClinicalEvent >
        > {
            return this.getAllClinicalEventsOfPatientInStudyUsingGETWithHttpInfo(parameters).then(function(response: request.Response) {
                return response.body;
            });
        };
    getAllResourceDataOfPatientInStudyUsingGETURL(parameters: {
        'studyId': string,
        'patientId': string,
        'resourceId' ? : string,
        'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
        'pageSize' ? : number,
        'pageNumber' ? : number,
        'sortBy' ? : "ResourceId" | "url",
        'direction' ? : "ASC" | "DESC",
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/api/studies/{studyId}/patients/{patientId}/resource-data';

        path = path.replace('{studyId}', parameters['studyId'] + '');

        path = path.replace('{patientId}', parameters['patientId'] + '');
        if (parameters['resourceId'] !== undefined) {
            queryParameters['resourceId'] = parameters['resourceId'];
        }

        if (parameters['projection'] !== undefined) {
            queryParameters['projection'] = parameters['projection'];
        }

        if (parameters['pageSize'] !== undefined) {
            queryParameters['pageSize'] = parameters['pageSize'];
        }

        if (parameters['pageNumber'] !== undefined) {
            queryParameters['pageNumber'] = parameters['pageNumber'];
        }

        if (parameters['sortBy'] !== undefined) {
            queryParameters['sortBy'] = parameters['sortBy'];
        }

        if (parameters['direction'] !== undefined) {
            queryParameters['direction'] = parameters['direction'];
        }

        if (parameters.$queryParameters) {
            Object.keys(parameters.$queryParameters).forEach(function(parameterName) {
                var parameter = parameters.$queryParameters[parameterName];
                queryParameters[parameterName] = parameter;
            });
        }
        let keys = Object.keys(queryParameters);
        return this.domain + path + (keys.length > 0 ? '?' + (keys.map(key => key + '=' + encodeURIComponent(queryParameters[key])).join('&')) : '');
    };

    /**
     * Get all resource data of a patient in a study
     * @method
     * @name CBioPortalAPIInternal#getAllResourceDataOfPatientInStudyUsingGET
     * @param {string} studyId - Study ID e.g. acc_tcga
     * @param {string} patientId - Patient ID e.g. TCGA-OR-A5J2
     * @param {string} resourceId - Resource ID
     * @param {string} projection - Level of detail of the response
     * @param {integer} pageSize - Page size of the result list
     * @param {integer} pageNumber - Page number of the result list
     * @param {string} sortBy - Name of the property that the result list is sorted by
     * @param {string} direction - Direction of the sort
     */
    getAllResourceDataOfPatientInStudyUsingGETWithHttpInfo(parameters: {
        'studyId': string,
        'patientId': string,
        'resourceId' ? : string,
        'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
        'pageSize' ? : number,
        'pageNumber' ? : number,
        'sortBy' ? : "ResourceId" | "url",
        'direction' ? : "ASC" | "DESC",
        $queryParameters ? : any,
        $domain ? : string
    }): Promise < request.Response > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        const errorHandlers = this.errorHandlers;
        const request = this.request;
        let path = '/api/studies/{studyId}/patients/{patientId}/resource-data';
        let body: any;
        let queryParameters: any = {};
        let headers: any = {};
        let form: any = {};
        return new Promise(function(resolve, reject) {
            headers['Accept'] = 'application/json';

            path = path.replace('{studyId}', parameters['studyId'] + '');

            if (parameters['studyId'] === undefined) {
                reject(new Error('Missing required  parameter: studyId'));
                return;
            }

            path = path.replace('{patientId}', parameters['patientId'] + '');

            if (parameters['patientId'] === undefined) {
                reject(new Error('Missing required  parameter: patientId'));
                return;
            }

            if (parameters['resourceId'] !== undefined) {
                queryParameters['resourceId'] = parameters['resourceId'];
            }

            if (parameters['projection'] !== undefined) {
                queryParameters['projection'] = parameters['projection'];
            }

            if (parameters['pageSize'] !== undefined) {
                queryParameters['pageSize'] = parameters['pageSize'];
            }

            if (parameters['pageNumber'] !== undefined) {
                queryParameters['pageNumber'] = parameters['pageNumber'];
            }

            if (parameters['sortBy'] !== undefined) {
                queryParameters['sortBy'] = parameters['sortBy'];
            }

            if (parameters['direction'] !== undefined) {
                queryParameters['direction'] = parameters['direction'];
            }

            if (parameters.$queryParameters) {
                Object.keys(parameters.$queryParameters).forEach(function(parameterName) {
                    var parameter = parameters.$queryParameters[parameterName];
                    queryParameters[parameterName] = parameter;
                });
            }

            request('GET', domain + path, body, headers, queryParameters, form, reject, resolve, errorHandlers);

        });
    };

    /**
     * Get all resource data of a patient in a study
     * @method
     * @name CBioPortalAPIInternal#getAllResourceDataOfPatientInStudyUsingGET
     * @param {string} studyId - Study ID e.g. acc_tcga
     * @param {string} patientId - Patient ID e.g. TCGA-OR-A5J2
     * @param {string} resourceId - Resource ID
     * @param {string} projection - Level of detail of the response
     * @param {integer} pageSize - Page size of the result list
     * @param {integer} pageNumber - Page number of the result list
     * @param {string} sortBy - Name of the property that the result list is sorted by
     * @param {string} direction - Direction of the sort
     */
    getAllResourceDataOfPatientInStudyUsingGET(parameters: {
            'studyId': string,
            'patientId': string,
            'resourceId' ? : string,
            'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
            'pageSize' ? : number,
            'pageNumber' ? : number,
            'sortBy' ? : "ResourceId" | "url",
            'direction' ? : "ASC" | "DESC",
            $queryParameters ? : any,
            $domain ? : string
        }): Promise < Array < ResourceData >
        > {
            return this.getAllResourceDataOfPatientInStudyUsingGETWithHttpInfo(parameters).then(function(response: request.Response) {
                return response.body;
            });
        };
    getAllStudyResourceDataInStudyUsingGETURL(parameters: {
        'studyId': string,
        'resourceId' ? : string,
        'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
        'pageSize' ? : number,
        'pageNumber' ? : number,
        'sortBy' ? : "ResourceId" | "url",
        'direction' ? : "ASC" | "DESC",
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/api/studies/{studyId}/resource-data';

        path = path.replace('{studyId}', parameters['studyId'] + '');
        if (parameters['resourceId'] !== undefined) {
            queryParameters['resourceId'] = parameters['resourceId'];
        }

        if (parameters['projection'] !== undefined) {
            queryParameters['projection'] = parameters['projection'];
        }

        if (parameters['pageSize'] !== undefined) {
            queryParameters['pageSize'] = parameters['pageSize'];
        }

        if (parameters['pageNumber'] !== undefined) {
            queryParameters['pageNumber'] = parameters['pageNumber'];
        }

        if (parameters['sortBy'] !== undefined) {
            queryParameters['sortBy'] = parameters['sortBy'];
        }

        if (parameters['direction'] !== undefined) {
            queryParameters['direction'] = parameters['direction'];
        }

        if (parameters.$queryParameters) {
            Object.keys(parameters.$queryParameters).forEach(function(parameterName) {
                var parameter = parameters.$queryParameters[parameterName];
                queryParameters[parameterName] = parameter;
            });
        }
        let keys = Object.keys(queryParameters);
        return this.domain + path + (keys.length > 0 ? '?' + (keys.map(key => key + '=' + encodeURIComponent(queryParameters[key])).join('&')) : '');
    };

    /**
     * Get all resource data for a study
     * @method
     * @name CBioPortalAPIInternal#getAllStudyResourceDataInStudyUsingGET
     * @param {string} studyId - Study ID e.g. acc_tcga
     * @param {string} resourceId - Resource ID
     * @param {string} projection - Level of detail of the response
     * @param {integer} pageSize - Page size of the result list
     * @param {integer} pageNumber - Page number of the result list
     * @param {string} sortBy - Name of the property that the result list is sorted by
     * @param {string} direction - Direction of the sort
     */
    getAllStudyResourceDataInStudyUsingGETWithHttpInfo(parameters: {
        'studyId': string,
        'resourceId' ? : string,
        'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
        'pageSize' ? : number,
        'pageNumber' ? : number,
        'sortBy' ? : "ResourceId" | "url",
        'direction' ? : "ASC" | "DESC",
        $queryParameters ? : any,
        $domain ? : string
    }): Promise < request.Response > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        const errorHandlers = this.errorHandlers;
        const request = this.request;
        let path = '/api/studies/{studyId}/resource-data';
        let body: any;
        let queryParameters: any = {};
        let headers: any = {};
        let form: any = {};
        return new Promise(function(resolve, reject) {
            headers['Accept'] = 'application/json';

            path = path.replace('{studyId}', parameters['studyId'] + '');

            if (parameters['studyId'] === undefined) {
                reject(new Error('Missing required  parameter: studyId'));
                return;
            }

            if (parameters['resourceId'] !== undefined) {
                queryParameters['resourceId'] = parameters['resourceId'];
            }

            if (parameters['projection'] !== undefined) {
                queryParameters['projection'] = parameters['projection'];
            }

            if (parameters['pageSize'] !== undefined) {
                queryParameters['pageSize'] = parameters['pageSize'];
            }

            if (parameters['pageNumber'] !== undefined) {
                queryParameters['pageNumber'] = parameters['pageNumber'];
            }

            if (parameters['sortBy'] !== undefined) {
                queryParameters['sortBy'] = parameters['sortBy'];
            }

            if (parameters['direction'] !== undefined) {
                queryParameters['direction'] = parameters['direction'];
            }

            if (parameters.$queryParameters) {
                Object.keys(parameters.$queryParameters).forEach(function(parameterName) {
                    var parameter = parameters.$queryParameters[parameterName];
                    queryParameters[parameterName] = parameter;
                });
            }

            request('GET', domain + path, body, headers, queryParameters, form, reject, resolve, errorHandlers);

        });
    };

    /**
     * Get all resource data for a study
     * @method
     * @name CBioPortalAPIInternal#getAllStudyResourceDataInStudyUsingGET
     * @param {string} studyId - Study ID e.g. acc_tcga
     * @param {string} resourceId - Resource ID
     * @param {string} projection - Level of detail of the response
     * @param {integer} pageSize - Page size of the result list
     * @param {integer} pageNumber - Page number of the result list
     * @param {string} sortBy - Name of the property that the result list is sorted by
     * @param {string} direction - Direction of the sort
     */
    getAllStudyResourceDataInStudyUsingGET(parameters: {
            'studyId': string,
            'resourceId' ? : string,
            'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
            'pageSize' ? : number,
            'pageNumber' ? : number,
            'sortBy' ? : "ResourceId" | "url",
            'direction' ? : "ASC" | "DESC",
            $queryParameters ? : any,
            $domain ? : string
        }): Promise < Array < ResourceData >
        > {
            return this.getAllStudyResourceDataInStudyUsingGETWithHttpInfo(parameters).then(function(response: request.Response) {
                return response.body;
            });
        };
    getAllStudyResourceDataInStudyPatientSampleUsingGETURL(parameters: {
        'studyId': string,
        'resourceId' ? : string,
        'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
        'pageSize' ? : number,
        'pageNumber' ? : number,
        'sortBy' ? : "ResourceId" | "url",
        'direction' ? : "ASC" | "DESC",
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/api/studies/{studyId}/resource-data-all';

        path = path.replace('{studyId}', parameters['studyId'] + '');
        if (parameters['resourceId'] !== undefined) {
            queryParameters['resourceId'] = parameters['resourceId'];
        }

        if (parameters['projection'] !== undefined) {
            queryParameters['projection'] = parameters['projection'];
        }

        if (parameters['pageSize'] !== undefined) {
            queryParameters['pageSize'] = parameters['pageSize'];
        }

        if (parameters['pageNumber'] !== undefined) {
            queryParameters['pageNumber'] = parameters['pageNumber'];
        }

        if (parameters['sortBy'] !== undefined) {
            queryParameters['sortBy'] = parameters['sortBy'];
        }

        if (parameters['direction'] !== undefined) {
            queryParameters['direction'] = parameters['direction'];
        }

        if (parameters.$queryParameters) {
            Object.keys(parameters.$queryParameters).forEach(function(parameterName) {
                var parameter = parameters.$queryParameters[parameterName];
                queryParameters[parameterName] = parameter;
            });
        }
        let keys = Object.keys(queryParameters);
        return this.domain + path + (keys.length > 0 ? '?' + (keys.map(key => key + '=' + encodeURIComponent(queryParameters[key])).join('&')) : '');
    };

    /**
     * Get all resource data for for all patients and all samples within a study
     * @method
     * @name CBioPortalAPIInternal#getAllStudyResourceDataInStudyPatientSampleUsingGET
     * @param {string} studyId - Study ID e.g. acc_tcga
     * @param {string} resourceId - Resource ID
     * @param {string} projection - Level of detail of the response
     * @param {integer} pageSize - Page size of the result list
     * @param {integer} pageNumber - Page number of the result list
     * @param {string} sortBy - Name of the property that the result list is sorted by
     * @param {string} direction - Direction of the sort
     */
    getAllStudyResourceDataInStudyPatientSampleUsingGETWithHttpInfo(parameters: {
        'studyId': string,
        'resourceId' ? : string,
        'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
        'pageSize' ? : number,
        'pageNumber' ? : number,
        'sortBy' ? : "ResourceId" | "url",
        'direction' ? : "ASC" | "DESC",
        $queryParameters ? : any,
        $domain ? : string
    }): Promise < request.Response > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        const errorHandlers = this.errorHandlers;
        const request = this.request;
        let path = '/api/studies/{studyId}/resource-data-all';
        let body: any;
        let queryParameters: any = {};
        let headers: any = {};
        let form: any = {};
        return new Promise(function(resolve, reject) {
            headers['Accept'] = 'application/json';

            path = path.replace('{studyId}', parameters['studyId'] + '');

            if (parameters['studyId'] === undefined) {
                reject(new Error('Missing required  parameter: studyId'));
                return;
            }

            if (parameters['resourceId'] !== undefined) {
                queryParameters['resourceId'] = parameters['resourceId'];
            }

            if (parameters['projection'] !== undefined) {
                queryParameters['projection'] = parameters['projection'];
            }

            if (parameters['pageSize'] !== undefined) {
                queryParameters['pageSize'] = parameters['pageSize'];
            }

            if (parameters['pageNumber'] !== undefined) {
                queryParameters['pageNumber'] = parameters['pageNumber'];
            }

            if (parameters['sortBy'] !== undefined) {
                queryParameters['sortBy'] = parameters['sortBy'];
            }

            if (parameters['direction'] !== undefined) {
                queryParameters['direction'] = parameters['direction'];
            }

            if (parameters.$queryParameters) {
                Object.keys(parameters.$queryParameters).forEach(function(parameterName) {
                    var parameter = parameters.$queryParameters[parameterName];
                    queryParameters[parameterName] = parameter;
                });
            }

            request('GET', domain + path, body, headers, queryParameters, form, reject, resolve, errorHandlers);

        });
    };

    /**
     * Get all resource data for for all patients and all samples within a study
     * @method
     * @name CBioPortalAPIInternal#getAllStudyResourceDataInStudyPatientSampleUsingGET
     * @param {string} studyId - Study ID e.g. acc_tcga
     * @param {string} resourceId - Resource ID
     * @param {string} projection - Level of detail of the response
     * @param {integer} pageSize - Page size of the result list
     * @param {integer} pageNumber - Page number of the result list
     * @param {string} sortBy - Name of the property that the result list is sorted by
     * @param {string} direction - Direction of the sort
     */
    getAllStudyResourceDataInStudyPatientSampleUsingGET(parameters: {
            'studyId': string,
            'resourceId' ? : string,
            'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
            'pageSize' ? : number,
            'pageNumber' ? : number,
            'sortBy' ? : "ResourceId" | "url",
            'direction' ? : "ASC" | "DESC",
            $queryParameters ? : any,
            $domain ? : string
        }): Promise < Array < ResourceData >
        > {
            return this.getAllStudyResourceDataInStudyPatientSampleUsingGETWithHttpInfo(parameters).then(function(response: request.Response) {
                return response.body;
            });
        };
    getAllResourceDefinitionsInStudyUsingGETURL(parameters: {
        'studyId': string,
        'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
        'pageSize' ? : number,
        'pageNumber' ? : number,
        'sortBy' ? : "resourceId" | "displayName" | "description" | "resourceType" | "priority" | "openByDefault" | "studyId" | "customMetaData",
        'direction' ? : "ASC" | "DESC",
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/api/studies/{studyId}/resource-definitions';

        path = path.replace('{studyId}', parameters['studyId'] + '');
        if (parameters['projection'] !== undefined) {
            queryParameters['projection'] = parameters['projection'];
        }

        if (parameters['pageSize'] !== undefined) {
            queryParameters['pageSize'] = parameters['pageSize'];
        }

        if (parameters['pageNumber'] !== undefined) {
            queryParameters['pageNumber'] = parameters['pageNumber'];
        }

        if (parameters['sortBy'] !== undefined) {
            queryParameters['sortBy'] = parameters['sortBy'];
        }

        if (parameters['direction'] !== undefined) {
            queryParameters['direction'] = parameters['direction'];
        }

        if (parameters.$queryParameters) {
            Object.keys(parameters.$queryParameters).forEach(function(parameterName) {
                var parameter = parameters.$queryParameters[parameterName];
                queryParameters[parameterName] = parameter;
            });
        }
        let keys = Object.keys(queryParameters);
        return this.domain + path + (keys.length > 0 ? '?' + (keys.map(key => key + '=' + encodeURIComponent(queryParameters[key])).join('&')) : '');
    };

    /**
     * Get all resource definitions in the specified study
     * @method
     * @name CBioPortalAPIInternal#getAllResourceDefinitionsInStudyUsingGET
     * @param {string} studyId - Study ID e.g. acc_tcga
     * @param {string} projection - Level of detail of the response
     * @param {integer} pageSize - Page size of the result list
     * @param {integer} pageNumber - Page number of the result list
     * @param {string} sortBy - Name of the property that the result list is sorted by
     * @param {string} direction - Direction of the sort
     */
    getAllResourceDefinitionsInStudyUsingGETWithHttpInfo(parameters: {
        'studyId': string,
        'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
        'pageSize' ? : number,
        'pageNumber' ? : number,
        'sortBy' ? : "resourceId" | "displayName" | "description" | "resourceType" | "priority" | "openByDefault" | "studyId" | "customMetaData",
        'direction' ? : "ASC" | "DESC",
        $queryParameters ? : any,
        $domain ? : string
    }): Promise < request.Response > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        const errorHandlers = this.errorHandlers;
        const request = this.request;
        let path = '/api/studies/{studyId}/resource-definitions';
        let body: any;
        let queryParameters: any = {};
        let headers: any = {};
        let form: any = {};
        return new Promise(function(resolve, reject) {
            headers['Accept'] = 'application/json';

            path = path.replace('{studyId}', parameters['studyId'] + '');

            if (parameters['studyId'] === undefined) {
                reject(new Error('Missing required  parameter: studyId'));
                return;
            }

            if (parameters['projection'] !== undefined) {
                queryParameters['projection'] = parameters['projection'];
            }

            if (parameters['pageSize'] !== undefined) {
                queryParameters['pageSize'] = parameters['pageSize'];
            }

            if (parameters['pageNumber'] !== undefined) {
                queryParameters['pageNumber'] = parameters['pageNumber'];
            }

            if (parameters['sortBy'] !== undefined) {
                queryParameters['sortBy'] = parameters['sortBy'];
            }

            if (parameters['direction'] !== undefined) {
                queryParameters['direction'] = parameters['direction'];
            }

            if (parameters.$queryParameters) {
                Object.keys(parameters.$queryParameters).forEach(function(parameterName) {
                    var parameter = parameters.$queryParameters[parameterName];
                    queryParameters[parameterName] = parameter;
                });
            }

            request('GET', domain + path, body, headers, queryParameters, form, reject, resolve, errorHandlers);

        });
    };

    /**
     * Get all resource definitions in the specified study
     * @method
     * @name CBioPortalAPIInternal#getAllResourceDefinitionsInStudyUsingGET
     * @param {string} studyId - Study ID e.g. acc_tcga
     * @param {string} projection - Level of detail of the response
     * @param {integer} pageSize - Page size of the result list
     * @param {integer} pageNumber - Page number of the result list
     * @param {string} sortBy - Name of the property that the result list is sorted by
     * @param {string} direction - Direction of the sort
     */
    getAllResourceDefinitionsInStudyUsingGET(parameters: {
            'studyId': string,
            'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
            'pageSize' ? : number,
            'pageNumber' ? : number,
            'sortBy' ? : "resourceId" | "displayName" | "description" | "resourceType" | "priority" | "openByDefault" | "studyId" | "customMetaData",
            'direction' ? : "ASC" | "DESC",
            $queryParameters ? : any,
            $domain ? : string
        }): Promise < Array < ResourceDefinition >
        > {
            return this.getAllResourceDefinitionsInStudyUsingGETWithHttpInfo(parameters).then(function(response: request.Response) {
                return response.body;
            });
        };
    getResourceDefinitionInStudyUsingGETURL(parameters: {
        'studyId': string,
        'resourceId': string,
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/api/studies/{studyId}/resource-definitions/{resourceId}';

        path = path.replace('{studyId}', parameters['studyId'] + '');

        path = path.replace('{resourceId}', parameters['resourceId'] + '');

        if (parameters.$queryParameters) {
            Object.keys(parameters.$queryParameters).forEach(function(parameterName) {
                var parameter = parameters.$queryParameters[parameterName];
                queryParameters[parameterName] = parameter;
            });
        }
        let keys = Object.keys(queryParameters);
        return this.domain + path + (keys.length > 0 ? '?' + (keys.map(key => key + '=' + encodeURIComponent(queryParameters[key])).join('&')) : '');
    };

    /**
     * Get specified resource definition
     * @method
     * @name CBioPortalAPIInternal#getResourceDefinitionInStudyUsingGET
     * @param {string} studyId - Study ID e.g. acc_tcga
     * @param {string} resourceId - Resource ID
     */
    getResourceDefinitionInStudyUsingGETWithHttpInfo(parameters: {
        'studyId': string,
        'resourceId': string,
        $queryParameters ? : any,
        $domain ? : string
    }): Promise < request.Response > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        const errorHandlers = this.errorHandlers;
        const request = this.request;
        let path = '/api/studies/{studyId}/resource-definitions/{resourceId}';
        let body: any;
        let queryParameters: any = {};
        let headers: any = {};
        let form: any = {};
        return new Promise(function(resolve, reject) {
            headers['Accept'] = 'application/json';

            path = path.replace('{studyId}', parameters['studyId'] + '');

            if (parameters['studyId'] === undefined) {
                reject(new Error('Missing required  parameter: studyId'));
                return;
            }

            path = path.replace('{resourceId}', parameters['resourceId'] + '');

            if (parameters['resourceId'] === undefined) {
                reject(new Error('Missing required  parameter: resourceId'));
                return;
            }

            if (parameters.$queryParameters) {
                Object.keys(parameters.$queryParameters).forEach(function(parameterName) {
                    var parameter = parameters.$queryParameters[parameterName];
                    queryParameters[parameterName] = parameter;
                });
            }

            request('GET', domain + path, body, headers, queryParameters, form, reject, resolve, errorHandlers);

        });
    };

    /**
     * Get specified resource definition
     * @method
     * @name CBioPortalAPIInternal#getResourceDefinitionInStudyUsingGET
     * @param {string} studyId - Study ID e.g. acc_tcga
     * @param {string} resourceId - Resource ID
     */
    getResourceDefinitionInStudyUsingGET(parameters: {
        'studyId': string,
        'resourceId': string,
        $queryParameters ? : any,
        $domain ? : string
    }): Promise < ResourceDefinition > {
        return this.getResourceDefinitionInStudyUsingGETWithHttpInfo(parameters).then(function(response: request.Response) {
            return response.body;
        });
    };
    getAllResourceDataOfSampleInStudyUsingGETURL(parameters: {
        'studyId': string,
        'sampleId': string,
        'resourceId' ? : string,
        'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
        'pageSize' ? : number,
        'pageNumber' ? : number,
        'sortBy' ? : "ResourceId" | "url",
        'direction' ? : "ASC" | "DESC",
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/api/studies/{studyId}/samples/{sampleId}/resource-data';

        path = path.replace('{studyId}', parameters['studyId'] + '');

        path = path.replace('{sampleId}', parameters['sampleId'] + '');
        if (parameters['resourceId'] !== undefined) {
            queryParameters['resourceId'] = parameters['resourceId'];
        }

        if (parameters['projection'] !== undefined) {
            queryParameters['projection'] = parameters['projection'];
        }

        if (parameters['pageSize'] !== undefined) {
            queryParameters['pageSize'] = parameters['pageSize'];
        }

        if (parameters['pageNumber'] !== undefined) {
            queryParameters['pageNumber'] = parameters['pageNumber'];
        }

        if (parameters['sortBy'] !== undefined) {
            queryParameters['sortBy'] = parameters['sortBy'];
        }

        if (parameters['direction'] !== undefined) {
            queryParameters['direction'] = parameters['direction'];
        }

        if (parameters.$queryParameters) {
            Object.keys(parameters.$queryParameters).forEach(function(parameterName) {
                var parameter = parameters.$queryParameters[parameterName];
                queryParameters[parameterName] = parameter;
            });
        }
        let keys = Object.keys(queryParameters);
        return this.domain + path + (keys.length > 0 ? '?' + (keys.map(key => key + '=' + encodeURIComponent(queryParameters[key])).join('&')) : '');
    };

    /**
     * Get all resource data of a sample in a study
     * @method
     * @name CBioPortalAPIInternal#getAllResourceDataOfSampleInStudyUsingGET
     * @param {string} studyId - Study ID e.g. acc_tcga
     * @param {string} sampleId - Sample ID e.g. TCGA-OR-A5J2-01
     * @param {string} resourceId - Resource ID
     * @param {string} projection - Level of detail of the response
     * @param {integer} pageSize - Page size of the result list
     * @param {integer} pageNumber - Page number of the result list
     * @param {string} sortBy - Name of the property that the result list is sorted by
     * @param {string} direction - Direction of the sort
     */
    getAllResourceDataOfSampleInStudyUsingGETWithHttpInfo(parameters: {
        'studyId': string,
        'sampleId': string,
        'resourceId' ? : string,
        'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
        'pageSize' ? : number,
        'pageNumber' ? : number,
        'sortBy' ? : "ResourceId" | "url",
        'direction' ? : "ASC" | "DESC",
        $queryParameters ? : any,
        $domain ? : string
    }): Promise < request.Response > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        const errorHandlers = this.errorHandlers;
        const request = this.request;
        let path = '/api/studies/{studyId}/samples/{sampleId}/resource-data';
        let body: any;
        let queryParameters: any = {};
        let headers: any = {};
        let form: any = {};
        return new Promise(function(resolve, reject) {
            headers['Accept'] = 'application/json';

            path = path.replace('{studyId}', parameters['studyId'] + '');

            if (parameters['studyId'] === undefined) {
                reject(new Error('Missing required  parameter: studyId'));
                return;
            }

            path = path.replace('{sampleId}', parameters['sampleId'] + '');

            if (parameters['sampleId'] === undefined) {
                reject(new Error('Missing required  parameter: sampleId'));
                return;
            }

            if (parameters['resourceId'] !== undefined) {
                queryParameters['resourceId'] = parameters['resourceId'];
            }

            if (parameters['projection'] !== undefined) {
                queryParameters['projection'] = parameters['projection'];
            }

            if (parameters['pageSize'] !== undefined) {
                queryParameters['pageSize'] = parameters['pageSize'];
            }

            if (parameters['pageNumber'] !== undefined) {
                queryParameters['pageNumber'] = parameters['pageNumber'];
            }

            if (parameters['sortBy'] !== undefined) {
                queryParameters['sortBy'] = parameters['sortBy'];
            }

            if (parameters['direction'] !== undefined) {
                queryParameters['direction'] = parameters['direction'];
            }

            if (parameters.$queryParameters) {
                Object.keys(parameters.$queryParameters).forEach(function(parameterName) {
                    var parameter = parameters.$queryParameters[parameterName];
                    queryParameters[parameterName] = parameter;
                });
            }

            request('GET', domain + path, body, headers, queryParameters, form, reject, resolve, errorHandlers);

        });
    };

    /**
     * Get all resource data of a sample in a study
     * @method
     * @name CBioPortalAPIInternal#getAllResourceDataOfSampleInStudyUsingGET
     * @param {string} studyId - Study ID e.g. acc_tcga
     * @param {string} sampleId - Sample ID e.g. TCGA-OR-A5J2-01
     * @param {string} resourceId - Resource ID
     * @param {string} projection - Level of detail of the response
     * @param {integer} pageSize - Page size of the result list
     * @param {integer} pageNumber - Page number of the result list
     * @param {string} sortBy - Name of the property that the result list is sorted by
     * @param {string} direction - Direction of the sort
     */
    getAllResourceDataOfSampleInStudyUsingGET(parameters: {
            'studyId': string,
            'sampleId': string,
            'resourceId' ? : string,
            'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
            'pageSize' ? : number,
            'pageNumber' ? : number,
            'sortBy' ? : "ResourceId" | "url",
            'direction' ? : "ASC" | "DESC",
            $queryParameters ? : any,
            $domain ? : string
        }): Promise < Array < ResourceData >
        > {
            return this.getAllResourceDataOfSampleInStudyUsingGETWithHttpInfo(parameters).then(function(response: request.Response) {
                return response.body;
            });
        };
    getSignificantCopyNumberRegionsUsingGETURL(parameters: {
        'studyId': string,
        'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
        'pageSize' ? : number,
        'pageNumber' ? : number,
        'sortBy' ? : "chromosome" | "cytoband" | "widePeakStart" | "widePeakEnd" | "qValue" | "amp",
        'direction' ? : "ASC" | "DESC",
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/api/studies/{studyId}/significant-copy-number-regions';

        path = path.replace('{studyId}', parameters['studyId'] + '');
        if (parameters['projection'] !== undefined) {
            queryParameters['projection'] = parameters['projection'];
        }

        if (parameters['pageSize'] !== undefined) {
            queryParameters['pageSize'] = parameters['pageSize'];
        }

        if (parameters['pageNumber'] !== undefined) {
            queryParameters['pageNumber'] = parameters['pageNumber'];
        }

        if (parameters['sortBy'] !== undefined) {
            queryParameters['sortBy'] = parameters['sortBy'];
        }

        if (parameters['direction'] !== undefined) {
            queryParameters['direction'] = parameters['direction'];
        }

        if (parameters.$queryParameters) {
            Object.keys(parameters.$queryParameters).forEach(function(parameterName) {
                var parameter = parameters.$queryParameters[parameterName];
                queryParameters[parameterName] = parameter;
            });
        }
        let keys = Object.keys(queryParameters);
        return this.domain + path + (keys.length > 0 ? '?' + (keys.map(key => key + '=' + encodeURIComponent(queryParameters[key])).join('&')) : '');
    };

    /**
     * Get significant copy number alteration regions in a study
     * @method
     * @name CBioPortalAPIInternal#getSignificantCopyNumberRegionsUsingGET
     * @param {string} studyId - Study ID e.g. acc_tcga
     * @param {string} projection - Level of detail of the response
     * @param {integer} pageSize - Page size of the result list
     * @param {integer} pageNumber - Page number of the result list
     * @param {string} sortBy - Name of the property that the result list is sorted by
     * @param {string} direction - Direction of the sort
     */
    getSignificantCopyNumberRegionsUsingGETWithHttpInfo(parameters: {
        'studyId': string,
        'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
        'pageSize' ? : number,
        'pageNumber' ? : number,
        'sortBy' ? : "chromosome" | "cytoband" | "widePeakStart" | "widePeakEnd" | "qValue" | "amp",
        'direction' ? : "ASC" | "DESC",
        $queryParameters ? : any,
        $domain ? : string
    }): Promise < request.Response > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        const errorHandlers = this.errorHandlers;
        const request = this.request;
        let path = '/api/studies/{studyId}/significant-copy-number-regions';
        let body: any;
        let queryParameters: any = {};
        let headers: any = {};
        let form: any = {};
        return new Promise(function(resolve, reject) {
            headers['Accept'] = 'application/json';

            path = path.replace('{studyId}', parameters['studyId'] + '');

            if (parameters['studyId'] === undefined) {
                reject(new Error('Missing required  parameter: studyId'));
                return;
            }

            if (parameters['projection'] !== undefined) {
                queryParameters['projection'] = parameters['projection'];
            }

            if (parameters['pageSize'] !== undefined) {
                queryParameters['pageSize'] = parameters['pageSize'];
            }

            if (parameters['pageNumber'] !== undefined) {
                queryParameters['pageNumber'] = parameters['pageNumber'];
            }

            if (parameters['sortBy'] !== undefined) {
                queryParameters['sortBy'] = parameters['sortBy'];
            }

            if (parameters['direction'] !== undefined) {
                queryParameters['direction'] = parameters['direction'];
            }

            if (parameters.$queryParameters) {
                Object.keys(parameters.$queryParameters).forEach(function(parameterName) {
                    var parameter = parameters.$queryParameters[parameterName];
                    queryParameters[parameterName] = parameter;
                });
            }

            request('GET', domain + path, body, headers, queryParameters, form, reject, resolve, errorHandlers);

        });
    };

    /**
     * Get significant copy number alteration regions in a study
     * @method
     * @name CBioPortalAPIInternal#getSignificantCopyNumberRegionsUsingGET
     * @param {string} studyId - Study ID e.g. acc_tcga
     * @param {string} projection - Level of detail of the response
     * @param {integer} pageSize - Page size of the result list
     * @param {integer} pageNumber - Page number of the result list
     * @param {string} sortBy - Name of the property that the result list is sorted by
     * @param {string} direction - Direction of the sort
     */
    getSignificantCopyNumberRegionsUsingGET(parameters: {
            'studyId': string,
            'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
            'pageSize' ? : number,
            'pageNumber' ? : number,
            'sortBy' ? : "chromosome" | "cytoband" | "widePeakStart" | "widePeakEnd" | "qValue" | "amp",
            'direction' ? : "ASC" | "DESC",
            $queryParameters ? : any,
            $domain ? : string
        }): Promise < Array < Gistic >
        > {
            return this.getSignificantCopyNumberRegionsUsingGETWithHttpInfo(parameters).then(function(response: request.Response) {
                return response.body;
            });
        };
    getSignificantlyMutatedGenesUsingGETURL(parameters: {
        'studyId': string,
        'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
        'pageSize' ? : number,
        'pageNumber' ? : number,
        'sortBy' ? : "entrezGeneId" | "hugoGeneSymbol" | "rank" | "numberOfMutations" | "pValue" | "qValue",
        'direction' ? : "ASC" | "DESC",
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/api/studies/{studyId}/significantly-mutated-genes';

        path = path.replace('{studyId}', parameters['studyId'] + '');
        if (parameters['projection'] !== undefined) {
            queryParameters['projection'] = parameters['projection'];
        }

        if (parameters['pageSize'] !== undefined) {
            queryParameters['pageSize'] = parameters['pageSize'];
        }

        if (parameters['pageNumber'] !== undefined) {
            queryParameters['pageNumber'] = parameters['pageNumber'];
        }

        if (parameters['sortBy'] !== undefined) {
            queryParameters['sortBy'] = parameters['sortBy'];
        }

        if (parameters['direction'] !== undefined) {
            queryParameters['direction'] = parameters['direction'];
        }

        if (parameters.$queryParameters) {
            Object.keys(parameters.$queryParameters).forEach(function(parameterName) {
                var parameter = parameters.$queryParameters[parameterName];
                queryParameters[parameterName] = parameter;
            });
        }
        let keys = Object.keys(queryParameters);
        return this.domain + path + (keys.length > 0 ? '?' + (keys.map(key => key + '=' + encodeURIComponent(queryParameters[key])).join('&')) : '');
    };

    /**
     * Get significantly mutated genes in a study
     * @method
     * @name CBioPortalAPIInternal#getSignificantlyMutatedGenesUsingGET
     * @param {string} studyId - Study ID e.g. acc_tcga
     * @param {string} projection - Level of detail of the response
     * @param {integer} pageSize - Page size of the result list
     * @param {integer} pageNumber - Page number of the result list
     * @param {string} sortBy - Name of the property that the result list is sorted by
     * @param {string} direction - Direction of the sort
     */
    getSignificantlyMutatedGenesUsingGETWithHttpInfo(parameters: {
        'studyId': string,
        'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
        'pageSize' ? : number,
        'pageNumber' ? : number,
        'sortBy' ? : "entrezGeneId" | "hugoGeneSymbol" | "rank" | "numberOfMutations" | "pValue" | "qValue",
        'direction' ? : "ASC" | "DESC",
        $queryParameters ? : any,
        $domain ? : string
    }): Promise < request.Response > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        const errorHandlers = this.errorHandlers;
        const request = this.request;
        let path = '/api/studies/{studyId}/significantly-mutated-genes';
        let body: any;
        let queryParameters: any = {};
        let headers: any = {};
        let form: any = {};
        return new Promise(function(resolve, reject) {
            headers['Accept'] = 'application/json';

            path = path.replace('{studyId}', parameters['studyId'] + '');

            if (parameters['studyId'] === undefined) {
                reject(new Error('Missing required  parameter: studyId'));
                return;
            }

            if (parameters['projection'] !== undefined) {
                queryParameters['projection'] = parameters['projection'];
            }

            if (parameters['pageSize'] !== undefined) {
                queryParameters['pageSize'] = parameters['pageSize'];
            }

            if (parameters['pageNumber'] !== undefined) {
                queryParameters['pageNumber'] = parameters['pageNumber'];
            }

            if (parameters['sortBy'] !== undefined) {
                queryParameters['sortBy'] = parameters['sortBy'];
            }

            if (parameters['direction'] !== undefined) {
                queryParameters['direction'] = parameters['direction'];
            }

            if (parameters.$queryParameters) {
                Object.keys(parameters.$queryParameters).forEach(function(parameterName) {
                    var parameter = parameters.$queryParameters[parameterName];
                    queryParameters[parameterName] = parameter;
                });
            }

            request('GET', domain + path, body, headers, queryParameters, form, reject, resolve, errorHandlers);

        });
    };

    /**
     * Get significantly mutated genes in a study
     * @method
     * @name CBioPortalAPIInternal#getSignificantlyMutatedGenesUsingGET
     * @param {string} studyId - Study ID e.g. acc_tcga
     * @param {string} projection - Level of detail of the response
     * @param {integer} pageSize - Page size of the result list
     * @param {integer} pageNumber - Page number of the result list
     * @param {string} sortBy - Name of the property that the result list is sorted by
     * @param {string} direction - Direction of the sort
     */
    getSignificantlyMutatedGenesUsingGET(parameters: {
            'studyId': string,
            'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
            'pageSize' ? : number,
            'pageNumber' ? : number,
            'sortBy' ? : "entrezGeneId" | "hugoGeneSymbol" | "rank" | "numberOfMutations" | "pValue" | "qValue",
            'direction' ? : "ASC" | "DESC",
            $queryParameters ? : any,
            $domain ? : string
        }): Promise < Array < MutSig >
        > {
            return this.getSignificantlyMutatedGenesUsingGETWithHttpInfo(parameters).then(function(response: request.Response) {
                return response.body;
            });
        };
    fetchSurvivalDataUsingPOSTURL(parameters: {
        'survivalRequest' ? : SurvivalRequest,
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/api/survival-data/fetch';

        if (parameters.$queryParameters) {
            Object.keys(parameters.$queryParameters).forEach(function(parameterName) {
                var parameter = parameters.$queryParameters[parameterName];
                queryParameters[parameterName] = parameter;
            });
        }
        let keys = Object.keys(queryParameters);
        return this.domain + path + (keys.length > 0 ? '?' + (keys.map(key => key + '=' + encodeURIComponent(queryParameters[key])).join('&')) : '');
    };

    /**
     * Fetch survival data
     * @method
     * @name CBioPortalAPIInternal#fetchSurvivalDataUsingPOST
     * @param {} survivalRequest - A web service for supplying JSON formatted data to cBioPortal clients. Please note that this API is currently in beta and subject to change.
     */
    fetchSurvivalDataUsingPOSTWithHttpInfo(parameters: {
        'survivalRequest' ? : SurvivalRequest,
        $queryParameters ? : any,
            $domain ? : string
    }): Promise < request.Response > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        const errorHandlers = this.errorHandlers;
        const request = this.request;
        let path = '/api/survival-data/fetch';
        let body: any;
        let queryParameters: any = {};
        let headers: any = {};
        let form: any = {};
        return new Promise(function(resolve, reject) {
            headers['Accept'] = 'application/json';
            headers['Content-Type'] = 'application/json';

            if (parameters['survivalRequest'] !== undefined) {
                body = parameters['survivalRequest'];
            }

            if (parameters.$queryParameters) {
                Object.keys(parameters.$queryParameters).forEach(function(parameterName) {
                    var parameter = parameters.$queryParameters[parameterName];
                    queryParameters[parameterName] = parameter;
                });
            }

            request('POST', domain + path, body, headers, queryParameters, form, reject, resolve, errorHandlers);

        });
    };

    /**
     * Fetch survival data
     * @method
     * @name CBioPortalAPIInternal#fetchSurvivalDataUsingPOST
     * @param {} survivalRequest - A web service for supplying JSON formatted data to cBioPortal clients. Please note that this API is currently in beta and subject to change.
     */
    fetchSurvivalDataUsingPOST(parameters: {
            'survivalRequest' ? : SurvivalRequest,
            $queryParameters ? : any,
                $domain ? : string
        }): Promise < Array < ClinicalData >
        > {
            return this.fetchSurvivalDataUsingPOSTWithHttpInfo(parameters).then(function(response: request.Response) {
                return response.body;
            });
        };
    getAllTimestampsUsingGETURL(parameters: {
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/api/timestamps';

        if (parameters.$queryParameters) {
            Object.keys(parameters.$queryParameters).forEach(function(parameterName) {
                var parameter = parameters.$queryParameters[parameterName];
                queryParameters[parameterName] = parameter;
            });
        }
        let keys = Object.keys(queryParameters);
        return this.domain + path + (keys.length > 0 ? '?' + (keys.map(key => key + '=' + encodeURIComponent(queryParameters[key])).join('&')) : '');
    };

    /**
     * Get the last time each static resource was updated
     * @method
     * @name CBioPortalAPIInternal#getAllTimestampsUsingGET
     */
    getAllTimestampsUsingGETWithHttpInfo(parameters: {
        $queryParameters ? : any,
            $domain ? : string
    }): Promise < request.Response > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        const errorHandlers = this.errorHandlers;
        const request = this.request;
        let path = '/api/timestamps';
        let body: any;
        let queryParameters: any = {};
        let headers: any = {};
        let form: any = {};
        return new Promise(function(resolve, reject) {
            headers['Accept'] = 'application/json';

            if (parameters.$queryParameters) {
                Object.keys(parameters.$queryParameters).forEach(function(parameterName) {
                    var parameter = parameters.$queryParameters[parameterName];
                    queryParameters[parameterName] = parameter;
                });
            }

            request('GET', domain + path, body, headers, queryParameters, form, reject, resolve, errorHandlers);

        });
    };

    /**
     * Get the last time each static resource was updated
     * @method
     * @name CBioPortalAPIInternal#getAllTimestampsUsingGET
     */
    getAllTimestampsUsingGET(parameters: {
        $queryParameters ? : any,
            $domain ? : string
    }): Promise < {} > {
        return this.getAllTimestampsUsingGETWithHttpInfo(parameters).then(function(response: request.Response) {
            return response.body;
        });
    };
    getContainsTreatmentDataUsingPOSTURL(parameters: {
        'tier' ? : "Agent" | "AgentClass" | "AgentTarget",
        'studyIds': Array < string > ,
            $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/api/treatments/display-patient';
        if (parameters['tier'] !== undefined) {
            queryParameters['tier'] = parameters['tier'];
        }

        if (parameters.$queryParameters) {
            Object.keys(parameters.$queryParameters).forEach(function(parameterName) {
                var parameter = parameters.$queryParameters[parameterName];
                queryParameters[parameterName] = parameter;
            });
        }
        let keys = Object.keys(queryParameters);
        return this.domain + path + (keys.length > 0 ? '?' + (keys.map(key => key + '=' + encodeURIComponent(queryParameters[key])).join('&')) : '');
    };

    /**
     * Should patient level treatments be displayed
     * @method
     * @name CBioPortalAPIInternal#getContainsTreatmentDataUsingPOST
     * @param {string} tier - A web service for supplying JSON formatted data to cBioPortal clients. Please note that this API is currently in beta and subject to change.
     * @param {} studyIds - A web service for supplying JSON formatted data to cBioPortal clients. Please note that this API is currently in beta and subject to change.
     */
    getContainsTreatmentDataUsingPOSTWithHttpInfo(parameters: {
        'tier' ? : "Agent" | "AgentClass" | "AgentTarget",
        'studyIds': Array < string > ,
            $queryParameters ? : any,
            $domain ? : string
    }): Promise < request.Response > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        const errorHandlers = this.errorHandlers;
        const request = this.request;
        let path = '/api/treatments/display-patient';
        let body: any;
        let queryParameters: any = {};
        let headers: any = {};
        let form: any = {};
        return new Promise(function(resolve, reject) {
            headers['Accept'] = 'application/json';
            headers['Content-Type'] = 'application/json';

            if (parameters['tier'] !== undefined) {
                queryParameters['tier'] = parameters['tier'];
            }

            if (parameters['studyIds'] !== undefined) {
                body = parameters['studyIds'];
            }

            if (parameters['studyIds'] === undefined) {
                reject(new Error('Missing required  parameter: studyIds'));
                return;
            }

            if (parameters.$queryParameters) {
                Object.keys(parameters.$queryParameters).forEach(function(parameterName) {
                    var parameter = parameters.$queryParameters[parameterName];
                    queryParameters[parameterName] = parameter;
                });
            }

            request('POST', domain + path, body, headers, queryParameters, form, reject, resolve, errorHandlers);

        });
    };

    /**
     * Should patient level treatments be displayed
     * @method
     * @name CBioPortalAPIInternal#getContainsTreatmentDataUsingPOST
     * @param {string} tier - A web service for supplying JSON formatted data to cBioPortal clients. Please note that this API is currently in beta and subject to change.
     * @param {} studyIds - A web service for supplying JSON formatted data to cBioPortal clients. Please note that this API is currently in beta and subject to change.
     */
    getContainsTreatmentDataUsingPOST(parameters: {
        'tier' ? : "Agent" | "AgentClass" | "AgentTarget",
        'studyIds': Array < string > ,
            $queryParameters ? : any,
            $domain ? : string
    }): Promise < boolean > {
        return this.getContainsTreatmentDataUsingPOSTWithHttpInfo(parameters).then(function(response: request.Response) {
            return response.body;
        });
    };
    getContainsSampleTreatmentDataUsingPOSTURL(parameters: {
        'tier' ? : "Agent" | "AgentClass" | "AgentTarget",
        'studyIds': Array < string > ,
            $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/api/treatments/display-sample';
        if (parameters['tier'] !== undefined) {
            queryParameters['tier'] = parameters['tier'];
        }

        if (parameters.$queryParameters) {
            Object.keys(parameters.$queryParameters).forEach(function(parameterName) {
                var parameter = parameters.$queryParameters[parameterName];
                queryParameters[parameterName] = parameter;
            });
        }
        let keys = Object.keys(queryParameters);
        return this.domain + path + (keys.length > 0 ? '?' + (keys.map(key => key + '=' + encodeURIComponent(queryParameters[key])).join('&')) : '');
    };

    /**
     * Should sample level treatments be displayed
     * @method
     * @name CBioPortalAPIInternal#getContainsSampleTreatmentDataUsingPOST
     * @param {string} tier - A web service for supplying JSON formatted data to cBioPortal clients. Please note that this API is currently in beta and subject to change.
     * @param {} studyIds - A web service for supplying JSON formatted data to cBioPortal clients. Please note that this API is currently in beta and subject to change.
     */
    getContainsSampleTreatmentDataUsingPOSTWithHttpInfo(parameters: {
        'tier' ? : "Agent" | "AgentClass" | "AgentTarget",
        'studyIds': Array < string > ,
            $queryParameters ? : any,
            $domain ? : string
    }): Promise < request.Response > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        const errorHandlers = this.errorHandlers;
        const request = this.request;
        let path = '/api/treatments/display-sample';
        let body: any;
        let queryParameters: any = {};
        let headers: any = {};
        let form: any = {};
        return new Promise(function(resolve, reject) {
            headers['Accept'] = 'application/json';
            headers['Content-Type'] = 'application/json';

            if (parameters['tier'] !== undefined) {
                queryParameters['tier'] = parameters['tier'];
            }

            if (parameters['studyIds'] !== undefined) {
                body = parameters['studyIds'];
            }

            if (parameters['studyIds'] === undefined) {
                reject(new Error('Missing required  parameter: studyIds'));
                return;
            }

            if (parameters.$queryParameters) {
                Object.keys(parameters.$queryParameters).forEach(function(parameterName) {
                    var parameter = parameters.$queryParameters[parameterName];
                    queryParameters[parameterName] = parameter;
                });
            }

            request('POST', domain + path, body, headers, queryParameters, form, reject, resolve, errorHandlers);

        });
    };

    /**
     * Should sample level treatments be displayed
     * @method
     * @name CBioPortalAPIInternal#getContainsSampleTreatmentDataUsingPOST
     * @param {string} tier - A web service for supplying JSON formatted data to cBioPortal clients. Please note that this API is currently in beta and subject to change.
     * @param {} studyIds - A web service for supplying JSON formatted data to cBioPortal clients. Please note that this API is currently in beta and subject to change.
     */
    getContainsSampleTreatmentDataUsingPOST(parameters: {
        'tier' ? : "Agent" | "AgentClass" | "AgentTarget",
        'studyIds': Array < string > ,
            $queryParameters ? : any,
            $domain ? : string
    }): Promise < boolean > {
        return this.getContainsSampleTreatmentDataUsingPOSTWithHttpInfo(parameters).then(function(response: request.Response) {
            return response.body;
        });
    };
    getAllPatientTreatmentsUsingPOSTURL(parameters: {
        'tier' ? : "Agent" | "AgentClass" | "AgentTarget",
        'studyViewFilter' ? : StudyViewFilter,
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/api/treatments/patient';
        if (parameters['tier'] !== undefined) {
            queryParameters['tier'] = parameters['tier'];
        }

        if (parameters.$queryParameters) {
            Object.keys(parameters.$queryParameters).forEach(function(parameterName) {
                var parameter = parameters.$queryParameters[parameterName];
                queryParameters[parameterName] = parameter;
            });
        }
        let keys = Object.keys(queryParameters);
        return this.domain + path + (keys.length > 0 ? '?' + (keys.map(key => key + '=' + encodeURIComponent(queryParameters[key])).join('&')) : '');
    };

    /**
     * Get all patient level treatments
     * @method
     * @name CBioPortalAPIInternal#getAllPatientTreatmentsUsingPOST
     * @param {string} tier - A web service for supplying JSON formatted data to cBioPortal clients. Please note that this API is currently in beta and subject to change.
     * @param {} studyViewFilter - A web service for supplying JSON formatted data to cBioPortal clients. Please note that this API is currently in beta and subject to change.
     */
    getAllPatientTreatmentsUsingPOSTWithHttpInfo(parameters: {
        'tier' ? : "Agent" | "AgentClass" | "AgentTarget",
        'studyViewFilter' ? : StudyViewFilter,
        $queryParameters ? : any,
            $domain ? : string
    }): Promise < request.Response > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        const errorHandlers = this.errorHandlers;
        const request = this.request;
        let path = '/api/treatments/patient';
        let body: any;
        let queryParameters: any = {};
        let headers: any = {};
        let form: any = {};
        return new Promise(function(resolve, reject) {
            headers['Accept'] = 'application/json';
            headers['Content-Type'] = 'application/json';

            if (parameters['tier'] !== undefined) {
                queryParameters['tier'] = parameters['tier'];
            }

            if (parameters['studyViewFilter'] !== undefined) {
                body = parameters['studyViewFilter'];
            }

            if (parameters.$queryParameters) {
                Object.keys(parameters.$queryParameters).forEach(function(parameterName) {
                    var parameter = parameters.$queryParameters[parameterName];
                    queryParameters[parameterName] = parameter;
                });
            }

            request('POST', domain + path, body, headers, queryParameters, form, reject, resolve, errorHandlers);

        });
    };

    /**
     * Get all patient level treatments
     * @method
     * @name CBioPortalAPIInternal#getAllPatientTreatmentsUsingPOST
     * @param {string} tier - A web service for supplying JSON formatted data to cBioPortal clients. Please note that this API is currently in beta and subject to change.
     * @param {} studyViewFilter - A web service for supplying JSON formatted data to cBioPortal clients. Please note that this API is currently in beta and subject to change.
     */
    getAllPatientTreatmentsUsingPOST(parameters: {
            'tier' ? : "Agent" | "AgentClass" | "AgentTarget",
            'studyViewFilter' ? : StudyViewFilter,
            $queryParameters ? : any,
                $domain ? : string
        }): Promise < Array < PatientTreatmentRow >
        > {
            return this.getAllPatientTreatmentsUsingPOSTWithHttpInfo(parameters).then(function(response: request.Response) {
                return response.body;
            });
        };
    getAllSampleTreatmentsUsingPOSTURL(parameters: {
        'tier' ? : "Agent" | "AgentClass" | "AgentTarget",
        'studyViewFilter' ? : StudyViewFilter,
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/api/treatments/sample';
        if (parameters['tier'] !== undefined) {
            queryParameters['tier'] = parameters['tier'];
        }

        if (parameters.$queryParameters) {
            Object.keys(parameters.$queryParameters).forEach(function(parameterName) {
                var parameter = parameters.$queryParameters[parameterName];
                queryParameters[parameterName] = parameter;
            });
        }
        let keys = Object.keys(queryParameters);
        return this.domain + path + (keys.length > 0 ? '?' + (keys.map(key => key + '=' + encodeURIComponent(queryParameters[key])).join('&')) : '');
    };

    /**
     * Get all sample level treatments
     * @method
     * @name CBioPortalAPIInternal#getAllSampleTreatmentsUsingPOST
     * @param {string} tier - A web service for supplying JSON formatted data to cBioPortal clients. Please note that this API is currently in beta and subject to change.
     * @param {} studyViewFilter - A web service for supplying JSON formatted data to cBioPortal clients. Please note that this API is currently in beta and subject to change.
     */
    getAllSampleTreatmentsUsingPOSTWithHttpInfo(parameters: {
        'tier' ? : "Agent" | "AgentClass" | "AgentTarget",
        'studyViewFilter' ? : StudyViewFilter,
        $queryParameters ? : any,
            $domain ? : string
    }): Promise < request.Response > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        const errorHandlers = this.errorHandlers;
        const request = this.request;
        let path = '/api/treatments/sample';
        let body: any;
        let queryParameters: any = {};
        let headers: any = {};
        let form: any = {};
        return new Promise(function(resolve, reject) {
            headers['Accept'] = 'application/json';
            headers['Content-Type'] = 'application/json';

            if (parameters['tier'] !== undefined) {
                queryParameters['tier'] = parameters['tier'];
            }

            if (parameters['studyViewFilter'] !== undefined) {
                body = parameters['studyViewFilter'];
            }

            if (parameters.$queryParameters) {
                Object.keys(parameters.$queryParameters).forEach(function(parameterName) {
                    var parameter = parameters.$queryParameters[parameterName];
                    queryParameters[parameterName] = parameter;
                });
            }

            request('POST', domain + path, body, headers, queryParameters, form, reject, resolve, errorHandlers);

        });
    };

    /**
     * Get all sample level treatments
     * @method
     * @name CBioPortalAPIInternal#getAllSampleTreatmentsUsingPOST
     * @param {string} tier - A web service for supplying JSON formatted data to cBioPortal clients. Please note that this API is currently in beta and subject to change.
     * @param {} studyViewFilter - A web service for supplying JSON formatted data to cBioPortal clients. Please note that this API is currently in beta and subject to change.
     */
    getAllSampleTreatmentsUsingPOST(parameters: {
            'tier' ? : "Agent" | "AgentClass" | "AgentTarget",
            'studyViewFilter' ? : StudyViewFilter,
            $queryParameters ? : any,
                $domain ? : string
        }): Promise < Array < SampleTreatmentRow >
        > {
            return this.getAllSampleTreatmentsUsingPOSTWithHttpInfo(parameters).then(function(response: request.Response) {
                return response.body;
            });
        };
}