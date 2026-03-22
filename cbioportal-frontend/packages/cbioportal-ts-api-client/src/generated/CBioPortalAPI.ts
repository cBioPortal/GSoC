import * as request from "superagent";

type CallbackHandler = (err: any, res ? : request.Response) => void;
export type AlleleSpecificCopyNumber = {
    'ascnIntegerCopyNumber': number

        'ascnMethod': string

        'ccfExpectedCopies': number

        'ccfExpectedCopiesUpper': number

        'clonal': string

        'expectedAltCopies': number

        'minorCopyNumber': number

        'totalCopyNumber': number

};
export type CancerStudy = {
    'allSampleCount': number

        'cancerType': TypeOfCancer

        'cancerTypeId': string

        'citation': string

        'cnaSampleCount': number

        'completeSampleCount': number

        'description': string

        'groups': string

        'importDate': string

        'massSpectrometrySampleCount': number

        'methylationHm27SampleCount': number

        'miRnaSampleCount': number

        'mrnaMicroarraySampleCount': number

        'mrnaRnaSeqSampleCount': number

        'mrnaRnaSeqV2SampleCount': number

        'name': string

        'pmid': string

        'publicStudy': boolean

        'readPermission': boolean

        'referenceGenome': string

        'resourceCounts': Array < ResourceCount >

        'rppaSampleCount': number

        'sequencedSampleCount': number

        'status': number

        'structuralVariantCount': number

        'studyId': string

        'treatmentCount': number

};
export type CancerStudyTags = {
    'tags': string

        'cancerStudyId': number

        'studyId': string

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
export type ClinicalDataIdentifier = {
    'entityId': string

        'studyId': string

};
export type ClinicalDataMultiStudyFilter = {
    'attributeIds': Array < string >

        'identifiers': Array < ClinicalDataIdentifier >

};
export type ClinicalDataSingleStudyFilter = {
    'attributeIds': Array < string >

        'ids': Array < string >

};
export type CopyNumberSeg = {
    'chromosome': string

        'end': number

        'numberOfProbes': number

        'patientId': string

        'sampleId': string

        'segmentMean': number

        'start': number

        'studyId': string

        'uniquePatientKey': string

        'uniqueSampleKey': string

};
export type DiscreteCopyNumberData = {
    'alteration': number

        'driverFilter': string

        'driverFilterAnnotation': string

        'driverTiersFilter': string

        'driverTiersFilterAnnotation': string

        'entrezGeneId': number

        'gene': Gene

        'molecularProfileId': string

        'namespaceColumns': {}

        'patientId': string

        'sampleId': string

        'studyId': string

        'uniquePatientKey': string

        'uniqueSampleKey': string

};
export type DiscreteCopyNumberFilter = {
    'entrezGeneIds': Array < number >

        'sampleIds': Array < string >

        'sampleListId': string

};
export type Gene = {
    'entrezGeneId': number

        'geneticEntityId': number

        'hugoGeneSymbol': string

        'type': string

};
export type GenePanel = {
    'description': string

        'genePanelId': string

        'genes': Array < GenePanelToGene >

};
export type GenePanelData = {
    'genePanelId': string

        'molecularProfileId': string

        'patientId': string

        'profiled': boolean

        'sampleId': string

        'studyId': string

        'uniquePatientKey': string

        'uniqueSampleKey': string

};
export type GenePanelDataFilter = {
    'sampleIds': Array < string >

        'sampleListId': string

};
export type GenePanelDataMultipleStudyFilter = {
    'molecularProfileIds': Array < string >

        'sampleMolecularIdentifiers': Array < SampleMolecularIdentifier >

};
export type GenePanelToGene = {
    'entrezGeneId': number

        'hugoGeneSymbol': string

};
export type GenericAssayData = {
    'genericAssayStableId': string

        'molecularProfileId': string

        'patientId': string

        'patientLevel': boolean

        'sampleId': string

        'stableId': string

        'studyId': string

        'uniquePatientKey': string

        'uniqueSampleKey': string

        'value': string

};
export type GenericAssayDataMultipleStudyFilter = {
    'genericAssayStableIds': Array < string >

        'molecularProfileIds': Array < string >

        'sampleMolecularIdentifiers': Array < SampleMolecularIdentifier >

};
export type GenericAssayFilter = {
    'genericAssayStableIds': Array < string >

        'sampleIds': Array < string >

        'sampleListId': string

};
export type GenericAssayMeta = {
    'entityType': string

        'genericEntityMetaProperties': {}

        'stableId': string

};
export type GenericAssayMetaFilter = {
    'genericAssayStableIds': Array < string >

        'molecularProfileIds': Array < string >

};
export type Info = {
    'dbVersion': string

        'derivedTableVersion': string

        'geneTableVersion': string

        'genesetVersion': string

        'gitBranch': string

        'gitCommitId': string

        'gitCommitIdAbbrev': string

        'gitCommitIdDescribe': string

        'gitCommitIdDescribeShort': string

        'gitCommitMessageFull': string

        'gitCommitMessageShort': string

        'gitCommitMessageUserEmail': string

        'gitCommitMessageUserName': string

        'gitDirty': boolean

        'portalVersion': string

};
export type MolecularDataFilter = {
    'entrezGeneIds': Array < number >

        'sampleIds': Array < string >

        'sampleListId': string

};
export type MolecularDataMultipleStudyFilter = {
    'entrezGeneIds': Array < number >

        'molecularProfileIds': Array < string >

        'sampleMolecularIdentifiers': Array < SampleMolecularIdentifier >

};
export type MolecularProfile = {
    'datatype': string

        'description': string

        'genericAssayType': string

        'molecularAlterationType': "MUTATION_EXTENDED" | "MUTATION_UNCALLED" | "STRUCTURAL_VARIANT" | "COPY_NUMBER_ALTERATION" | "MICRO_RNA_EXPRESSION" | "MRNA_EXPRESSION" | "MRNA_EXPRESSION_NORMALS" | "RNA_EXPRESSION" | "METHYLATION" | "METHYLATION_BINARY" | "PHOSPHORYLATION" | "PROTEIN_LEVEL" | "PROTEIN_ARRAY_PROTEIN_LEVEL" | "PROTEIN_ARRAY_PHOSPHORYLATION" | "GENESET_SCORE" | "GENERIC_ASSAY"

        'molecularProfileId': string

        'name': string

        'patientLevel': boolean

        'pivotThreshold': number

        'showProfileInAnalysisTab': boolean

        'sortOrder': string

        'study': CancerStudy

        'studyId': string

};
export type MolecularProfileFilter = {
    'molecularProfileIds': Array < string >

        'studyIds': Array < string >

};
export type Mutation = {
    'alleleSpecificCopyNumber': AlleleSpecificCopyNumber

        'aminoAcidChange': string

        'center': string

        'chr': string

        'driverFilter': string

        'driverFilterAnnotation': string

        'driverTiersFilter': string

        'driverTiersFilterAnnotation': string

        'endPosition': number

        'entrezGeneId': number

        'gene': Gene

        'keyword': string

        'molecularProfileId': string

        'mutationStatus': string

        'mutationType': string

        'namespaceColumns': {}

        'ncbiBuild': string

        'normalAltCount': number

        'normalRefCount': number

        'patientId': string

        'proteinChange': string

        'proteinPosEnd': number

        'proteinPosStart': number

        'referenceAllele': string

        'refseqMrnaId': string

        'sampleId': string

        'startPosition': number

        'studyId': string

        'tumorAltCount': number

        'tumorRefCount': number

        'uniquePatientKey': string

        'uniqueSampleKey': string

        'validationStatus': string

        'variantAllele': string

        'variantType': string

};
export type MutationFilter = {
    'entrezGeneIds': Array < number >

        'sampleIds': Array < string >

        'sampleListId': string

};
export type MutationMultipleStudyFilter = {
    'entrezGeneIds': Array < number >

        'molecularProfileIds': Array < string >

        'sampleMolecularIdentifiers': Array < SampleMolecularIdentifier >

};
export type NamespaceAttribute = {
    'innerKey': string

        'outerKey': string

};
export type NumericGeneMolecularData = {
    'entrezGeneId': number

        'gene': Gene

        'molecularProfileId': string

        'patientId': string

        'sampleId': string

        'studyId': string

        'uniquePatientKey': string

        'uniqueSampleKey': string

        'value': number

};
export type Patient = {
    'cancerStudy': CancerStudy

        'patientId': string

        'studyId': string

        'uniquePatientKey': string

        'uniqueSampleKey': string

};
export type PatientFilter = {
    'patientIdentifiers': Array < PatientIdentifier >

        'uniquePatientKeys': Array < string >

};
export type PatientIdentifier = {
    'patientId': string

        'studyId': string

};
export type ResourceCount = {
    'customMetaData': string

        'description': string

        'displayName': string

        'openByDefault': boolean

        'patientCount': number

        'priority': string

        'resourceId': string

        'resourceType': "STUDY" | "SAMPLE" | "PATIENT"

        'sampleCount': number

        'studyId': string

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
export type SampleFilter = {
    'sampleIdentifiers': Array < SampleIdentifier >

        'sampleListIds': Array < string >

        'uniqueSampleKeys': Array < string >

};
export type SampleIdentifier = {
    'sampleId': string

        'studyId': string

};
export type SampleList = {
    'category': string

        'description': string

        'name': string

        'sampleCount': number

        'sampleIds': Array < string >

        'sampleListId': string

        'studyId': string

};
export type SampleMolecularIdentifier = {
    'molecularProfileId': string

        'sampleId': string

};
export type ServerStatusMessage = {
    'status': string

};
export type TypeOfCancer = {
    'cancerTypeId': string

        'dedicatedColor': string

        'name': string

        'parent': string

        'shortName': string

};

/**
 * A web service for supplying JSON formatted data to cBioPortal clients. Please note that this API is currently in beta and subject to change.
 * @class CBioPortalAPI
 * @param {(string)} [domainOrOptions] - The project domain.
 */
export default class CBioPortalAPI {

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

    getAllCancerTypesUsingGETURL(parameters: {
        'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
        'pageSize' ? : number,
        'pageNumber' ? : number,
        'sortBy' ? : "cancerTypeId" | "name" | "dedicatedColor" | "shortName" | "parent",
        'direction' ? : "ASC" | "DESC",
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/api/cancer-types';
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
     * Get all cancer types
     * @method
     * @name CBioPortalAPI#getAllCancerTypesUsingGET
     * @param {string} projection - Level of detail of the response
     * @param {integer} pageSize - Page size of the result list
     * @param {integer} pageNumber - Page number of the result list
     * @param {string} sortBy - Name of the property that the result list is sorted by
     * @param {string} direction - Direction of the sort
     */
    getAllCancerTypesUsingGETWithHttpInfo(parameters: {
        'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
        'pageSize' ? : number,
        'pageNumber' ? : number,
        'sortBy' ? : "cancerTypeId" | "name" | "dedicatedColor" | "shortName" | "parent",
        'direction' ? : "ASC" | "DESC",
        $queryParameters ? : any,
            $domain ? : string
    }): Promise < request.Response > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        const errorHandlers = this.errorHandlers;
        const request = this.request;
        let path = '/api/cancer-types';
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
     * Get all cancer types
     * @method
     * @name CBioPortalAPI#getAllCancerTypesUsingGET
     * @param {string} projection - Level of detail of the response
     * @param {integer} pageSize - Page size of the result list
     * @param {integer} pageNumber - Page number of the result list
     * @param {string} sortBy - Name of the property that the result list is sorted by
     * @param {string} direction - Direction of the sort
     */
    getAllCancerTypesUsingGET(parameters: {
            'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
            'pageSize' ? : number,
            'pageNumber' ? : number,
            'sortBy' ? : "cancerTypeId" | "name" | "dedicatedColor" | "shortName" | "parent",
            'direction' ? : "ASC" | "DESC",
            $queryParameters ? : any,
                $domain ? : string
        }): Promise < Array < TypeOfCancer >
        > {
            return this.getAllCancerTypesUsingGETWithHttpInfo(parameters).then(function(response: request.Response) {
                return response.body;
            });
        };
    getCancerTypeUsingGETURL(parameters: {
        'cancerTypeId': string,
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/api/cancer-types/{cancerTypeId}';

        path = path.replace('{cancerTypeId}', parameters['cancerTypeId'] + '');

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
     * Get a cancer type
     * @method
     * @name CBioPortalAPI#getCancerTypeUsingGET
     * @param {string} cancerTypeId - Cancer Type ID e.g. acc
     */
    getCancerTypeUsingGETWithHttpInfo(parameters: {
        'cancerTypeId': string,
        $queryParameters ? : any,
        $domain ? : string
    }): Promise < request.Response > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        const errorHandlers = this.errorHandlers;
        const request = this.request;
        let path = '/api/cancer-types/{cancerTypeId}';
        let body: any;
        let queryParameters: any = {};
        let headers: any = {};
        let form: any = {};
        return new Promise(function(resolve, reject) {
            headers['Accept'] = 'application/json';

            path = path.replace('{cancerTypeId}', parameters['cancerTypeId'] + '');

            if (parameters['cancerTypeId'] === undefined) {
                reject(new Error('Missing required  parameter: cancerTypeId'));
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
     * Get a cancer type
     * @method
     * @name CBioPortalAPI#getCancerTypeUsingGET
     * @param {string} cancerTypeId - Cancer Type ID e.g. acc
     */
    getCancerTypeUsingGET(parameters: {
        'cancerTypeId': string,
        $queryParameters ? : any,
        $domain ? : string
    }): Promise < string > {
        return this.getCancerTypeUsingGETWithHttpInfo(parameters).then(function(response: request.Response) {
            return response.body;
        });
    };
    getAllClinicalAttributesUsingGETURL(parameters: {
        'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
        'pageSize' ? : number,
        'pageNumber' ? : number,
        'sortBy' ? : "clinicalAttributeId" | "displayName" | "description" | "datatype" | "patientAttribute" | "priority" | "studyId",
        'direction' ? : "ASC" | "DESC",
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/api/clinical-attributes';
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
     * Get all clinical attributes
     * @method
     * @name CBioPortalAPI#getAllClinicalAttributesUsingGET
     * @param {string} projection - Level of detail of the response
     * @param {integer} pageSize - Page size of the result list
     * @param {integer} pageNumber - Page number of the result list
     * @param {string} sortBy - Name of the property that the result list is sorted by
     * @param {string} direction - Direction of the sort
     */
    getAllClinicalAttributesUsingGETWithHttpInfo(parameters: {
        'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
        'pageSize' ? : number,
        'pageNumber' ? : number,
        'sortBy' ? : "clinicalAttributeId" | "displayName" | "description" | "datatype" | "patientAttribute" | "priority" | "studyId",
        'direction' ? : "ASC" | "DESC",
        $queryParameters ? : any,
            $domain ? : string
    }): Promise < request.Response > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        const errorHandlers = this.errorHandlers;
        const request = this.request;
        let path = '/api/clinical-attributes';
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
     * Get all clinical attributes
     * @method
     * @name CBioPortalAPI#getAllClinicalAttributesUsingGET
     * @param {string} projection - Level of detail of the response
     * @param {integer} pageSize - Page size of the result list
     * @param {integer} pageNumber - Page number of the result list
     * @param {string} sortBy - Name of the property that the result list is sorted by
     * @param {string} direction - Direction of the sort
     */
    getAllClinicalAttributesUsingGET(parameters: {
            'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
            'pageSize' ? : number,
            'pageNumber' ? : number,
            'sortBy' ? : "clinicalAttributeId" | "displayName" | "description" | "datatype" | "patientAttribute" | "priority" | "studyId",
            'direction' ? : "ASC" | "DESC",
            $queryParameters ? : any,
                $domain ? : string
        }): Promise < Array < ClinicalAttribute >
        > {
            return this.getAllClinicalAttributesUsingGETWithHttpInfo(parameters).then(function(response: request.Response) {
                return response.body;
            });
        };
    fetchClinicalAttributesUsingPOSTURL(parameters: {
        'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
        'studyIds': Array < string > ,
            $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/api/clinical-attributes/fetch';
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
     * Fetch clinical attributes
     * @method
     * @name CBioPortalAPI#fetchClinicalAttributesUsingPOST
     * @param {string} projection - Level of detail of the response
     * @param {} studyIds - A web service for supplying JSON formatted data to cBioPortal clients. Please note that this API is currently in beta and subject to change.
     */
    fetchClinicalAttributesUsingPOSTWithHttpInfo(parameters: {
        'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
        'studyIds': Array < string > ,
            $queryParameters ? : any,
            $domain ? : string
    }): Promise < request.Response > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        const errorHandlers = this.errorHandlers;
        const request = this.request;
        let path = '/api/clinical-attributes/fetch';
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
     * Fetch clinical attributes
     * @method
     * @name CBioPortalAPI#fetchClinicalAttributesUsingPOST
     * @param {string} projection - Level of detail of the response
     * @param {} studyIds - A web service for supplying JSON formatted data to cBioPortal clients. Please note that this API is currently in beta and subject to change.
     */
    fetchClinicalAttributesUsingPOST(parameters: {
            'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
            'studyIds': Array < string > ,
                $queryParameters ? : any,
                $domain ? : string
        }): Promise < Array < ClinicalAttribute >
        > {
            return this.fetchClinicalAttributesUsingPOSTWithHttpInfo(parameters).then(function(response: request.Response) {
                return response.body;
            });
        };
    fetchClinicalDataUsingPOSTURL(parameters: {
        'clinicalDataType' ? : "SAMPLE" | "PATIENT",
        'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
        'clinicalDataMultiStudyFilter' ? : ClinicalDataMultiStudyFilter,
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/api/clinical-data/fetch';
        if (parameters['clinicalDataType'] !== undefined) {
            queryParameters['clinicalDataType'] = parameters['clinicalDataType'];
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
     * Fetch clinical data by patient IDs or sample IDs (all studies)
     * @method
     * @name CBioPortalAPI#fetchClinicalDataUsingPOST
     * @param {string} clinicalDataType - Type of the clinical data
     * @param {string} projection - Level of detail of the response
     * @param {} clinicalDataMultiStudyFilter - A web service for supplying JSON formatted data to cBioPortal clients. Please note that this API is currently in beta and subject to change.
     */
    fetchClinicalDataUsingPOSTWithHttpInfo(parameters: {
        'clinicalDataType' ? : "SAMPLE" | "PATIENT",
        'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
        'clinicalDataMultiStudyFilter' ? : ClinicalDataMultiStudyFilter,
        $queryParameters ? : any,
            $domain ? : string
    }): Promise < request.Response > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        const errorHandlers = this.errorHandlers;
        const request = this.request;
        let path = '/api/clinical-data/fetch';
        let body: any;
        let queryParameters: any = {};
        let headers: any = {};
        let form: any = {};
        return new Promise(function(resolve, reject) {
            headers['Accept'] = 'application/json';
            headers['Content-Type'] = 'application/json';

            if (parameters['clinicalDataType'] !== undefined) {
                queryParameters['clinicalDataType'] = parameters['clinicalDataType'];
            }

            if (parameters['projection'] !== undefined) {
                queryParameters['projection'] = parameters['projection'];
            }

            if (parameters['clinicalDataMultiStudyFilter'] !== undefined) {
                body = parameters['clinicalDataMultiStudyFilter'];
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
     * Fetch clinical data by patient IDs or sample IDs (all studies)
     * @method
     * @name CBioPortalAPI#fetchClinicalDataUsingPOST
     * @param {string} clinicalDataType - Type of the clinical data
     * @param {string} projection - Level of detail of the response
     * @param {} clinicalDataMultiStudyFilter - A web service for supplying JSON formatted data to cBioPortal clients. Please note that this API is currently in beta and subject to change.
     */
    fetchClinicalDataUsingPOST(parameters: {
            'clinicalDataType' ? : "SAMPLE" | "PATIENT",
            'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
            'clinicalDataMultiStudyFilter' ? : ClinicalDataMultiStudyFilter,
            $queryParameters ? : any,
                $domain ? : string
        }): Promise < Array < ClinicalData >
        > {
            return this.fetchClinicalDataUsingPOSTWithHttpInfo(parameters).then(function(response: request.Response) {
                return response.body;
            });
        };
    fetchCopyNumberSegmentsUsingPOSTURL(parameters: {
        'chromosome' ? : string,
        'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
        'sampleIdentifiers' ? : Array < SampleIdentifier > ,
            $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/api/copy-number-segments/fetch';
        if (parameters['chromosome'] !== undefined) {
            queryParameters['chromosome'] = parameters['chromosome'];
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
     * Fetch copy number segments by sample ID
     * @method
     * @name CBioPortalAPI#fetchCopyNumberSegmentsUsingPOST
     * @param {string} chromosome - Chromosome
     * @param {string} projection - Level of detail of the response
     * @param {} sampleIdentifiers - A web service for supplying JSON formatted data to cBioPortal clients. Please note that this API is currently in beta and subject to change.
     */
    fetchCopyNumberSegmentsUsingPOSTWithHttpInfo(parameters: {
        'chromosome' ? : string,
        'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
        'sampleIdentifiers' ? : Array < SampleIdentifier > ,
            $queryParameters ? : any,
            $domain ? : string
    }): Promise < request.Response > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        const errorHandlers = this.errorHandlers;
        const request = this.request;
        let path = '/api/copy-number-segments/fetch';
        let body: any;
        let queryParameters: any = {};
        let headers: any = {};
        let form: any = {};
        return new Promise(function(resolve, reject) {
            headers['Accept'] = 'application/json';
            headers['Content-Type'] = 'application/json';

            if (parameters['chromosome'] !== undefined) {
                queryParameters['chromosome'] = parameters['chromosome'];
            }

            if (parameters['projection'] !== undefined) {
                queryParameters['projection'] = parameters['projection'];
            }

            if (parameters['sampleIdentifiers'] !== undefined) {
                body = parameters['sampleIdentifiers'];
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
     * Fetch copy number segments by sample ID
     * @method
     * @name CBioPortalAPI#fetchCopyNumberSegmentsUsingPOST
     * @param {string} chromosome - Chromosome
     * @param {string} projection - Level of detail of the response
     * @param {} sampleIdentifiers - A web service for supplying JSON formatted data to cBioPortal clients. Please note that this API is currently in beta and subject to change.
     */
    fetchCopyNumberSegmentsUsingPOST(parameters: {
            'chromosome' ? : string,
            'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
            'sampleIdentifiers' ? : Array < SampleIdentifier > ,
                $queryParameters ? : any,
                $domain ? : string
        }): Promise < Array < CopyNumberSeg >
        > {
            return this.fetchCopyNumberSegmentsUsingPOSTWithHttpInfo(parameters).then(function(response: request.Response) {
                return response.body;
            });
        };
    fetchGenePanelDataInMultipleMolecularProfilesUsingPOSTURL(parameters: {
        'genePanelDataMultipleStudyFilter' ? : GenePanelDataMultipleStudyFilter,
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/api/gene-panel-data/fetch';

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
     * Fetch gene panel data
     * @method
     * @name CBioPortalAPI#fetchGenePanelDataInMultipleMolecularProfilesUsingPOST
     * @param {} genePanelDataMultipleStudyFilter - A web service for supplying JSON formatted data to cBioPortal clients. Please note that this API is currently in beta and subject to change.
     */
    fetchGenePanelDataInMultipleMolecularProfilesUsingPOSTWithHttpInfo(parameters: {
        'genePanelDataMultipleStudyFilter' ? : GenePanelDataMultipleStudyFilter,
        $queryParameters ? : any,
            $domain ? : string
    }): Promise < request.Response > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        const errorHandlers = this.errorHandlers;
        const request = this.request;
        let path = '/api/gene-panel-data/fetch';
        let body: any;
        let queryParameters: any = {};
        let headers: any = {};
        let form: any = {};
        return new Promise(function(resolve, reject) {
            headers['Accept'] = 'application/json';
            headers['Content-Type'] = 'application/json';

            if (parameters['genePanelDataMultipleStudyFilter'] !== undefined) {
                body = parameters['genePanelDataMultipleStudyFilter'];
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
     * Fetch gene panel data
     * @method
     * @name CBioPortalAPI#fetchGenePanelDataInMultipleMolecularProfilesUsingPOST
     * @param {} genePanelDataMultipleStudyFilter - A web service for supplying JSON formatted data to cBioPortal clients. Please note that this API is currently in beta and subject to change.
     */
    fetchGenePanelDataInMultipleMolecularProfilesUsingPOST(parameters: {
            'genePanelDataMultipleStudyFilter' ? : GenePanelDataMultipleStudyFilter,
            $queryParameters ? : any,
                $domain ? : string
        }): Promise < Array < GenePanelData >
        > {
            return this.fetchGenePanelDataInMultipleMolecularProfilesUsingPOSTWithHttpInfo(parameters).then(function(response: request.Response) {
                return response.body;
            });
        };
    getAllGenePanelsUsingGETURL(parameters: {
        'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
        'pageSize' ? : number,
        'pageNumber' ? : number,
        'sortBy' ? : "genePanelId" | "description",
        'direction' ? : "ASC" | "DESC",
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/api/gene-panels';
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
     * Get all gene panels
     * @method
     * @name CBioPortalAPI#getAllGenePanelsUsingGET
     * @param {string} projection - Level of detail of the response
     * @param {integer} pageSize - Page size of the result list
     * @param {integer} pageNumber - Page number of the result list
     * @param {string} sortBy - Name of the property that the result list is sorted by
     * @param {string} direction - Direction of the sort
     */
    getAllGenePanelsUsingGETWithHttpInfo(parameters: {
        'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
        'pageSize' ? : number,
        'pageNumber' ? : number,
        'sortBy' ? : "genePanelId" | "description",
        'direction' ? : "ASC" | "DESC",
        $queryParameters ? : any,
            $domain ? : string
    }): Promise < request.Response > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        const errorHandlers = this.errorHandlers;
        const request = this.request;
        let path = '/api/gene-panels';
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
     * Get all gene panels
     * @method
     * @name CBioPortalAPI#getAllGenePanelsUsingGET
     * @param {string} projection - Level of detail of the response
     * @param {integer} pageSize - Page size of the result list
     * @param {integer} pageNumber - Page number of the result list
     * @param {string} sortBy - Name of the property that the result list is sorted by
     * @param {string} direction - Direction of the sort
     */
    getAllGenePanelsUsingGET(parameters: {
            'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
            'pageSize' ? : number,
            'pageNumber' ? : number,
            'sortBy' ? : "genePanelId" | "description",
            'direction' ? : "ASC" | "DESC",
            $queryParameters ? : any,
                $domain ? : string
        }): Promise < Array < GenePanel >
        > {
            return this.getAllGenePanelsUsingGETWithHttpInfo(parameters).then(function(response: request.Response) {
                return response.body;
            });
        };
    fetchGenePanelsUsingPOSTURL(parameters: {
        'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
        'genePanelIds': Array < string > ,
            $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/api/gene-panels/fetch';
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
     * Get gene panel
     * @method
     * @name CBioPortalAPI#fetchGenePanelsUsingPOST
     * @param {string} projection - Level of detail of the response
     * @param {} genePanelIds - A web service for supplying JSON formatted data to cBioPortal clients. Please note that this API is currently in beta and subject to change.
     */
    fetchGenePanelsUsingPOSTWithHttpInfo(parameters: {
        'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
        'genePanelIds': Array < string > ,
            $queryParameters ? : any,
            $domain ? : string
    }): Promise < request.Response > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        const errorHandlers = this.errorHandlers;
        const request = this.request;
        let path = '/api/gene-panels/fetch';
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

            if (parameters['genePanelIds'] !== undefined) {
                body = parameters['genePanelIds'];
            }

            if (parameters['genePanelIds'] === undefined) {
                reject(new Error('Missing required  parameter: genePanelIds'));
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
     * Get gene panel
     * @method
     * @name CBioPortalAPI#fetchGenePanelsUsingPOST
     * @param {string} projection - Level of detail of the response
     * @param {} genePanelIds - A web service for supplying JSON formatted data to cBioPortal clients. Please note that this API is currently in beta and subject to change.
     */
    fetchGenePanelsUsingPOST(parameters: {
            'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
            'genePanelIds': Array < string > ,
                $queryParameters ? : any,
                $domain ? : string
        }): Promise < Array < GenePanel >
        > {
            return this.fetchGenePanelsUsingPOSTWithHttpInfo(parameters).then(function(response: request.Response) {
                return response.body;
            });
        };
    getGenePanelUsingGETURL(parameters: {
        'genePanelId': string,
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/api/gene-panels/{genePanelId}';

        path = path.replace('{genePanelId}', parameters['genePanelId'] + '');

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
     * Get gene panel
     * @method
     * @name CBioPortalAPI#getGenePanelUsingGET
     * @param {string} genePanelId - Gene Panel ID e.g. NSCLC_UNITO_2016_PANEL
     */
    getGenePanelUsingGETWithHttpInfo(parameters: {
        'genePanelId': string,
        $queryParameters ? : any,
        $domain ? : string
    }): Promise < request.Response > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        const errorHandlers = this.errorHandlers;
        const request = this.request;
        let path = '/api/gene-panels/{genePanelId}';
        let body: any;
        let queryParameters: any = {};
        let headers: any = {};
        let form: any = {};
        return new Promise(function(resolve, reject) {
            headers['Accept'] = 'application/json';

            path = path.replace('{genePanelId}', parameters['genePanelId'] + '');

            if (parameters['genePanelId'] === undefined) {
                reject(new Error('Missing required  parameter: genePanelId'));
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
     * Get gene panel
     * @method
     * @name CBioPortalAPI#getGenePanelUsingGET
     * @param {string} genePanelId - Gene Panel ID e.g. NSCLC_UNITO_2016_PANEL
     */
    getGenePanelUsingGET(parameters: {
        'genePanelId': string,
        $queryParameters ? : any,
        $domain ? : string
    }): Promise < GenePanel > {
        return this.getGenePanelUsingGETWithHttpInfo(parameters).then(function(response: request.Response) {
            return response.body;
        });
    };
    getGenericAssayDataInMolecularProfileUsingGETURL(parameters: {
        'molecularProfileId': string,
        'genericAssayStableId': string,
        'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/api/generic-assay-data/{molecularProfileId}/generic-assay/{genericAssayStableId}';

        path = path.replace('{molecularProfileId}', parameters['molecularProfileId'] + '');

        path = path.replace('{genericAssayStableId}', parameters['genericAssayStableId'] + '');
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
     * Get generic_assay_data in a molecular profile
     * @method
     * @name CBioPortalAPI#getGenericAssayDataInMolecularProfileUsingGET
     * @param {string} molecularProfileId - Molecular Profile ID
     * @param {string} genericAssayStableId - Generic Assay stable ID
     * @param {string} projection - Level of detail of the response
     */
    getGenericAssayDataInMolecularProfileUsingGETWithHttpInfo(parameters: {
        'molecularProfileId': string,
        'genericAssayStableId': string,
        'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
        $queryParameters ? : any,
        $domain ? : string
    }): Promise < request.Response > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        const errorHandlers = this.errorHandlers;
        const request = this.request;
        let path = '/api/generic-assay-data/{molecularProfileId}/generic-assay/{genericAssayStableId}';
        let body: any;
        let queryParameters: any = {};
        let headers: any = {};
        let form: any = {};
        return new Promise(function(resolve, reject) {
            headers['Accept'] = 'application/json';

            path = path.replace('{molecularProfileId}', parameters['molecularProfileId'] + '');

            if (parameters['molecularProfileId'] === undefined) {
                reject(new Error('Missing required  parameter: molecularProfileId'));
                return;
            }

            path = path.replace('{genericAssayStableId}', parameters['genericAssayStableId'] + '');

            if (parameters['genericAssayStableId'] === undefined) {
                reject(new Error('Missing required  parameter: genericAssayStableId'));
                return;
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

            request('GET', domain + path, body, headers, queryParameters, form, reject, resolve, errorHandlers);

        });
    };

    /**
     * Get generic_assay_data in a molecular profile
     * @method
     * @name CBioPortalAPI#getGenericAssayDataInMolecularProfileUsingGET
     * @param {string} molecularProfileId - Molecular Profile ID
     * @param {string} genericAssayStableId - Generic Assay stable ID
     * @param {string} projection - Level of detail of the response
     */
    getGenericAssayDataInMolecularProfileUsingGET(parameters: {
            'molecularProfileId': string,
            'genericAssayStableId': string,
            'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
            $queryParameters ? : any,
            $domain ? : string
        }): Promise < Array < GenericAssayData >
        > {
            return this.getGenericAssayDataInMolecularProfileUsingGETWithHttpInfo(parameters).then(function(response: request.Response) {
                return response.body;
            });
        };
    getGenericAssayMeta_gaUsingGETURL(parameters: {
        'genericAssayStableId': string,
        'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/api/generic-assay-meta/generic-assay/{genericAssayStableId}';

        path = path.replace('{genericAssayStableId}', parameters['genericAssayStableId'] + '');
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
     * Fetch meta data for generic-assay by ID
     * @method
     * @name CBioPortalAPI#getGenericAssayMeta_gaUsingGET
     * @param {string} genericAssayStableId - Generic Assay stable ID
     * @param {string} projection - Level of detail of the response
     */
    getGenericAssayMeta_gaUsingGETWithHttpInfo(parameters: {
        'genericAssayStableId': string,
        'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
        $queryParameters ? : any,
        $domain ? : string
    }): Promise < request.Response > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        const errorHandlers = this.errorHandlers;
        const request = this.request;
        let path = '/api/generic-assay-meta/generic-assay/{genericAssayStableId}';
        let body: any;
        let queryParameters: any = {};
        let headers: any = {};
        let form: any = {};
        return new Promise(function(resolve, reject) {
            headers['Accept'] = 'application/json';

            path = path.replace('{genericAssayStableId}', parameters['genericAssayStableId'] + '');

            if (parameters['genericAssayStableId'] === undefined) {
                reject(new Error('Missing required  parameter: genericAssayStableId'));
                return;
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

            request('GET', domain + path, body, headers, queryParameters, form, reject, resolve, errorHandlers);

        });
    };

    /**
     * Fetch meta data for generic-assay by ID
     * @method
     * @name CBioPortalAPI#getGenericAssayMeta_gaUsingGET
     * @param {string} genericAssayStableId - Generic Assay stable ID
     * @param {string} projection - Level of detail of the response
     */
    getGenericAssayMeta_gaUsingGET(parameters: {
            'genericAssayStableId': string,
            'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
            $queryParameters ? : any,
            $domain ? : string
        }): Promise < Array < GenericAssayMeta >
        > {
            return this.getGenericAssayMeta_gaUsingGETWithHttpInfo(parameters).then(function(response: request.Response) {
                return response.body;
            });
        };
    getGenericAssayMetaUsingGETURL(parameters: {
        'molecularProfileId': string,
        'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/api/generic-assay-meta/{molecularProfileId}';

        path = path.replace('{molecularProfileId}', parameters['molecularProfileId'] + '');
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
     * Fetch meta data for generic-assay by ID
     * @method
     * @name CBioPortalAPI#getGenericAssayMetaUsingGET
     * @param {string} molecularProfileId - Molecular Profile ID
     * @param {string} projection - Level of detail of the response
     */
    getGenericAssayMetaUsingGETWithHttpInfo(parameters: {
        'molecularProfileId': string,
        'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
        $queryParameters ? : any,
        $domain ? : string
    }): Promise < request.Response > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        const errorHandlers = this.errorHandlers;
        const request = this.request;
        let path = '/api/generic-assay-meta/{molecularProfileId}';
        let body: any;
        let queryParameters: any = {};
        let headers: any = {};
        let form: any = {};
        return new Promise(function(resolve, reject) {
            headers['Accept'] = 'application/json';

            path = path.replace('{molecularProfileId}', parameters['molecularProfileId'] + '');

            if (parameters['molecularProfileId'] === undefined) {
                reject(new Error('Missing required  parameter: molecularProfileId'));
                return;
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

            request('GET', domain + path, body, headers, queryParameters, form, reject, resolve, errorHandlers);

        });
    };

    /**
     * Fetch meta data for generic-assay by ID
     * @method
     * @name CBioPortalAPI#getGenericAssayMetaUsingGET
     * @param {string} molecularProfileId - Molecular Profile ID
     * @param {string} projection - Level of detail of the response
     */
    getGenericAssayMetaUsingGET(parameters: {
            'molecularProfileId': string,
            'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
            $queryParameters ? : any,
            $domain ? : string
        }): Promise < Array < GenericAssayMeta >
        > {
            return this.getGenericAssayMetaUsingGETWithHttpInfo(parameters).then(function(response: request.Response) {
                return response.body;
            });
        };
    fetchGenericAssayDataInMultipleMolecularProfilesUsingPOSTURL(parameters: {
        'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
        'genericAssayDataMultipleStudyFilter' ? : GenericAssayDataMultipleStudyFilter,
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/api/generic_assay_data/fetch';
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
     * Fetch generic_assay_data
     * @method
     * @name CBioPortalAPI#fetchGenericAssayDataInMultipleMolecularProfilesUsingPOST
     * @param {string} projection - Level of detail of the response
     * @param {} genericAssayDataMultipleStudyFilter - A web service for supplying JSON formatted data to cBioPortal clients. Please note that this API is currently in beta and subject to change.
     */
    fetchGenericAssayDataInMultipleMolecularProfilesUsingPOSTWithHttpInfo(parameters: {
        'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
        'genericAssayDataMultipleStudyFilter' ? : GenericAssayDataMultipleStudyFilter,
        $queryParameters ? : any,
            $domain ? : string
    }): Promise < request.Response > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        const errorHandlers = this.errorHandlers;
        const request = this.request;
        let path = '/api/generic_assay_data/fetch';
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

            if (parameters['genericAssayDataMultipleStudyFilter'] !== undefined) {
                body = parameters['genericAssayDataMultipleStudyFilter'];
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
     * Fetch generic_assay_data
     * @method
     * @name CBioPortalAPI#fetchGenericAssayDataInMultipleMolecularProfilesUsingPOST
     * @param {string} projection - Level of detail of the response
     * @param {} genericAssayDataMultipleStudyFilter - A web service for supplying JSON formatted data to cBioPortal clients. Please note that this API is currently in beta and subject to change.
     */
    fetchGenericAssayDataInMultipleMolecularProfilesUsingPOST(parameters: {
            'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
            'genericAssayDataMultipleStudyFilter' ? : GenericAssayDataMultipleStudyFilter,
            $queryParameters ? : any,
                $domain ? : string
        }): Promise < Array < GenericAssayData >
        > {
            return this.fetchGenericAssayDataInMultipleMolecularProfilesUsingPOSTWithHttpInfo(parameters).then(function(response: request.Response) {
                return response.body;
            });
        };
    fetchGenericAssayDataInMolecularProfileUsingPOSTURL(parameters: {
        'molecularProfileId': string,
        'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
        'genericAssayFilter': GenericAssayFilter,
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/api/generic_assay_data/{molecularProfileId}/fetch';

        path = path.replace('{molecularProfileId}', parameters['molecularProfileId'] + '');
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
     * fetch generic_assay_data in a molecular profile
     * @method
     * @name CBioPortalAPI#fetchGenericAssayDataInMolecularProfileUsingPOST
     * @param {string} molecularProfileId - Molecular Profile ID
     * @param {string} projection - Level of detail of the response
     * @param {} genericAssayFilter - A web service for supplying JSON formatted data to cBioPortal clients. Please note that this API is currently in beta and subject to change.
     */
    fetchGenericAssayDataInMolecularProfileUsingPOSTWithHttpInfo(parameters: {
        'molecularProfileId': string,
        'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
        'genericAssayFilter': GenericAssayFilter,
        $queryParameters ? : any,
        $domain ? : string
    }): Promise < request.Response > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        const errorHandlers = this.errorHandlers;
        const request = this.request;
        let path = '/api/generic_assay_data/{molecularProfileId}/fetch';
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

            if (parameters['projection'] !== undefined) {
                queryParameters['projection'] = parameters['projection'];
            }

            if (parameters['genericAssayFilter'] !== undefined) {
                body = parameters['genericAssayFilter'];
            }

            if (parameters['genericAssayFilter'] === undefined) {
                reject(new Error('Missing required  parameter: genericAssayFilter'));
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
     * fetch generic_assay_data in a molecular profile
     * @method
     * @name CBioPortalAPI#fetchGenericAssayDataInMolecularProfileUsingPOST
     * @param {string} molecularProfileId - Molecular Profile ID
     * @param {string} projection - Level of detail of the response
     * @param {} genericAssayFilter - A web service for supplying JSON formatted data to cBioPortal clients. Please note that this API is currently in beta and subject to change.
     */
    fetchGenericAssayDataInMolecularProfileUsingPOST(parameters: {
            'molecularProfileId': string,
            'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
            'genericAssayFilter': GenericAssayFilter,
            $queryParameters ? : any,
            $domain ? : string
        }): Promise < Array < GenericAssayData >
        > {
            return this.fetchGenericAssayDataInMolecularProfileUsingPOSTWithHttpInfo(parameters).then(function(response: request.Response) {
                return response.body;
            });
        };
    fetchGenericAssayMetaUsingPOSTURL(parameters: {
        'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
        'genericAssayMetaFilter': GenericAssayMetaFilter,
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/api/generic_assay_meta/fetch';
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
     * Fetch meta data for generic-assay by ID
     * @method
     * @name CBioPortalAPI#fetchGenericAssayMetaUsingPOST
     * @param {string} projection - Level of detail of the response
     * @param {} genericAssayMetaFilter - A web service for supplying JSON formatted data to cBioPortal clients. Please note that this API is currently in beta and subject to change.
     */
    fetchGenericAssayMetaUsingPOSTWithHttpInfo(parameters: {
        'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
        'genericAssayMetaFilter': GenericAssayMetaFilter,
        $queryParameters ? : any,
            $domain ? : string
    }): Promise < request.Response > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        const errorHandlers = this.errorHandlers;
        const request = this.request;
        let path = '/api/generic_assay_meta/fetch';
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

            if (parameters['genericAssayMetaFilter'] !== undefined) {
                body = parameters['genericAssayMetaFilter'];
            }

            if (parameters['genericAssayMetaFilter'] === undefined) {
                reject(new Error('Missing required  parameter: genericAssayMetaFilter'));
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
     * Fetch meta data for generic-assay by ID
     * @method
     * @name CBioPortalAPI#fetchGenericAssayMetaUsingPOST
     * @param {string} projection - Level of detail of the response
     * @param {} genericAssayMetaFilter - A web service for supplying JSON formatted data to cBioPortal clients. Please note that this API is currently in beta and subject to change.
     */
    fetchGenericAssayMetaUsingPOST(parameters: {
            'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
            'genericAssayMetaFilter': GenericAssayMetaFilter,
            $queryParameters ? : any,
                $domain ? : string
        }): Promise < Array < GenericAssayMeta >
        > {
            return this.fetchGenericAssayMetaUsingPOSTWithHttpInfo(parameters).then(function(response: request.Response) {
                return response.body;
            });
        };
    getAllGenesUsingGETURL(parameters: {
        'keyword' ? : string,
        'alias' ? : string,
        'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
        'pageSize' ? : number,
        'pageNumber' ? : number,
        'sortBy' ? : "entrezGeneId" | "hugoGeneSymbol" | "type" | "cytoband" | "length",
        'direction' ? : "ASC" | "DESC",
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/api/genes';
        if (parameters['keyword'] !== undefined) {
            queryParameters['keyword'] = parameters['keyword'];
        }

        if (parameters['alias'] !== undefined) {
            queryParameters['alias'] = parameters['alias'];
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
     * Get all genes
     * @method
     * @name CBioPortalAPI#getAllGenesUsingGET
     * @param {string} keyword - Search keyword that applies to hugo gene symbol of the genes
     * @param {string} alias - Alias of the gene
     * @param {string} projection - Level of detail of the response
     * @param {integer} pageSize - Page size of the result list
     * @param {integer} pageNumber - Page number of the result list
     * @param {string} sortBy - Name of the property that the result list is sorted by
     * @param {string} direction - Direction of the sort
     */
    getAllGenesUsingGETWithHttpInfo(parameters: {
        'keyword' ? : string,
        'alias' ? : string,
        'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
        'pageSize' ? : number,
        'pageNumber' ? : number,
        'sortBy' ? : "entrezGeneId" | "hugoGeneSymbol" | "type" | "cytoband" | "length",
        'direction' ? : "ASC" | "DESC",
        $queryParameters ? : any,
            $domain ? : string
    }): Promise < request.Response > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        const errorHandlers = this.errorHandlers;
        const request = this.request;
        let path = '/api/genes';
        let body: any;
        let queryParameters: any = {};
        let headers: any = {};
        let form: any = {};
        return new Promise(function(resolve, reject) {
            headers['Accept'] = 'application/json';

            if (parameters['keyword'] !== undefined) {
                queryParameters['keyword'] = parameters['keyword'];
            }

            if (parameters['alias'] !== undefined) {
                queryParameters['alias'] = parameters['alias'];
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
     * Get all genes
     * @method
     * @name CBioPortalAPI#getAllGenesUsingGET
     * @param {string} keyword - Search keyword that applies to hugo gene symbol of the genes
     * @param {string} alias - Alias of the gene
     * @param {string} projection - Level of detail of the response
     * @param {integer} pageSize - Page size of the result list
     * @param {integer} pageNumber - Page number of the result list
     * @param {string} sortBy - Name of the property that the result list is sorted by
     * @param {string} direction - Direction of the sort
     */
    getAllGenesUsingGET(parameters: {
            'keyword' ? : string,
            'alias' ? : string,
            'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
            'pageSize' ? : number,
            'pageNumber' ? : number,
            'sortBy' ? : "entrezGeneId" | "hugoGeneSymbol" | "type" | "cytoband" | "length",
            'direction' ? : "ASC" | "DESC",
            $queryParameters ? : any,
                $domain ? : string
        }): Promise < Array < Gene >
        > {
            return this.getAllGenesUsingGETWithHttpInfo(parameters).then(function(response: request.Response) {
                return response.body;
            });
        };
    fetchGenesUsingPOSTURL(parameters: {
        'geneIdType' ? : "ENTREZ_GENE_ID" | "HUGO_GENE_SYMBOL",
        'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
        'geneIds': Array < string > ,
            $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/api/genes/fetch';
        if (parameters['geneIdType'] !== undefined) {
            queryParameters['geneIdType'] = parameters['geneIdType'];
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
     * Fetch genes by ID
     * @method
     * @name CBioPortalAPI#fetchGenesUsingPOST
     * @param {string} geneIdType - A web service for supplying JSON formatted data to cBioPortal clients. Please note that this API is currently in beta and subject to change.
     * @param {string} projection - Level of detail of the response
     * @param {} geneIds - A web service for supplying JSON formatted data to cBioPortal clients. Please note that this API is currently in beta and subject to change.
     */
    fetchGenesUsingPOSTWithHttpInfo(parameters: {
        'geneIdType' ? : "ENTREZ_GENE_ID" | "HUGO_GENE_SYMBOL",
        'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
        'geneIds': Array < string > ,
            $queryParameters ? : any,
            $domain ? : string
    }): Promise < request.Response > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        const errorHandlers = this.errorHandlers;
        const request = this.request;
        let path = '/api/genes/fetch';
        let body: any;
        let queryParameters: any = {};
        let headers: any = {};
        let form: any = {};
        return new Promise(function(resolve, reject) {
            headers['Accept'] = 'application/json';
            headers['Content-Type'] = 'application/json';

            if (parameters['geneIdType'] !== undefined) {
                queryParameters['geneIdType'] = parameters['geneIdType'];
            }

            if (parameters['projection'] !== undefined) {
                queryParameters['projection'] = parameters['projection'];
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
     * Fetch genes by ID
     * @method
     * @name CBioPortalAPI#fetchGenesUsingPOST
     * @param {string} geneIdType - A web service for supplying JSON formatted data to cBioPortal clients. Please note that this API is currently in beta and subject to change.
     * @param {string} projection - Level of detail of the response
     * @param {} geneIds - A web service for supplying JSON formatted data to cBioPortal clients. Please note that this API is currently in beta and subject to change.
     */
    fetchGenesUsingPOST(parameters: {
            'geneIdType' ? : "ENTREZ_GENE_ID" | "HUGO_GENE_SYMBOL",
            'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
            'geneIds': Array < string > ,
                $queryParameters ? : any,
                $domain ? : string
        }): Promise < Array < Gene >
        > {
            return this.fetchGenesUsingPOSTWithHttpInfo(parameters).then(function(response: request.Response) {
                return response.body;
            });
        };
    getGeneUsingGETURL(parameters: {
        'geneId': string,
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/api/genes/{geneId}';

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
     * Get a gene
     * @method
     * @name CBioPortalAPI#getGeneUsingGET
     * @param {string} geneId - Entrez Gene ID or Hugo Gene Symbol e.g. 1 or A1BG
     */
    getGeneUsingGETWithHttpInfo(parameters: {
        'geneId': string,
        $queryParameters ? : any,
        $domain ? : string
    }): Promise < request.Response > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        const errorHandlers = this.errorHandlers;
        const request = this.request;
        let path = '/api/genes/{geneId}';
        let body: any;
        let queryParameters: any = {};
        let headers: any = {};
        let form: any = {};
        return new Promise(function(resolve, reject) {
            headers['Accept'] = 'application/json';

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
     * Get a gene
     * @method
     * @name CBioPortalAPI#getGeneUsingGET
     * @param {string} geneId - Entrez Gene ID or Hugo Gene Symbol e.g. 1 or A1BG
     */
    getGeneUsingGET(parameters: {
        'geneId': string,
        $queryParameters ? : any,
        $domain ? : string
    }): Promise < Gene > {
        return this.getGeneUsingGETWithHttpInfo(parameters).then(function(response: request.Response) {
            return response.body;
        });
    };
    getAliasesOfGeneUsingGETURL(parameters: {
        'geneId': string,
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/api/genes/{geneId}/aliases';

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
     * Get aliases of a gene
     * @method
     * @name CBioPortalAPI#getAliasesOfGeneUsingGET
     * @param {string} geneId - Entrez Gene ID or Hugo Gene Symbol e.g. 1 or A1BG
     */
    getAliasesOfGeneUsingGETWithHttpInfo(parameters: {
        'geneId': string,
        $queryParameters ? : any,
        $domain ? : string
    }): Promise < request.Response > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        const errorHandlers = this.errorHandlers;
        const request = this.request;
        let path = '/api/genes/{geneId}/aliases';
        let body: any;
        let queryParameters: any = {};
        let headers: any = {};
        let form: any = {};
        return new Promise(function(resolve, reject) {
            headers['Accept'] = 'application/json';

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
     * Get aliases of a gene
     * @method
     * @name CBioPortalAPI#getAliasesOfGeneUsingGET
     * @param {string} geneId - Entrez Gene ID or Hugo Gene Symbol e.g. 1 or A1BG
     */
    getAliasesOfGeneUsingGET(parameters: {
            'geneId': string,
            $queryParameters ? : any,
            $domain ? : string
        }): Promise < Array < string >
        > {
            return this.getAliasesOfGeneUsingGETWithHttpInfo(parameters).then(function(response: request.Response) {
                return response.body;
            });
        };
    getServerStatusUsingGETURL(parameters: {
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/api/health';

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
     * Get the running status of the server
     * @method
     * @name CBioPortalAPI#getServerStatusUsingGET
     */
    getServerStatusUsingGETWithHttpInfo(parameters: {
        $queryParameters ? : any,
            $domain ? : string
    }): Promise < request.Response > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        const errorHandlers = this.errorHandlers;
        const request = this.request;
        let path = '/api/health';
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
     * Get the running status of the server
     * @method
     * @name CBioPortalAPI#getServerStatusUsingGET
     */
    getServerStatusUsingGET(parameters: {
        $queryParameters ? : any,
            $domain ? : string
    }): Promise < ServerStatusMessage > {
        return this.getServerStatusUsingGETWithHttpInfo(parameters).then(function(response: request.Response) {
            return response.body;
        });
    };
    getInfoUsingGETURL(parameters: {
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/api/info';

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
     * Get information about the running instance
     * @method
     * @name CBioPortalAPI#getInfoUsingGET
     */
    getInfoUsingGETWithHttpInfo(parameters: {
        $queryParameters ? : any,
            $domain ? : string
    }): Promise < request.Response > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        const errorHandlers = this.errorHandlers;
        const request = this.request;
        let path = '/api/info';
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
     * Get information about the running instance
     * @method
     * @name CBioPortalAPI#getInfoUsingGET
     */
    getInfoUsingGET(parameters: {
        $queryParameters ? : any,
            $domain ? : string
    }): Promise < Info > {
        return this.getInfoUsingGETWithHttpInfo(parameters).then(function(response: request.Response) {
            return response.body;
        });
    };
    fetchMolecularDataInMultipleMolecularProfilesUsingPOSTURL(parameters: {
        'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
        'molecularDataMultipleStudyFilter' ? : MolecularDataMultipleStudyFilter,
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/api/molecular-data/fetch';
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
     * Fetch molecular data
     * @method
     * @name CBioPortalAPI#fetchMolecularDataInMultipleMolecularProfilesUsingPOST
     * @param {string} projection - Level of detail of the response
     * @param {} molecularDataMultipleStudyFilter - A web service for supplying JSON formatted data to cBioPortal clients. Please note that this API is currently in beta and subject to change.
     */
    fetchMolecularDataInMultipleMolecularProfilesUsingPOSTWithHttpInfo(parameters: {
        'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
        'molecularDataMultipleStudyFilter' ? : MolecularDataMultipleStudyFilter,
        $queryParameters ? : any,
            $domain ? : string
    }): Promise < request.Response > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        const errorHandlers = this.errorHandlers;
        const request = this.request;
        let path = '/api/molecular-data/fetch';
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

            if (parameters['molecularDataMultipleStudyFilter'] !== undefined) {
                body = parameters['molecularDataMultipleStudyFilter'];
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
     * Fetch molecular data
     * @method
     * @name CBioPortalAPI#fetchMolecularDataInMultipleMolecularProfilesUsingPOST
     * @param {string} projection - Level of detail of the response
     * @param {} molecularDataMultipleStudyFilter - A web service for supplying JSON formatted data to cBioPortal clients. Please note that this API is currently in beta and subject to change.
     */
    fetchMolecularDataInMultipleMolecularProfilesUsingPOST(parameters: {
            'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
            'molecularDataMultipleStudyFilter' ? : MolecularDataMultipleStudyFilter,
            $queryParameters ? : any,
                $domain ? : string
        }): Promise < Array < NumericGeneMolecularData >
        > {
            return this.fetchMolecularDataInMultipleMolecularProfilesUsingPOSTWithHttpInfo(parameters).then(function(response: request.Response) {
                return response.body;
            });
        };
    getAllMolecularProfilesUsingGETURL(parameters: {
        'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
        'pageSize' ? : number,
        'pageNumber' ? : number,
        'sortBy' ? : "molecularProfileId" | "molecularAlterationType" | "datatype" | "name" | "description" | "showProfileInAnalysisTab",
        'direction' ? : "ASC" | "DESC",
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/api/molecular-profiles';
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
     * Get all molecular profiles
     * @method
     * @name CBioPortalAPI#getAllMolecularProfilesUsingGET
     * @param {string} projection - Level of detail of the response
     * @param {integer} pageSize - Page size of the result list
     * @param {integer} pageNumber - Page number of the result list
     * @param {string} sortBy - Name of the property that the result list is sorted by
     * @param {string} direction - Direction of the sort
     */
    getAllMolecularProfilesUsingGETWithHttpInfo(parameters: {
        'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
        'pageSize' ? : number,
        'pageNumber' ? : number,
        'sortBy' ? : "molecularProfileId" | "molecularAlterationType" | "datatype" | "name" | "description" | "showProfileInAnalysisTab",
        'direction' ? : "ASC" | "DESC",
        $queryParameters ? : any,
            $domain ? : string
    }): Promise < request.Response > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        const errorHandlers = this.errorHandlers;
        const request = this.request;
        let path = '/api/molecular-profiles';
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
     * Get all molecular profiles
     * @method
     * @name CBioPortalAPI#getAllMolecularProfilesUsingGET
     * @param {string} projection - Level of detail of the response
     * @param {integer} pageSize - Page size of the result list
     * @param {integer} pageNumber - Page number of the result list
     * @param {string} sortBy - Name of the property that the result list is sorted by
     * @param {string} direction - Direction of the sort
     */
    getAllMolecularProfilesUsingGET(parameters: {
            'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
            'pageSize' ? : number,
            'pageNumber' ? : number,
            'sortBy' ? : "molecularProfileId" | "molecularAlterationType" | "datatype" | "name" | "description" | "showProfileInAnalysisTab",
            'direction' ? : "ASC" | "DESC",
            $queryParameters ? : any,
                $domain ? : string
        }): Promise < Array < MolecularProfile >
        > {
            return this.getAllMolecularProfilesUsingGETWithHttpInfo(parameters).then(function(response: request.Response) {
                return response.body;
            });
        };
    fetchMolecularProfilesUsingPOSTURL(parameters: {
        'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
        'molecularProfileFilter' ? : MolecularProfileFilter,
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/api/molecular-profiles/fetch';
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
     * Fetch molecular profiles
     * @method
     * @name CBioPortalAPI#fetchMolecularProfilesUsingPOST
     * @param {string} projection - Level of detail of the response
     * @param {} molecularProfileFilter - A web service for supplying JSON formatted data to cBioPortal clients. Please note that this API is currently in beta and subject to change.
     */
    fetchMolecularProfilesUsingPOSTWithHttpInfo(parameters: {
        'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
        'molecularProfileFilter' ? : MolecularProfileFilter,
        $queryParameters ? : any,
            $domain ? : string
    }): Promise < request.Response > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        const errorHandlers = this.errorHandlers;
        const request = this.request;
        let path = '/api/molecular-profiles/fetch';
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

            if (parameters['molecularProfileFilter'] !== undefined) {
                body = parameters['molecularProfileFilter'];
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
     * Fetch molecular profiles
     * @method
     * @name CBioPortalAPI#fetchMolecularProfilesUsingPOST
     * @param {string} projection - Level of detail of the response
     * @param {} molecularProfileFilter - A web service for supplying JSON formatted data to cBioPortal clients. Please note that this API is currently in beta and subject to change.
     */
    fetchMolecularProfilesUsingPOST(parameters: {
            'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
            'molecularProfileFilter' ? : MolecularProfileFilter,
            $queryParameters ? : any,
                $domain ? : string
        }): Promise < Array < MolecularProfile >
        > {
            return this.fetchMolecularProfilesUsingPOSTWithHttpInfo(parameters).then(function(response: request.Response) {
                return response.body;
            });
        };
    getMolecularProfileUsingGETURL(parameters: {
        'molecularProfileId': string,
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/api/molecular-profiles/{molecularProfileId}';

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
     * Get molecular profile
     * @method
     * @name CBioPortalAPI#getMolecularProfileUsingGET
     * @param {string} molecularProfileId - Molecular Profile ID e.g. acc_tcga_mutations
     */
    getMolecularProfileUsingGETWithHttpInfo(parameters: {
        'molecularProfileId': string,
        $queryParameters ? : any,
        $domain ? : string
    }): Promise < request.Response > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        const errorHandlers = this.errorHandlers;
        const request = this.request;
        let path = '/api/molecular-profiles/{molecularProfileId}';
        let body: any;
        let queryParameters: any = {};
        let headers: any = {};
        let form: any = {};
        return new Promise(function(resolve, reject) {
            headers['Accept'] = 'application/json';

            path = path.replace('{molecularProfileId}', parameters['molecularProfileId'] + '');

            if (parameters['molecularProfileId'] === undefined) {
                reject(new Error('Missing required  parameter: molecularProfileId'));
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
     * Get molecular profile
     * @method
     * @name CBioPortalAPI#getMolecularProfileUsingGET
     * @param {string} molecularProfileId - Molecular Profile ID e.g. acc_tcga_mutations
     */
    getMolecularProfileUsingGET(parameters: {
        'molecularProfileId': string,
        $queryParameters ? : any,
        $domain ? : string
    }): Promise < MolecularProfile > {
        return this.getMolecularProfileUsingGETWithHttpInfo(parameters).then(function(response: request.Response) {
            return response.body;
        });
    };
    getDiscreteCopyNumbersInMolecularProfileUsingGETURL(parameters: {
        'molecularProfileId': string,
        'sampleListId': string,
        'discreteCopyNumberEventType' ? : "HOMDEL_AND_AMP" | "HOMDEL" | "AMP" | "GAIN" | "HETLOSS" | "DIPLOID" | "ALL",
        'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/api/molecular-profiles/{molecularProfileId}/discrete-copy-number';

        path = path.replace('{molecularProfileId}', parameters['molecularProfileId'] + '');
        if (parameters['sampleListId'] !== undefined) {
            queryParameters['sampleListId'] = parameters['sampleListId'];
        }

        if (parameters['discreteCopyNumberEventType'] !== undefined) {
            queryParameters['discreteCopyNumberEventType'] = parameters['discreteCopyNumberEventType'];
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
     * Get discrete copy number alterations in a molecular profile
     * @method
     * @name CBioPortalAPI#getDiscreteCopyNumbersInMolecularProfileUsingGET
     * @param {string} molecularProfileId - Molecular Profile ID e.g. acc_tcga_gistic
     * @param {string} sampleListId - Sample List ID e.g. acc_tcga_all
     * @param {string} discreteCopyNumberEventType - Type of the copy number event
     * @param {string} projection - Level of detail of the response
     */
    getDiscreteCopyNumbersInMolecularProfileUsingGETWithHttpInfo(parameters: {
        'molecularProfileId': string,
        'sampleListId': string,
        'discreteCopyNumberEventType' ? : "HOMDEL_AND_AMP" | "HOMDEL" | "AMP" | "GAIN" | "HETLOSS" | "DIPLOID" | "ALL",
        'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
        $queryParameters ? : any,
        $domain ? : string
    }): Promise < request.Response > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        const errorHandlers = this.errorHandlers;
        const request = this.request;
        let path = '/api/molecular-profiles/{molecularProfileId}/discrete-copy-number';
        let body: any;
        let queryParameters: any = {};
        let headers: any = {};
        let form: any = {};
        return new Promise(function(resolve, reject) {
            headers['Accept'] = 'application/json';

            path = path.replace('{molecularProfileId}', parameters['molecularProfileId'] + '');

            if (parameters['molecularProfileId'] === undefined) {
                reject(new Error('Missing required  parameter: molecularProfileId'));
                return;
            }

            if (parameters['sampleListId'] !== undefined) {
                queryParameters['sampleListId'] = parameters['sampleListId'];
            }

            if (parameters['sampleListId'] === undefined) {
                reject(new Error('Missing required  parameter: sampleListId'));
                return;
            }

            if (parameters['discreteCopyNumberEventType'] !== undefined) {
                queryParameters['discreteCopyNumberEventType'] = parameters['discreteCopyNumberEventType'];
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

            request('GET', domain + path, body, headers, queryParameters, form, reject, resolve, errorHandlers);

        });
    };

    /**
     * Get discrete copy number alterations in a molecular profile
     * @method
     * @name CBioPortalAPI#getDiscreteCopyNumbersInMolecularProfileUsingGET
     * @param {string} molecularProfileId - Molecular Profile ID e.g. acc_tcga_gistic
     * @param {string} sampleListId - Sample List ID e.g. acc_tcga_all
     * @param {string} discreteCopyNumberEventType - Type of the copy number event
     * @param {string} projection - Level of detail of the response
     */
    getDiscreteCopyNumbersInMolecularProfileUsingGET(parameters: {
            'molecularProfileId': string,
            'sampleListId': string,
            'discreteCopyNumberEventType' ? : "HOMDEL_AND_AMP" | "HOMDEL" | "AMP" | "GAIN" | "HETLOSS" | "DIPLOID" | "ALL",
            'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
            $queryParameters ? : any,
            $domain ? : string
        }): Promise < Array < DiscreteCopyNumberData >
        > {
            return this.getDiscreteCopyNumbersInMolecularProfileUsingGETWithHttpInfo(parameters).then(function(response: request.Response) {
                return response.body;
            });
        };
    fetchDiscreteCopyNumbersInMolecularProfileUsingPOSTURL(parameters: {
        'molecularProfileId': string,
        'discreteCopyNumberEventType' ? : "HOMDEL_AND_AMP" | "HOMDEL" | "AMP" | "GAIN" | "HETLOSS" | "DIPLOID" | "ALL",
        'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
        'discreteCopyNumberFilter': DiscreteCopyNumberFilter,
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/api/molecular-profiles/{molecularProfileId}/discrete-copy-number/fetch';

        path = path.replace('{molecularProfileId}', parameters['molecularProfileId'] + '');
        if (parameters['discreteCopyNumberEventType'] !== undefined) {
            queryParameters['discreteCopyNumberEventType'] = parameters['discreteCopyNumberEventType'];
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
     * Fetch discrete copy number alterations in a molecular profile by sample ID
     * @method
     * @name CBioPortalAPI#fetchDiscreteCopyNumbersInMolecularProfileUsingPOST
     * @param {string} molecularProfileId - Molecular Profile ID e.g. acc_tcga_gistic
     * @param {string} discreteCopyNumberEventType - Type of the copy number event
     * @param {string} projection - Level of detail of the response
     * @param {} discreteCopyNumberFilter - A web service for supplying JSON formatted data to cBioPortal clients. Please note that this API is currently in beta and subject to change.
     */
    fetchDiscreteCopyNumbersInMolecularProfileUsingPOSTWithHttpInfo(parameters: {
        'molecularProfileId': string,
        'discreteCopyNumberEventType' ? : "HOMDEL_AND_AMP" | "HOMDEL" | "AMP" | "GAIN" | "HETLOSS" | "DIPLOID" | "ALL",
        'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
        'discreteCopyNumberFilter': DiscreteCopyNumberFilter,
        $queryParameters ? : any,
        $domain ? : string
    }): Promise < request.Response > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        const errorHandlers = this.errorHandlers;
        const request = this.request;
        let path = '/api/molecular-profiles/{molecularProfileId}/discrete-copy-number/fetch';
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

            if (parameters['discreteCopyNumberEventType'] !== undefined) {
                queryParameters['discreteCopyNumberEventType'] = parameters['discreteCopyNumberEventType'];
            }

            if (parameters['projection'] !== undefined) {
                queryParameters['projection'] = parameters['projection'];
            }

            if (parameters['discreteCopyNumberFilter'] !== undefined) {
                body = parameters['discreteCopyNumberFilter'];
            }

            if (parameters['discreteCopyNumberFilter'] === undefined) {
                reject(new Error('Missing required  parameter: discreteCopyNumberFilter'));
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
     * Fetch discrete copy number alterations in a molecular profile by sample ID
     * @method
     * @name CBioPortalAPI#fetchDiscreteCopyNumbersInMolecularProfileUsingPOST
     * @param {string} molecularProfileId - Molecular Profile ID e.g. acc_tcga_gistic
     * @param {string} discreteCopyNumberEventType - Type of the copy number event
     * @param {string} projection - Level of detail of the response
     * @param {} discreteCopyNumberFilter - A web service for supplying JSON formatted data to cBioPortal clients. Please note that this API is currently in beta and subject to change.
     */
    fetchDiscreteCopyNumbersInMolecularProfileUsingPOST(parameters: {
            'molecularProfileId': string,
            'discreteCopyNumberEventType' ? : "HOMDEL_AND_AMP" | "HOMDEL" | "AMP" | "GAIN" | "HETLOSS" | "DIPLOID" | "ALL",
            'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
            'discreteCopyNumberFilter': DiscreteCopyNumberFilter,
            $queryParameters ? : any,
            $domain ? : string
        }): Promise < Array < DiscreteCopyNumberData >
        > {
            return this.fetchDiscreteCopyNumbersInMolecularProfileUsingPOSTWithHttpInfo(parameters).then(function(response: request.Response) {
                return response.body;
            });
        };
    getGenePanelDataUsingPOSTURL(parameters: {
        'molecularProfileId': string,
        'genePanelDataFilter': GenePanelDataFilter,
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/api/molecular-profiles/{molecularProfileId}/gene-panel-data/fetch';

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
     * Get gene panel data
     * @method
     * @name CBioPortalAPI#getGenePanelDataUsingPOST
     * @param {string} molecularProfileId - Molecular Profile ID e.g. nsclc_unito_2016_mutations
     * @param {} genePanelDataFilter - A web service for supplying JSON formatted data to cBioPortal clients. Please note that this API is currently in beta and subject to change.
     */
    getGenePanelDataUsingPOSTWithHttpInfo(parameters: {
        'molecularProfileId': string,
        'genePanelDataFilter': GenePanelDataFilter,
        $queryParameters ? : any,
        $domain ? : string
    }): Promise < request.Response > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        const errorHandlers = this.errorHandlers;
        const request = this.request;
        let path = '/api/molecular-profiles/{molecularProfileId}/gene-panel-data/fetch';
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

            if (parameters['genePanelDataFilter'] !== undefined) {
                body = parameters['genePanelDataFilter'];
            }

            if (parameters['genePanelDataFilter'] === undefined) {
                reject(new Error('Missing required  parameter: genePanelDataFilter'));
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
     * Get gene panel data
     * @method
     * @name CBioPortalAPI#getGenePanelDataUsingPOST
     * @param {string} molecularProfileId - Molecular Profile ID e.g. nsclc_unito_2016_mutations
     * @param {} genePanelDataFilter - A web service for supplying JSON formatted data to cBioPortal clients. Please note that this API is currently in beta and subject to change.
     */
    getGenePanelDataUsingPOST(parameters: {
            'molecularProfileId': string,
            'genePanelDataFilter': GenePanelDataFilter,
            $queryParameters ? : any,
            $domain ? : string
        }): Promise < Array < GenePanelData >
        > {
            return this.getGenePanelDataUsingPOSTWithHttpInfo(parameters).then(function(response: request.Response) {
                return response.body;
            });
        };
    getAllMolecularDataInMolecularProfileUsingGETURL(parameters: {
        'molecularProfileId': string,
        'sampleListId': string,
        'entrezGeneId': number,
        'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/api/molecular-profiles/{molecularProfileId}/molecular-data';

        path = path.replace('{molecularProfileId}', parameters['molecularProfileId'] + '');
        if (parameters['sampleListId'] !== undefined) {
            queryParameters['sampleListId'] = parameters['sampleListId'];
        }

        if (parameters['entrezGeneId'] !== undefined) {
            queryParameters['entrezGeneId'] = parameters['entrezGeneId'];
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
     * Get all molecular data in a molecular profile
     * @method
     * @name CBioPortalAPI#getAllMolecularDataInMolecularProfileUsingGET
     * @param {string} molecularProfileId - Molecular Profile ID e.g. acc_tcga_rna_seq_v2_mrna
     * @param {string} sampleListId - Sample List ID e.g. acc_tcga_all
     * @param {integer} entrezGeneId - Entrez Gene ID e.g. 1
     * @param {string} projection - Level of detail of the response
     */
    getAllMolecularDataInMolecularProfileUsingGETWithHttpInfo(parameters: {
        'molecularProfileId': string,
        'sampleListId': string,
        'entrezGeneId': number,
        'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
        $queryParameters ? : any,
        $domain ? : string
    }): Promise < request.Response > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        const errorHandlers = this.errorHandlers;
        const request = this.request;
        let path = '/api/molecular-profiles/{molecularProfileId}/molecular-data';
        let body: any;
        let queryParameters: any = {};
        let headers: any = {};
        let form: any = {};
        return new Promise(function(resolve, reject) {
            headers['Accept'] = 'application/json';

            path = path.replace('{molecularProfileId}', parameters['molecularProfileId'] + '');

            if (parameters['molecularProfileId'] === undefined) {
                reject(new Error('Missing required  parameter: molecularProfileId'));
                return;
            }

            if (parameters['sampleListId'] !== undefined) {
                queryParameters['sampleListId'] = parameters['sampleListId'];
            }

            if (parameters['sampleListId'] === undefined) {
                reject(new Error('Missing required  parameter: sampleListId'));
                return;
            }

            if (parameters['entrezGeneId'] !== undefined) {
                queryParameters['entrezGeneId'] = parameters['entrezGeneId'];
            }

            if (parameters['entrezGeneId'] === undefined) {
                reject(new Error('Missing required  parameter: entrezGeneId'));
                return;
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

            request('GET', domain + path, body, headers, queryParameters, form, reject, resolve, errorHandlers);

        });
    };

    /**
     * Get all molecular data in a molecular profile
     * @method
     * @name CBioPortalAPI#getAllMolecularDataInMolecularProfileUsingGET
     * @param {string} molecularProfileId - Molecular Profile ID e.g. acc_tcga_rna_seq_v2_mrna
     * @param {string} sampleListId - Sample List ID e.g. acc_tcga_all
     * @param {integer} entrezGeneId - Entrez Gene ID e.g. 1
     * @param {string} projection - Level of detail of the response
     */
    getAllMolecularDataInMolecularProfileUsingGET(parameters: {
            'molecularProfileId': string,
            'sampleListId': string,
            'entrezGeneId': number,
            'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
            $queryParameters ? : any,
            $domain ? : string
        }): Promise < Array < NumericGeneMolecularData >
        > {
            return this.getAllMolecularDataInMolecularProfileUsingGETWithHttpInfo(parameters).then(function(response: request.Response) {
                return response.body;
            });
        };
    fetchAllMolecularDataInMolecularProfileUsingPOSTURL(parameters: {
        'molecularProfileId': string,
        'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
        'molecularDataFilter': MolecularDataFilter,
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/api/molecular-profiles/{molecularProfileId}/molecular-data/fetch';

        path = path.replace('{molecularProfileId}', parameters['molecularProfileId'] + '');
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
     * Fetch molecular data in a molecular profile
     * @method
     * @name CBioPortalAPI#fetchAllMolecularDataInMolecularProfileUsingPOST
     * @param {string} molecularProfileId - Molecular Profile ID e.g. acc_tcga_rna_seq_v2_mrna
     * @param {string} projection - Level of detail of the response
     * @param {} molecularDataFilter - A web service for supplying JSON formatted data to cBioPortal clients. Please note that this API is currently in beta and subject to change.
     */
    fetchAllMolecularDataInMolecularProfileUsingPOSTWithHttpInfo(parameters: {
        'molecularProfileId': string,
        'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
        'molecularDataFilter': MolecularDataFilter,
        $queryParameters ? : any,
        $domain ? : string
    }): Promise < request.Response > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        const errorHandlers = this.errorHandlers;
        const request = this.request;
        let path = '/api/molecular-profiles/{molecularProfileId}/molecular-data/fetch';
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

            if (parameters['projection'] !== undefined) {
                queryParameters['projection'] = parameters['projection'];
            }

            if (parameters['molecularDataFilter'] !== undefined) {
                body = parameters['molecularDataFilter'];
            }

            if (parameters['molecularDataFilter'] === undefined) {
                reject(new Error('Missing required  parameter: molecularDataFilter'));
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
     * Fetch molecular data in a molecular profile
     * @method
     * @name CBioPortalAPI#fetchAllMolecularDataInMolecularProfileUsingPOST
     * @param {string} molecularProfileId - Molecular Profile ID e.g. acc_tcga_rna_seq_v2_mrna
     * @param {string} projection - Level of detail of the response
     * @param {} molecularDataFilter - A web service for supplying JSON formatted data to cBioPortal clients. Please note that this API is currently in beta and subject to change.
     */
    fetchAllMolecularDataInMolecularProfileUsingPOST(parameters: {
            'molecularProfileId': string,
            'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
            'molecularDataFilter': MolecularDataFilter,
            $queryParameters ? : any,
            $domain ? : string
        }): Promise < Array < NumericGeneMolecularData >
        > {
            return this.fetchAllMolecularDataInMolecularProfileUsingPOSTWithHttpInfo(parameters).then(function(response: request.Response) {
                return response.body;
            });
        };
    getMutationsInMolecularProfileBySampleListIdUsingGETURL(parameters: {
        'molecularProfileId': string,
        'sampleListId': string,
        'entrezGeneId': number,
        'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
        'pageSize' ? : number,
        'pageNumber' ? : number,
        'sortBy' ? : "entrezGeneId" | "center" | "mutationStatus" | "validationStatus" | "tumorAltCount" | "tumorRefCount" | "normalAltCount" | "normalRefCount" | "aminoAcidChange" | "startPosition" | "endPosition" | "referenceAllele" | "variantAllele" | "proteinChange" | "mutationType" | "ncbiBuild" | "variantType" | "refseqMrnaId" | "proteinPosStart" | "proteinPosEnd" | "keyword",
        'direction' ? : "ASC" | "DESC",
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/api/molecular-profiles/{molecularProfileId}/mutations';

        path = path.replace('{molecularProfileId}', parameters['molecularProfileId'] + '');
        if (parameters['sampleListId'] !== undefined) {
            queryParameters['sampleListId'] = parameters['sampleListId'];
        }

        if (parameters['entrezGeneId'] !== undefined) {
            queryParameters['entrezGeneId'] = parameters['entrezGeneId'];
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
     * Get mutations in a molecular profile by Sample List ID
     * @method
     * @name CBioPortalAPI#getMutationsInMolecularProfileBySampleListIdUsingGET
     * @param {string} molecularProfileId - Molecular Profile ID e.g. acc_tcga_mutations
     * @param {string} sampleListId - Sample List ID e.g. acc_tcga_all
     * @param {integer} entrezGeneId - Entrez Gene ID
     * @param {string} projection - Level of detail of the response
     * @param {integer} pageSize - Page size of the result list
     * @param {integer} pageNumber - Page number of the result list
     * @param {string} sortBy - Name of the property that the result list is sorted by
     * @param {string} direction - Direction of the sort
     */
    getMutationsInMolecularProfileBySampleListIdUsingGETWithHttpInfo(parameters: {
        'molecularProfileId': string,
        'sampleListId': string,
        'entrezGeneId': number,
        'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
        'pageSize' ? : number,
        'pageNumber' ? : number,
        'sortBy' ? : "entrezGeneId" | "center" | "mutationStatus" | "validationStatus" | "tumorAltCount" | "tumorRefCount" | "normalAltCount" | "normalRefCount" | "aminoAcidChange" | "startPosition" | "endPosition" | "referenceAllele" | "variantAllele" | "proteinChange" | "mutationType" | "ncbiBuild" | "variantType" | "refseqMrnaId" | "proteinPosStart" | "proteinPosEnd" | "keyword",
        'direction' ? : "ASC" | "DESC",
        $queryParameters ? : any,
        $domain ? : string
    }): Promise < request.Response > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        const errorHandlers = this.errorHandlers;
        const request = this.request;
        let path = '/api/molecular-profiles/{molecularProfileId}/mutations';
        let body: any;
        let queryParameters: any = {};
        let headers: any = {};
        let form: any = {};
        return new Promise(function(resolve, reject) {
            headers['Accept'] = 'application/json';

            path = path.replace('{molecularProfileId}', parameters['molecularProfileId'] + '');

            if (parameters['molecularProfileId'] === undefined) {
                reject(new Error('Missing required  parameter: molecularProfileId'));
                return;
            }

            if (parameters['sampleListId'] !== undefined) {
                queryParameters['sampleListId'] = parameters['sampleListId'];
            }

            if (parameters['sampleListId'] === undefined) {
                reject(new Error('Missing required  parameter: sampleListId'));
                return;
            }

            if (parameters['entrezGeneId'] !== undefined) {
                queryParameters['entrezGeneId'] = parameters['entrezGeneId'];
            }

            if (parameters['entrezGeneId'] === undefined) {
                reject(new Error('Missing required  parameter: entrezGeneId'));
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
     * Get mutations in a molecular profile by Sample List ID
     * @method
     * @name CBioPortalAPI#getMutationsInMolecularProfileBySampleListIdUsingGET
     * @param {string} molecularProfileId - Molecular Profile ID e.g. acc_tcga_mutations
     * @param {string} sampleListId - Sample List ID e.g. acc_tcga_all
     * @param {integer} entrezGeneId - Entrez Gene ID
     * @param {string} projection - Level of detail of the response
     * @param {integer} pageSize - Page size of the result list
     * @param {integer} pageNumber - Page number of the result list
     * @param {string} sortBy - Name of the property that the result list is sorted by
     * @param {string} direction - Direction of the sort
     */
    getMutationsInMolecularProfileBySampleListIdUsingGET(parameters: {
            'molecularProfileId': string,
            'sampleListId': string,
            'entrezGeneId': number,
            'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
            'pageSize' ? : number,
            'pageNumber' ? : number,
            'sortBy' ? : "entrezGeneId" | "center" | "mutationStatus" | "validationStatus" | "tumorAltCount" | "tumorRefCount" | "normalAltCount" | "normalRefCount" | "aminoAcidChange" | "startPosition" | "endPosition" | "referenceAllele" | "variantAllele" | "proteinChange" | "mutationType" | "ncbiBuild" | "variantType" | "refseqMrnaId" | "proteinPosStart" | "proteinPosEnd" | "keyword",
            'direction' ? : "ASC" | "DESC",
            $queryParameters ? : any,
            $domain ? : string
        }): Promise < Array < Mutation >
        > {
            return this.getMutationsInMolecularProfileBySampleListIdUsingGETWithHttpInfo(parameters).then(function(response: request.Response) {
                return response.body;
            });
        };
    fetchMutationsInMolecularProfileUsingPOSTURL(parameters: {
        'molecularProfileId': string,
        'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
        'pageSize' ? : number,
        'pageNumber' ? : number,
        'sortBy' ? : "entrezGeneId" | "center" | "mutationStatus" | "validationStatus" | "tumorAltCount" | "tumorRefCount" | "normalAltCount" | "normalRefCount" | "aminoAcidChange" | "startPosition" | "endPosition" | "referenceAllele" | "variantAllele" | "proteinChange" | "mutationType" | "ncbiBuild" | "variantType" | "refseqMrnaId" | "proteinPosStart" | "proteinPosEnd" | "keyword",
        'direction' ? : "ASC" | "DESC",
        'mutationFilter': MutationFilter,
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/api/molecular-profiles/{molecularProfileId}/mutations/fetch';

        path = path.replace('{molecularProfileId}', parameters['molecularProfileId'] + '');
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
     * Fetch mutations in a molecular profile
     * @method
     * @name CBioPortalAPI#fetchMutationsInMolecularProfileUsingPOST
     * @param {string} molecularProfileId - Molecular Profile ID e.g. acc_tcga_mutations
     * @param {string} projection - Level of detail of the response
     * @param {integer} pageSize - Page size of the result list
     * @param {integer} pageNumber - Page number of the result list
     * @param {string} sortBy - Name of the property that the result list is sorted by
     * @param {string} direction - Direction of the sort
     * @param {} mutationFilter - A web service for supplying JSON formatted data to cBioPortal clients. Please note that this API is currently in beta and subject to change.
     */
    fetchMutationsInMolecularProfileUsingPOSTWithHttpInfo(parameters: {
        'molecularProfileId': string,
        'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
        'pageSize' ? : number,
        'pageNumber' ? : number,
        'sortBy' ? : "entrezGeneId" | "center" | "mutationStatus" | "validationStatus" | "tumorAltCount" | "tumorRefCount" | "normalAltCount" | "normalRefCount" | "aminoAcidChange" | "startPosition" | "endPosition" | "referenceAllele" | "variantAllele" | "proteinChange" | "mutationType" | "ncbiBuild" | "variantType" | "refseqMrnaId" | "proteinPosStart" | "proteinPosEnd" | "keyword",
        'direction' ? : "ASC" | "DESC",
        'mutationFilter': MutationFilter,
        $queryParameters ? : any,
        $domain ? : string
    }): Promise < request.Response > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        const errorHandlers = this.errorHandlers;
        const request = this.request;
        let path = '/api/molecular-profiles/{molecularProfileId}/mutations/fetch';
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

            if (parameters['mutationFilter'] !== undefined) {
                body = parameters['mutationFilter'];
            }

            if (parameters['mutationFilter'] === undefined) {
                reject(new Error('Missing required  parameter: mutationFilter'));
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
     * Fetch mutations in a molecular profile
     * @method
     * @name CBioPortalAPI#fetchMutationsInMolecularProfileUsingPOST
     * @param {string} molecularProfileId - Molecular Profile ID e.g. acc_tcga_mutations
     * @param {string} projection - Level of detail of the response
     * @param {integer} pageSize - Page size of the result list
     * @param {integer} pageNumber - Page number of the result list
     * @param {string} sortBy - Name of the property that the result list is sorted by
     * @param {string} direction - Direction of the sort
     * @param {} mutationFilter - A web service for supplying JSON formatted data to cBioPortal clients. Please note that this API is currently in beta and subject to change.
     */
    fetchMutationsInMolecularProfileUsingPOST(parameters: {
            'molecularProfileId': string,
            'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
            'pageSize' ? : number,
            'pageNumber' ? : number,
            'sortBy' ? : "entrezGeneId" | "center" | "mutationStatus" | "validationStatus" | "tumorAltCount" | "tumorRefCount" | "normalAltCount" | "normalRefCount" | "aminoAcidChange" | "startPosition" | "endPosition" | "referenceAllele" | "variantAllele" | "proteinChange" | "mutationType" | "ncbiBuild" | "variantType" | "refseqMrnaId" | "proteinPosStart" | "proteinPosEnd" | "keyword",
            'direction' ? : "ASC" | "DESC",
            'mutationFilter': MutationFilter,
            $queryParameters ? : any,
            $domain ? : string
        }): Promise < Array < Mutation >
        > {
            return this.fetchMutationsInMolecularProfileUsingPOSTWithHttpInfo(parameters).then(function(response: request.Response) {
                return response.body;
            });
        };
    fetchMutationsInMultipleMolecularProfilesUsingPOSTURL(parameters: {
        'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
        'pageSize' ? : number,
        'pageNumber' ? : number,
        'sortBy' ? : "entrezGeneId" | "center" | "mutationStatus" | "validationStatus" | "tumorAltCount" | "tumorRefCount" | "normalAltCount" | "normalRefCount" | "aminoAcidChange" | "startPosition" | "endPosition" | "referenceAllele" | "variantAllele" | "proteinChange" | "mutationType" | "ncbiBuild" | "variantType" | "refseqMrnaId" | "proteinPosStart" | "proteinPosEnd" | "keyword",
        'direction' ? : "ASC" | "DESC",
        'mutationMultipleStudyFilter' ? : MutationMultipleStudyFilter,
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/api/mutations/fetch';
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
     * Fetch mutations in multiple molecular profiles by sample IDs
     * @method
     * @name CBioPortalAPI#fetchMutationsInMultipleMolecularProfilesUsingPOST
     * @param {string} projection - Level of detail of the response
     * @param {integer} pageSize - Page size of the result list
     * @param {integer} pageNumber - Page number of the result list
     * @param {string} sortBy - Name of the property that the result list is sorted by
     * @param {string} direction - Direction of the sort
     * @param {} mutationMultipleStudyFilter - A web service for supplying JSON formatted data to cBioPortal clients. Please note that this API is currently in beta and subject to change.
     */
    fetchMutationsInMultipleMolecularProfilesUsingPOSTWithHttpInfo(parameters: {
        'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
        'pageSize' ? : number,
        'pageNumber' ? : number,
        'sortBy' ? : "entrezGeneId" | "center" | "mutationStatus" | "validationStatus" | "tumorAltCount" | "tumorRefCount" | "normalAltCount" | "normalRefCount" | "aminoAcidChange" | "startPosition" | "endPosition" | "referenceAllele" | "variantAllele" | "proteinChange" | "mutationType" | "ncbiBuild" | "variantType" | "refseqMrnaId" | "proteinPosStart" | "proteinPosEnd" | "keyword",
        'direction' ? : "ASC" | "DESC",
        'mutationMultipleStudyFilter' ? : MutationMultipleStudyFilter,
        $queryParameters ? : any,
            $domain ? : string
    }): Promise < request.Response > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        const errorHandlers = this.errorHandlers;
        const request = this.request;
        let path = '/api/mutations/fetch';
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

            if (parameters['mutationMultipleStudyFilter'] !== undefined) {
                body = parameters['mutationMultipleStudyFilter'];
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
     * Fetch mutations in multiple molecular profiles by sample IDs
     * @method
     * @name CBioPortalAPI#fetchMutationsInMultipleMolecularProfilesUsingPOST
     * @param {string} projection - Level of detail of the response
     * @param {integer} pageSize - Page size of the result list
     * @param {integer} pageNumber - Page number of the result list
     * @param {string} sortBy - Name of the property that the result list is sorted by
     * @param {string} direction - Direction of the sort
     * @param {} mutationMultipleStudyFilter - A web service for supplying JSON formatted data to cBioPortal clients. Please note that this API is currently in beta and subject to change.
     */
    fetchMutationsInMultipleMolecularProfilesUsingPOST(parameters: {
            'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
            'pageSize' ? : number,
            'pageNumber' ? : number,
            'sortBy' ? : "entrezGeneId" | "center" | "mutationStatus" | "validationStatus" | "tumorAltCount" | "tumorRefCount" | "normalAltCount" | "normalRefCount" | "aminoAcidChange" | "startPosition" | "endPosition" | "referenceAllele" | "variantAllele" | "proteinChange" | "mutationType" | "ncbiBuild" | "variantType" | "refseqMrnaId" | "proteinPosStart" | "proteinPosEnd" | "keyword",
            'direction' ? : "ASC" | "DESC",
            'mutationMultipleStudyFilter' ? : MutationMultipleStudyFilter,
            $queryParameters ? : any,
                $domain ? : string
        }): Promise < Array < Mutation >
        > {
            return this.fetchMutationsInMultipleMolecularProfilesUsingPOSTWithHttpInfo(parameters).then(function(response: request.Response) {
                return response.body;
            });
        };
    fetchNamespaceUsingPOSTURL(parameters: {
        'studyIds': Array < string > ,
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/api/namespace-attributes/fetch';

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
     * Fetch namespace attributes
     * @method
     * @name CBioPortalAPI#fetchNamespaceUsingPOST
     * @param {} studyIds - A web service for supplying JSON formatted data to cBioPortal clients. Please note that this API is currently in beta and subject to change.
     */
    fetchNamespaceUsingPOSTWithHttpInfo(parameters: {
        'studyIds': Array < string > ,
        $queryParameters ? : any,
        $domain ? : string
    }): Promise < request.Response > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        const errorHandlers = this.errorHandlers;
        const request = this.request;
        let path = '/api/namespace-attributes/fetch';
        let body: any;
        let queryParameters: any = {};
        let headers: any = {};
        let form: any = {};
        return new Promise(function(resolve, reject) {
            headers['Accept'] = 'application/octet-stream';
            headers['Content-Type'] = 'application/json';

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
     * Fetch namespace attributes
     * @method
     * @name CBioPortalAPI#fetchNamespaceUsingPOST
     * @param {} studyIds - A web service for supplying JSON formatted data to cBioPortal clients. Please note that this API is currently in beta and subject to change.
     */
    fetchNamespaceUsingPOST(parameters: {
            'studyIds': Array < string > ,
            $queryParameters ? : any,
            $domain ? : string
        }): Promise < Array < NamespaceAttribute >
        > {
            return this.fetchNamespaceUsingPOSTWithHttpInfo(parameters).then(function(response: request.Response) {
                return response.body;
            });
        };
    getAllPatientsUsingGETURL(parameters: {
        'keyword' ? : string,
        'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
        'pageSize' ? : number,
        'pageNumber' ? : number,
        'direction' ? : "ASC" | "DESC",
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/api/patients';
        if (parameters['keyword'] !== undefined) {
            queryParameters['keyword'] = parameters['keyword'];
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

        queryParameters['sortBy'] = 'patientId';

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
    * Get all patients
    * @method
    * @name CBioPortalAPI#getAllPatientsUsingGET
         * @param {string} keyword - Search keyword that applies to ID of the patients
         * @param {string} projection - Level of detail of the response
         * @param {integer} pageSize - Page size of the result list
         * @param {integer} pageNumber - Page number of the result list
        
         * @param {string} direction - Direction of the sort
    */
    getAllPatientsUsingGETWithHttpInfo(parameters: {
        'keyword' ? : string,
        'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
        'pageSize' ? : number,
        'pageNumber' ? : number,
        'direction' ? : "ASC" | "DESC",
        $queryParameters ? : any,
            $domain ? : string
    }): Promise < request.Response > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        const errorHandlers = this.errorHandlers;
        const request = this.request;
        let path = '/api/patients';
        let body: any;
        let queryParameters: any = {};
        let headers: any = {};
        let form: any = {};
        return new Promise(function(resolve, reject) {
            headers['Accept'] = 'application/json';

            if (parameters['keyword'] !== undefined) {
                queryParameters['keyword'] = parameters['keyword'];
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

            queryParameters['sortBy'] = 'patientId';

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
    * Get all patients
    * @method
    * @name CBioPortalAPI#getAllPatientsUsingGET
         * @param {string} keyword - Search keyword that applies to ID of the patients
         * @param {string} projection - Level of detail of the response
         * @param {integer} pageSize - Page size of the result list
         * @param {integer} pageNumber - Page number of the result list
        
         * @param {string} direction - Direction of the sort
    */
    getAllPatientsUsingGET(parameters: {
            'keyword' ? : string,
            'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
            'pageSize' ? : number,
            'pageNumber' ? : number,
            'direction' ? : "ASC" | "DESC",
            $queryParameters ? : any,
                $domain ? : string
        }): Promise < Array < Patient >
        > {
            return this.getAllPatientsUsingGETWithHttpInfo(parameters).then(function(response: request.Response) {
                return response.body;
            });
        };
    fetchPatientsUsingPOSTURL(parameters: {
        'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
        'patientFilter' ? : PatientFilter,
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/api/patients/fetch';
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
     * @name CBioPortalAPI#fetchPatientsUsingPOST
     * @param {string} projection - Level of detail of the response
     * @param {} patientFilter - A web service for supplying JSON formatted data to cBioPortal clients. Please note that this API is currently in beta and subject to change.
     */
    fetchPatientsUsingPOSTWithHttpInfo(parameters: {
        'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
        'patientFilter' ? : PatientFilter,
        $queryParameters ? : any,
            $domain ? : string
    }): Promise < request.Response > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        const errorHandlers = this.errorHandlers;
        const request = this.request;
        let path = '/api/patients/fetch';
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

            if (parameters['patientFilter'] !== undefined) {
                body = parameters['patientFilter'];
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
     * @name CBioPortalAPI#fetchPatientsUsingPOST
     * @param {string} projection - Level of detail of the response
     * @param {} patientFilter - A web service for supplying JSON formatted data to cBioPortal clients. Please note that this API is currently in beta and subject to change.
     */
    fetchPatientsUsingPOST(parameters: {
            'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
            'patientFilter' ? : PatientFilter,
            $queryParameters ? : any,
                $domain ? : string
        }): Promise < Array < Patient >
        > {
            return this.fetchPatientsUsingPOSTWithHttpInfo(parameters).then(function(response: request.Response) {
                return response.body;
            });
        };
    getAllSampleListsUsingGETURL(parameters: {
        'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
        'pageSize' ? : number,
        'pageNumber' ? : number,
        'sortBy' ? : "sampleListId" | "category" | "studyId" | "name" | "description",
        'direction' ? : "ASC" | "DESC",
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/api/sample-lists';
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
     * Get all sample lists
     * @method
     * @name CBioPortalAPI#getAllSampleListsUsingGET
     * @param {string} projection - Level of detail of the response
     * @param {integer} pageSize - Page size of the result list
     * @param {integer} pageNumber - Page number of the result list
     * @param {string} sortBy - Name of the property that the result list is sorted by
     * @param {string} direction - Direction of the sort
     */
    getAllSampleListsUsingGETWithHttpInfo(parameters: {
        'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
        'pageSize' ? : number,
        'pageNumber' ? : number,
        'sortBy' ? : "sampleListId" | "category" | "studyId" | "name" | "description",
        'direction' ? : "ASC" | "DESC",
        $queryParameters ? : any,
            $domain ? : string
    }): Promise < request.Response > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        const errorHandlers = this.errorHandlers;
        const request = this.request;
        let path = '/api/sample-lists';
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
     * Get all sample lists
     * @method
     * @name CBioPortalAPI#getAllSampleListsUsingGET
     * @param {string} projection - Level of detail of the response
     * @param {integer} pageSize - Page size of the result list
     * @param {integer} pageNumber - Page number of the result list
     * @param {string} sortBy - Name of the property that the result list is sorted by
     * @param {string} direction - Direction of the sort
     */
    getAllSampleListsUsingGET(parameters: {
            'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
            'pageSize' ? : number,
            'pageNumber' ? : number,
            'sortBy' ? : "sampleListId" | "category" | "studyId" | "name" | "description",
            'direction' ? : "ASC" | "DESC",
            $queryParameters ? : any,
                $domain ? : string
        }): Promise < Array < SampleList >
        > {
            return this.getAllSampleListsUsingGETWithHttpInfo(parameters).then(function(response: request.Response) {
                return response.body;
            });
        };
    fetchSampleListsUsingPOSTURL(parameters: {
        'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
        'sampleListIds': Array < string > ,
            $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/api/sample-lists/fetch';
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
     * Fetch sample lists by ID
     * @method
     * @name CBioPortalAPI#fetchSampleListsUsingPOST
     * @param {string} projection - Level of detail of the response
     * @param {} sampleListIds - A web service for supplying JSON formatted data to cBioPortal clients. Please note that this API is currently in beta and subject to change.
     */
    fetchSampleListsUsingPOSTWithHttpInfo(parameters: {
        'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
        'sampleListIds': Array < string > ,
            $queryParameters ? : any,
            $domain ? : string
    }): Promise < request.Response > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        const errorHandlers = this.errorHandlers;
        const request = this.request;
        let path = '/api/sample-lists/fetch';
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

            if (parameters['sampleListIds'] !== undefined) {
                body = parameters['sampleListIds'];
            }

            if (parameters['sampleListIds'] === undefined) {
                reject(new Error('Missing required  parameter: sampleListIds'));
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
     * Fetch sample lists by ID
     * @method
     * @name CBioPortalAPI#fetchSampleListsUsingPOST
     * @param {string} projection - Level of detail of the response
     * @param {} sampleListIds - A web service for supplying JSON formatted data to cBioPortal clients. Please note that this API is currently in beta and subject to change.
     */
    fetchSampleListsUsingPOST(parameters: {
            'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
            'sampleListIds': Array < string > ,
                $queryParameters ? : any,
                $domain ? : string
        }): Promise < Array < SampleList >
        > {
            return this.fetchSampleListsUsingPOSTWithHttpInfo(parameters).then(function(response: request.Response) {
                return response.body;
            });
        };
    getSampleListUsingGETURL(parameters: {
        'sampleListId': string,
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/api/sample-lists/{sampleListId}';

        path = path.replace('{sampleListId}', parameters['sampleListId'] + '');

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
     * Get sample list
     * @method
     * @name CBioPortalAPI#getSampleListUsingGET
     * @param {string} sampleListId - Sample List ID e.g. acc_tcga_all
     */
    getSampleListUsingGETWithHttpInfo(parameters: {
        'sampleListId': string,
        $queryParameters ? : any,
        $domain ? : string
    }): Promise < request.Response > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        const errorHandlers = this.errorHandlers;
        const request = this.request;
        let path = '/api/sample-lists/{sampleListId}';
        let body: any;
        let queryParameters: any = {};
        let headers: any = {};
        let form: any = {};
        return new Promise(function(resolve, reject) {
            headers['Accept'] = 'application/json';

            path = path.replace('{sampleListId}', parameters['sampleListId'] + '');

            if (parameters['sampleListId'] === undefined) {
                reject(new Error('Missing required  parameter: sampleListId'));
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
     * Get sample list
     * @method
     * @name CBioPortalAPI#getSampleListUsingGET
     * @param {string} sampleListId - Sample List ID e.g. acc_tcga_all
     */
    getSampleListUsingGET(parameters: {
        'sampleListId': string,
        $queryParameters ? : any,
        $domain ? : string
    }): Promise < SampleList > {
        return this.getSampleListUsingGETWithHttpInfo(parameters).then(function(response: request.Response) {
            return response.body;
        });
    };
    getAllSampleIdsInSampleListUsingGETURL(parameters: {
        'sampleListId': string,
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/api/sample-lists/{sampleListId}/sample-ids';

        path = path.replace('{sampleListId}', parameters['sampleListId'] + '');

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
     * Get all sample IDs in a sample list
     * @method
     * @name CBioPortalAPI#getAllSampleIdsInSampleListUsingGET
     * @param {string} sampleListId - Sample List ID e.g. acc_tcga_all
     */
    getAllSampleIdsInSampleListUsingGETWithHttpInfo(parameters: {
        'sampleListId': string,
        $queryParameters ? : any,
        $domain ? : string
    }): Promise < request.Response > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        const errorHandlers = this.errorHandlers;
        const request = this.request;
        let path = '/api/sample-lists/{sampleListId}/sample-ids';
        let body: any;
        let queryParameters: any = {};
        let headers: any = {};
        let form: any = {};
        return new Promise(function(resolve, reject) {
            headers['Accept'] = 'application/json';

            path = path.replace('{sampleListId}', parameters['sampleListId'] + '');

            if (parameters['sampleListId'] === undefined) {
                reject(new Error('Missing required  parameter: sampleListId'));
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
     * Get all sample IDs in a sample list
     * @method
     * @name CBioPortalAPI#getAllSampleIdsInSampleListUsingGET
     * @param {string} sampleListId - Sample List ID e.g. acc_tcga_all
     */
    getAllSampleIdsInSampleListUsingGET(parameters: {
            'sampleListId': string,
            $queryParameters ? : any,
            $domain ? : string
        }): Promise < Array < string >
        > {
            return this.getAllSampleIdsInSampleListUsingGETWithHttpInfo(parameters).then(function(response: request.Response) {
                return response.body;
            });
        };
    getSamplesByKeywordUsingGETURL(parameters: {
        'keyword' ? : string,
        'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
        'pageSize' ? : number,
        'pageNumber' ? : number,
        'sortBy' ? : "sampleId" | "sampleType",
        'direction' ? : "ASC" | "DESC",
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/api/samples';
        if (parameters['keyword'] !== undefined) {
            queryParameters['keyword'] = parameters['keyword'];
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
     * Get all samples matching keyword
     * @method
     * @name CBioPortalAPI#getSamplesByKeywordUsingGET
     * @param {string} keyword - Search keyword that applies to the study ID
     * @param {string} projection - Level of detail of the response
     * @param {integer} pageSize - Page size of the result list
     * @param {integer} pageNumber - Page number of the result list
     * @param {string} sortBy - Name of the property that the result list is sorted by
     * @param {string} direction - Direction of the sort
     */
    getSamplesByKeywordUsingGETWithHttpInfo(parameters: {
        'keyword' ? : string,
        'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
        'pageSize' ? : number,
        'pageNumber' ? : number,
        'sortBy' ? : "sampleId" | "sampleType",
        'direction' ? : "ASC" | "DESC",
        $queryParameters ? : any,
            $domain ? : string
    }): Promise < request.Response > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        const errorHandlers = this.errorHandlers;
        const request = this.request;
        let path = '/api/samples';
        let body: any;
        let queryParameters: any = {};
        let headers: any = {};
        let form: any = {};
        return new Promise(function(resolve, reject) {
            headers['Accept'] = 'application/json';

            if (parameters['keyword'] !== undefined) {
                queryParameters['keyword'] = parameters['keyword'];
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
     * Get all samples matching keyword
     * @method
     * @name CBioPortalAPI#getSamplesByKeywordUsingGET
     * @param {string} keyword - Search keyword that applies to the study ID
     * @param {string} projection - Level of detail of the response
     * @param {integer} pageSize - Page size of the result list
     * @param {integer} pageNumber - Page number of the result list
     * @param {string} sortBy - Name of the property that the result list is sorted by
     * @param {string} direction - Direction of the sort
     */
    getSamplesByKeywordUsingGET(parameters: {
            'keyword' ? : string,
            'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
            'pageSize' ? : number,
            'pageNumber' ? : number,
            'sortBy' ? : "sampleId" | "sampleType",
            'direction' ? : "ASC" | "DESC",
            $queryParameters ? : any,
                $domain ? : string
        }): Promise < Array < Sample >
        > {
            return this.getSamplesByKeywordUsingGETWithHttpInfo(parameters).then(function(response: request.Response) {
                return response.body;
            });
        };
    fetchSamplesUsingPOSTURL(parameters: {
        'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
        'sampleFilter' ? : SampleFilter,
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/api/samples/fetch';
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
     * Fetch samples by ID
     * @method
     * @name CBioPortalAPI#fetchSamplesUsingPOST
     * @param {string} projection - Level of detail of the response
     * @param {} sampleFilter - A web service for supplying JSON formatted data to cBioPortal clients. Please note that this API is currently in beta and subject to change.
     */
    fetchSamplesUsingPOSTWithHttpInfo(parameters: {
        'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
        'sampleFilter' ? : SampleFilter,
        $queryParameters ? : any,
            $domain ? : string
    }): Promise < request.Response > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        const errorHandlers = this.errorHandlers;
        const request = this.request;
        let path = '/api/samples/fetch';
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

            if (parameters['sampleFilter'] !== undefined) {
                body = parameters['sampleFilter'];
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
     * Fetch samples by ID
     * @method
     * @name CBioPortalAPI#fetchSamplesUsingPOST
     * @param {string} projection - Level of detail of the response
     * @param {} sampleFilter - A web service for supplying JSON formatted data to cBioPortal clients. Please note that this API is currently in beta and subject to change.
     */
    fetchSamplesUsingPOST(parameters: {
            'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
            'sampleFilter' ? : SampleFilter,
            $queryParameters ? : any,
                $domain ? : string
        }): Promise < Array < Sample >
        > {
            return this.fetchSamplesUsingPOSTWithHttpInfo(parameters).then(function(response: request.Response) {
                return response.body;
            });
        };
    getAllStudiesUsingGETURL(parameters: {
        'keyword' ? : string,
        'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
        'pageSize' ? : number,
        'pageNumber' ? : number,
        'sortBy' ? : "studyId" | "cancerTypeId" | "name" | "description" | "publicStudy" | "pmid" | "citation" | "groups" | "status" | "importDate",
        'direction' ? : "ASC" | "DESC",
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/api/studies';
        if (parameters['keyword'] !== undefined) {
            queryParameters['keyword'] = parameters['keyword'];
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
     * Get all studies
     * @method
     * @name CBioPortalAPI#getAllStudiesUsingGET
     * @param {string} keyword - Search keyword that applies to name and cancer type of the studies
     * @param {string} projection - Level of detail of the response
     * @param {integer} pageSize - Page size of the result list
     * @param {integer} pageNumber - Page number of the result list
     * @param {string} sortBy - Name of the property that the result list is sorted by
     * @param {string} direction - Direction of the sort
     */
    getAllStudiesUsingGETWithHttpInfo(parameters: {
        'keyword' ? : string,
        'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
        'pageSize' ? : number,
        'pageNumber' ? : number,
        'sortBy' ? : "studyId" | "cancerTypeId" | "name" | "description" | "publicStudy" | "pmid" | "citation" | "groups" | "status" | "importDate",
        'direction' ? : "ASC" | "DESC",
        $queryParameters ? : any,
            $domain ? : string
    }): Promise < request.Response > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        const errorHandlers = this.errorHandlers;
        const request = this.request;
        let path = '/api/studies';
        let body: any;
        let queryParameters: any = {};
        let headers: any = {};
        let form: any = {};
        return new Promise(function(resolve, reject) {
            headers['Accept'] = 'application/json';

            if (parameters['keyword'] !== undefined) {
                queryParameters['keyword'] = parameters['keyword'];
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
     * Get all studies
     * @method
     * @name CBioPortalAPI#getAllStudiesUsingGET
     * @param {string} keyword - Search keyword that applies to name and cancer type of the studies
     * @param {string} projection - Level of detail of the response
     * @param {integer} pageSize - Page size of the result list
     * @param {integer} pageNumber - Page number of the result list
     * @param {string} sortBy - Name of the property that the result list is sorted by
     * @param {string} direction - Direction of the sort
     */
    getAllStudiesUsingGET(parameters: {
            'keyword' ? : string,
            'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
            'pageSize' ? : number,
            'pageNumber' ? : number,
            'sortBy' ? : "studyId" | "cancerTypeId" | "name" | "description" | "publicStudy" | "pmid" | "citation" | "groups" | "status" | "importDate",
            'direction' ? : "ASC" | "DESC",
            $queryParameters ? : any,
                $domain ? : string
        }): Promise < Array < CancerStudy >
        > {
            return this.getAllStudiesUsingGETWithHttpInfo(parameters).then(function(response: request.Response) {
                return response.body;
            });
        };
    fetchStudiesUsingPOSTURL(parameters: {
        'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
        'studyIds': Array < string > ,
            $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/api/studies/fetch';
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
     * Fetch studies by IDs
     * @method
     * @name CBioPortalAPI#fetchStudiesUsingPOST
     * @param {string} projection - Level of detail of the response
     * @param {} studyIds - A web service for supplying JSON formatted data to cBioPortal clients. Please note that this API is currently in beta and subject to change.
     */
    fetchStudiesUsingPOSTWithHttpInfo(parameters: {
        'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
        'studyIds': Array < string > ,
            $queryParameters ? : any,
            $domain ? : string
    }): Promise < request.Response > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        const errorHandlers = this.errorHandlers;
        const request = this.request;
        let path = '/api/studies/fetch';
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
     * Fetch studies by IDs
     * @method
     * @name CBioPortalAPI#fetchStudiesUsingPOST
     * @param {string} projection - Level of detail of the response
     * @param {} studyIds - A web service for supplying JSON formatted data to cBioPortal clients. Please note that this API is currently in beta and subject to change.
     */
    fetchStudiesUsingPOST(parameters: {
            'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
            'studyIds': Array < string > ,
                $queryParameters ? : any,
                $domain ? : string
        }): Promise < Array < CancerStudy >
        > {
            return this.fetchStudiesUsingPOSTWithHttpInfo(parameters).then(function(response: request.Response) {
                return response.body;
            });
        };
    getTagsForMultipleStudiesUsingPOSTURL(parameters: {
        'studyIds': Array < string > ,
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/api/studies/tags/fetch';

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
     * Get the study tags by IDs
     * @method
     * @name CBioPortalAPI#getTagsForMultipleStudiesUsingPOST
     * @param {} studyIds - A web service for supplying JSON formatted data to cBioPortal clients. Please note that this API is currently in beta and subject to change.
     */
    getTagsForMultipleStudiesUsingPOSTWithHttpInfo(parameters: {
        'studyIds': Array < string > ,
        $queryParameters ? : any,
        $domain ? : string
    }): Promise < request.Response > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        const errorHandlers = this.errorHandlers;
        const request = this.request;
        let path = '/api/studies/tags/fetch';
        let body: any;
        let queryParameters: any = {};
        let headers: any = {};
        let form: any = {};
        return new Promise(function(resolve, reject) {
            headers['Accept'] = 'application/json';
            headers['Content-Type'] = 'application/json';

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
     * Get the study tags by IDs
     * @method
     * @name CBioPortalAPI#getTagsForMultipleStudiesUsingPOST
     * @param {} studyIds - A web service for supplying JSON formatted data to cBioPortal clients. Please note that this API is currently in beta and subject to change.
     */
    getTagsForMultipleStudiesUsingPOST(parameters: {
            'studyIds': Array < string > ,
            $queryParameters ? : any,
            $domain ? : string
        }): Promise < Array < CancerStudyTags >
        > {
            return this.getTagsForMultipleStudiesUsingPOSTWithHttpInfo(parameters).then(function(response: request.Response) {
                return response.body;
            });
        };
    getStudyUsingGETURL(parameters: {
        'studyId': string,
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/api/studies/{studyId}';

        path = path.replace('{studyId}', parameters['studyId'] + '');

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
     * Get a study
     * @method
     * @name CBioPortalAPI#getStudyUsingGET
     * @param {string} studyId - Study ID e.g. acc_tcga
     */
    getStudyUsingGETWithHttpInfo(parameters: {
        'studyId': string,
        $queryParameters ? : any,
        $domain ? : string
    }): Promise < request.Response > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        const errorHandlers = this.errorHandlers;
        const request = this.request;
        let path = '/api/studies/{studyId}';
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
     * Get a study
     * @method
     * @name CBioPortalAPI#getStudyUsingGET
     * @param {string} studyId - Study ID e.g. acc_tcga
     */
    getStudyUsingGET(parameters: {
        'studyId': string,
        $queryParameters ? : any,
        $domain ? : string
    }): Promise < CancerStudy > {
        return this.getStudyUsingGETWithHttpInfo(parameters).then(function(response: request.Response) {
            return response.body;
        });
    };
    getAllClinicalAttributesInStudyUsingGETURL(parameters: {
        'studyId': string,
        'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
        'pageSize' ? : number,
        'pageNumber' ? : number,
        'sortBy' ? : "clinicalAttributeId" | "displayName" | "description" | "datatype" | "patientAttribute" | "priority" | "studyId",
        'direction' ? : "ASC" | "DESC",
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/api/studies/{studyId}/clinical-attributes';

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
     * Get all clinical attributes in the specified study
     * @method
     * @name CBioPortalAPI#getAllClinicalAttributesInStudyUsingGET
     * @param {string} studyId - Study ID e.g. acc_tcga
     * @param {string} projection - Level of detail of the response
     * @param {integer} pageSize - Page size of the result list
     * @param {integer} pageNumber - Page number of the result list
     * @param {string} sortBy - Name of the property that the result list is sorted by
     * @param {string} direction - Direction of the sort
     */
    getAllClinicalAttributesInStudyUsingGETWithHttpInfo(parameters: {
        'studyId': string,
        'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
        'pageSize' ? : number,
        'pageNumber' ? : number,
        'sortBy' ? : "clinicalAttributeId" | "displayName" | "description" | "datatype" | "patientAttribute" | "priority" | "studyId",
        'direction' ? : "ASC" | "DESC",
        $queryParameters ? : any,
        $domain ? : string
    }): Promise < request.Response > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        const errorHandlers = this.errorHandlers;
        const request = this.request;
        let path = '/api/studies/{studyId}/clinical-attributes';
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
     * Get all clinical attributes in the specified study
     * @method
     * @name CBioPortalAPI#getAllClinicalAttributesInStudyUsingGET
     * @param {string} studyId - Study ID e.g. acc_tcga
     * @param {string} projection - Level of detail of the response
     * @param {integer} pageSize - Page size of the result list
     * @param {integer} pageNumber - Page number of the result list
     * @param {string} sortBy - Name of the property that the result list is sorted by
     * @param {string} direction - Direction of the sort
     */
    getAllClinicalAttributesInStudyUsingGET(parameters: {
            'studyId': string,
            'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
            'pageSize' ? : number,
            'pageNumber' ? : number,
            'sortBy' ? : "clinicalAttributeId" | "displayName" | "description" | "datatype" | "patientAttribute" | "priority" | "studyId",
            'direction' ? : "ASC" | "DESC",
            $queryParameters ? : any,
            $domain ? : string
        }): Promise < Array < ClinicalAttribute >
        > {
            return this.getAllClinicalAttributesInStudyUsingGETWithHttpInfo(parameters).then(function(response: request.Response) {
                return response.body;
            });
        };
    getClinicalAttributeInStudyUsingGETURL(parameters: {
        'studyId': string,
        'clinicalAttributeId': string,
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/api/studies/{studyId}/clinical-attributes/{clinicalAttributeId}';

        path = path.replace('{studyId}', parameters['studyId'] + '');

        path = path.replace('{clinicalAttributeId}', parameters['clinicalAttributeId'] + '');

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
     * Get specified clinical attribute
     * @method
     * @name CBioPortalAPI#getClinicalAttributeInStudyUsingGET
     * @param {string} studyId - Study ID e.g. acc_tcga
     * @param {string} clinicalAttributeId - Clinical Attribute ID e.g. CANCER_TYPE
     */
    getClinicalAttributeInStudyUsingGETWithHttpInfo(parameters: {
        'studyId': string,
        'clinicalAttributeId': string,
        $queryParameters ? : any,
        $domain ? : string
    }): Promise < request.Response > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        const errorHandlers = this.errorHandlers;
        const request = this.request;
        let path = '/api/studies/{studyId}/clinical-attributes/{clinicalAttributeId}';
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

            path = path.replace('{clinicalAttributeId}', parameters['clinicalAttributeId'] + '');

            if (parameters['clinicalAttributeId'] === undefined) {
                reject(new Error('Missing required  parameter: clinicalAttributeId'));
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
     * Get specified clinical attribute
     * @method
     * @name CBioPortalAPI#getClinicalAttributeInStudyUsingGET
     * @param {string} studyId - Study ID e.g. acc_tcga
     * @param {string} clinicalAttributeId - Clinical Attribute ID e.g. CANCER_TYPE
     */
    getClinicalAttributeInStudyUsingGET(parameters: {
        'studyId': string,
        'clinicalAttributeId': string,
        $queryParameters ? : any,
        $domain ? : string
    }): Promise < ClinicalAttribute > {
        return this.getClinicalAttributeInStudyUsingGETWithHttpInfo(parameters).then(function(response: request.Response) {
            return response.body;
        });
    };
    getAllClinicalDataInStudyUsingGETURL(parameters: {
        'studyId': string,
        'attributeId' ? : string,
        'clinicalDataType' ? : "SAMPLE" | "PATIENT",
        'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
        'pageSize' ? : number,
        'pageNumber' ? : number,
        'sortBy' ? : "clinicalAttributeId" | "value",
        'direction' ? : "ASC" | "DESC",
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/api/studies/{studyId}/clinical-data';

        path = path.replace('{studyId}', parameters['studyId'] + '');
        if (parameters['attributeId'] !== undefined) {
            queryParameters['attributeId'] = parameters['attributeId'];
        }

        if (parameters['clinicalDataType'] !== undefined) {
            queryParameters['clinicalDataType'] = parameters['clinicalDataType'];
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
     * Get all clinical data in a study
     * @method
     * @name CBioPortalAPI#getAllClinicalDataInStudyUsingGET
     * @param {string} studyId - Study ID e.g. acc_tcga
     * @param {string} attributeId - Attribute ID e.g. CANCER_TYPE
     * @param {string} clinicalDataType - Type of the clinical data
     * @param {string} projection - Level of detail of the response
     * @param {integer} pageSize - Page size of the result list
     * @param {integer} pageNumber - Page number of the result list
     * @param {string} sortBy - Name of the property that the result list is sorted by
     * @param {string} direction - Direction of the sort
     */
    getAllClinicalDataInStudyUsingGETWithHttpInfo(parameters: {
        'studyId': string,
        'attributeId' ? : string,
        'clinicalDataType' ? : "SAMPLE" | "PATIENT",
        'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
        'pageSize' ? : number,
        'pageNumber' ? : number,
        'sortBy' ? : "clinicalAttributeId" | "value",
        'direction' ? : "ASC" | "DESC",
        $queryParameters ? : any,
        $domain ? : string
    }): Promise < request.Response > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        const errorHandlers = this.errorHandlers;
        const request = this.request;
        let path = '/api/studies/{studyId}/clinical-data';
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

            if (parameters['attributeId'] !== undefined) {
                queryParameters['attributeId'] = parameters['attributeId'];
            }

            if (parameters['clinicalDataType'] !== undefined) {
                queryParameters['clinicalDataType'] = parameters['clinicalDataType'];
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
     * Get all clinical data in a study
     * @method
     * @name CBioPortalAPI#getAllClinicalDataInStudyUsingGET
     * @param {string} studyId - Study ID e.g. acc_tcga
     * @param {string} attributeId - Attribute ID e.g. CANCER_TYPE
     * @param {string} clinicalDataType - Type of the clinical data
     * @param {string} projection - Level of detail of the response
     * @param {integer} pageSize - Page size of the result list
     * @param {integer} pageNumber - Page number of the result list
     * @param {string} sortBy - Name of the property that the result list is sorted by
     * @param {string} direction - Direction of the sort
     */
    getAllClinicalDataInStudyUsingGET(parameters: {
            'studyId': string,
            'attributeId' ? : string,
            'clinicalDataType' ? : "SAMPLE" | "PATIENT",
            'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
            'pageSize' ? : number,
            'pageNumber' ? : number,
            'sortBy' ? : "clinicalAttributeId" | "value",
            'direction' ? : "ASC" | "DESC",
            $queryParameters ? : any,
            $domain ? : string
        }): Promise < Array < ClinicalData >
        > {
            return this.getAllClinicalDataInStudyUsingGETWithHttpInfo(parameters).then(function(response: request.Response) {
                return response.body;
            });
        };
    fetchAllClinicalDataInStudyUsingPOSTURL(parameters: {
        'studyId': string,
        'clinicalDataType' ? : "SAMPLE" | "PATIENT",
        'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
        'clinicalDataSingleStudyFilter': ClinicalDataSingleStudyFilter,
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/api/studies/{studyId}/clinical-data/fetch';

        path = path.replace('{studyId}', parameters['studyId'] + '');
        if (parameters['clinicalDataType'] !== undefined) {
            queryParameters['clinicalDataType'] = parameters['clinicalDataType'];
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
     * Fetch clinical data by patient IDs or sample IDs (specific study)
     * @method
     * @name CBioPortalAPI#fetchAllClinicalDataInStudyUsingPOST
     * @param {string} studyId - Study ID e.g. acc_tcga
     * @param {string} clinicalDataType - Type of the clinical data
     * @param {string} projection - Level of detail of the response
     * @param {} clinicalDataSingleStudyFilter - A web service for supplying JSON formatted data to cBioPortal clients. Please note that this API is currently in beta and subject to change.
     */
    fetchAllClinicalDataInStudyUsingPOSTWithHttpInfo(parameters: {
        'studyId': string,
        'clinicalDataType' ? : "SAMPLE" | "PATIENT",
        'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
        'clinicalDataSingleStudyFilter': ClinicalDataSingleStudyFilter,
        $queryParameters ? : any,
        $domain ? : string
    }): Promise < request.Response > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        const errorHandlers = this.errorHandlers;
        const request = this.request;
        let path = '/api/studies/{studyId}/clinical-data/fetch';
        let body: any;
        let queryParameters: any = {};
        let headers: any = {};
        let form: any = {};
        return new Promise(function(resolve, reject) {
            headers['Accept'] = 'application/json';
            headers['Content-Type'] = 'application/json';

            path = path.replace('{studyId}', parameters['studyId'] + '');

            if (parameters['studyId'] === undefined) {
                reject(new Error('Missing required  parameter: studyId'));
                return;
            }

            if (parameters['clinicalDataType'] !== undefined) {
                queryParameters['clinicalDataType'] = parameters['clinicalDataType'];
            }

            if (parameters['projection'] !== undefined) {
                queryParameters['projection'] = parameters['projection'];
            }

            if (parameters['clinicalDataSingleStudyFilter'] !== undefined) {
                body = parameters['clinicalDataSingleStudyFilter'];
            }

            if (parameters['clinicalDataSingleStudyFilter'] === undefined) {
                reject(new Error('Missing required  parameter: clinicalDataSingleStudyFilter'));
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
     * Fetch clinical data by patient IDs or sample IDs (specific study)
     * @method
     * @name CBioPortalAPI#fetchAllClinicalDataInStudyUsingPOST
     * @param {string} studyId - Study ID e.g. acc_tcga
     * @param {string} clinicalDataType - Type of the clinical data
     * @param {string} projection - Level of detail of the response
     * @param {} clinicalDataSingleStudyFilter - A web service for supplying JSON formatted data to cBioPortal clients. Please note that this API is currently in beta and subject to change.
     */
    fetchAllClinicalDataInStudyUsingPOST(parameters: {
            'studyId': string,
            'clinicalDataType' ? : "SAMPLE" | "PATIENT",
            'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
            'clinicalDataSingleStudyFilter': ClinicalDataSingleStudyFilter,
            $queryParameters ? : any,
            $domain ? : string
        }): Promise < Array < ClinicalData >
        > {
            return this.fetchAllClinicalDataInStudyUsingPOSTWithHttpInfo(parameters).then(function(response: request.Response) {
                return response.body;
            });
        };
    getAllMolecularProfilesInStudyUsingGETURL(parameters: {
        'studyId': string,
        'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
        'pageSize' ? : number,
        'pageNumber' ? : number,
        'sortBy' ? : "molecularProfileId" | "molecularAlterationType" | "datatype" | "name" | "description" | "showProfileInAnalysisTab",
        'direction' ? : "ASC" | "DESC",
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/api/studies/{studyId}/molecular-profiles';

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
     * Get all molecular profiles in a study
     * @method
     * @name CBioPortalAPI#getAllMolecularProfilesInStudyUsingGET
     * @param {string} studyId - Study ID e.g. acc_tcga
     * @param {string} projection - Level of detail of the response
     * @param {integer} pageSize - Page size of the result list
     * @param {integer} pageNumber - Page number of the result list
     * @param {string} sortBy - Name of the property that the result list is sorted by
     * @param {string} direction - Direction of the sort
     */
    getAllMolecularProfilesInStudyUsingGETWithHttpInfo(parameters: {
        'studyId': string,
        'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
        'pageSize' ? : number,
        'pageNumber' ? : number,
        'sortBy' ? : "molecularProfileId" | "molecularAlterationType" | "datatype" | "name" | "description" | "showProfileInAnalysisTab",
        'direction' ? : "ASC" | "DESC",
        $queryParameters ? : any,
        $domain ? : string
    }): Promise < request.Response > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        const errorHandlers = this.errorHandlers;
        const request = this.request;
        let path = '/api/studies/{studyId}/molecular-profiles';
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
     * Get all molecular profiles in a study
     * @method
     * @name CBioPortalAPI#getAllMolecularProfilesInStudyUsingGET
     * @param {string} studyId - Study ID e.g. acc_tcga
     * @param {string} projection - Level of detail of the response
     * @param {integer} pageSize - Page size of the result list
     * @param {integer} pageNumber - Page number of the result list
     * @param {string} sortBy - Name of the property that the result list is sorted by
     * @param {string} direction - Direction of the sort
     */
    getAllMolecularProfilesInStudyUsingGET(parameters: {
            'studyId': string,
            'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
            'pageSize' ? : number,
            'pageNumber' ? : number,
            'sortBy' ? : "molecularProfileId" | "molecularAlterationType" | "datatype" | "name" | "description" | "showProfileInAnalysisTab",
            'direction' ? : "ASC" | "DESC",
            $queryParameters ? : any,
            $domain ? : string
        }): Promise < Array < MolecularProfile >
        > {
            return this.getAllMolecularProfilesInStudyUsingGETWithHttpInfo(parameters).then(function(response: request.Response) {
                return response.body;
            });
        };
    getAllPatientsInStudyUsingGETURL(parameters: {
        'studyId': string,
        'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
        'pageSize' ? : number,
        'pageNumber' ? : number,
        'direction' ? : "ASC" | "DESC",
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/api/studies/{studyId}/patients';

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

        queryParameters['sortBy'] = 'patientId';

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
    * Get all patients in a study
    * @method
    * @name CBioPortalAPI#getAllPatientsInStudyUsingGET
         * @param {string} studyId - Study ID e.g. acc_tcga
         * @param {string} projection - Level of detail of the response
         * @param {integer} pageSize - Page size of the result list
         * @param {integer} pageNumber - Page number of the result list
        
         * @param {string} direction - Direction of the sort
    */
    getAllPatientsInStudyUsingGETWithHttpInfo(parameters: {
        'studyId': string,
        'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
        'pageSize' ? : number,
        'pageNumber' ? : number,
        'direction' ? : "ASC" | "DESC",
        $queryParameters ? : any,
        $domain ? : string
    }): Promise < request.Response > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        const errorHandlers = this.errorHandlers;
        const request = this.request;
        let path = '/api/studies/{studyId}/patients';
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

            queryParameters['sortBy'] = 'patientId';

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
    * Get all patients in a study
    * @method
    * @name CBioPortalAPI#getAllPatientsInStudyUsingGET
         * @param {string} studyId - Study ID e.g. acc_tcga
         * @param {string} projection - Level of detail of the response
         * @param {integer} pageSize - Page size of the result list
         * @param {integer} pageNumber - Page number of the result list
        
         * @param {string} direction - Direction of the sort
    */
    getAllPatientsInStudyUsingGET(parameters: {
            'studyId': string,
            'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
            'pageSize' ? : number,
            'pageNumber' ? : number,
            'direction' ? : "ASC" | "DESC",
            $queryParameters ? : any,
            $domain ? : string
        }): Promise < Array < Patient >
        > {
            return this.getAllPatientsInStudyUsingGETWithHttpInfo(parameters).then(function(response: request.Response) {
                return response.body;
            });
        };
    getPatientInStudyUsingGETURL(parameters: {
        'studyId': string,
        'patientId': string,
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/api/studies/{studyId}/patients/{patientId}';

        path = path.replace('{studyId}', parameters['studyId'] + '');

        path = path.replace('{patientId}', parameters['patientId'] + '');

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
     * Get a patient in a study
     * @method
     * @name CBioPortalAPI#getPatientInStudyUsingGET
     * @param {string} studyId - Study ID e.g. acc_tcga
     * @param {string} patientId - Patient ID e.g. TCGA-OR-A5J2
     */
    getPatientInStudyUsingGETWithHttpInfo(parameters: {
        'studyId': string,
        'patientId': string,
        $queryParameters ? : any,
        $domain ? : string
    }): Promise < request.Response > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        const errorHandlers = this.errorHandlers;
        const request = this.request;
        let path = '/api/studies/{studyId}/patients/{patientId}';
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
     * Get a patient in a study
     * @method
     * @name CBioPortalAPI#getPatientInStudyUsingGET
     * @param {string} studyId - Study ID e.g. acc_tcga
     * @param {string} patientId - Patient ID e.g. TCGA-OR-A5J2
     */
    getPatientInStudyUsingGET(parameters: {
        'studyId': string,
        'patientId': string,
        $queryParameters ? : any,
        $domain ? : string
    }): Promise < Patient > {
        return this.getPatientInStudyUsingGETWithHttpInfo(parameters).then(function(response: request.Response) {
            return response.body;
        });
    };
    getAllClinicalDataOfPatientInStudyUsingGETURL(parameters: {
        'studyId': string,
        'patientId': string,
        'attributeId' ? : string,
        'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
        'pageSize' ? : number,
        'pageNumber' ? : number,
        'sortBy' ? : "clinicalAttributeId" | "value",
        'direction' ? : "ASC" | "DESC",
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/api/studies/{studyId}/patients/{patientId}/clinical-data';

        path = path.replace('{studyId}', parameters['studyId'] + '');

        path = path.replace('{patientId}', parameters['patientId'] + '');
        if (parameters['attributeId'] !== undefined) {
            queryParameters['attributeId'] = parameters['attributeId'];
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
     * Get all clinical data of a patient in a study
     * @method
     * @name CBioPortalAPI#getAllClinicalDataOfPatientInStudyUsingGET
     * @param {string} studyId - Study ID e.g. acc_tcga
     * @param {string} patientId - Patient ID e.g. TCGA-OR-A5J2
     * @param {string} attributeId - Attribute ID e.g. AGE
     * @param {string} projection - Level of detail of the response
     * @param {integer} pageSize - Page size of the result list
     * @param {integer} pageNumber - Page number of the result list
     * @param {string} sortBy - Name of the property that the result list is sorted by
     * @param {string} direction - Direction of the sort
     */
    getAllClinicalDataOfPatientInStudyUsingGETWithHttpInfo(parameters: {
        'studyId': string,
        'patientId': string,
        'attributeId' ? : string,
        'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
        'pageSize' ? : number,
        'pageNumber' ? : number,
        'sortBy' ? : "clinicalAttributeId" | "value",
        'direction' ? : "ASC" | "DESC",
        $queryParameters ? : any,
        $domain ? : string
    }): Promise < request.Response > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        const errorHandlers = this.errorHandlers;
        const request = this.request;
        let path = '/api/studies/{studyId}/patients/{patientId}/clinical-data';
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

            if (parameters['attributeId'] !== undefined) {
                queryParameters['attributeId'] = parameters['attributeId'];
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
     * Get all clinical data of a patient in a study
     * @method
     * @name CBioPortalAPI#getAllClinicalDataOfPatientInStudyUsingGET
     * @param {string} studyId - Study ID e.g. acc_tcga
     * @param {string} patientId - Patient ID e.g. TCGA-OR-A5J2
     * @param {string} attributeId - Attribute ID e.g. AGE
     * @param {string} projection - Level of detail of the response
     * @param {integer} pageSize - Page size of the result list
     * @param {integer} pageNumber - Page number of the result list
     * @param {string} sortBy - Name of the property that the result list is sorted by
     * @param {string} direction - Direction of the sort
     */
    getAllClinicalDataOfPatientInStudyUsingGET(parameters: {
            'studyId': string,
            'patientId': string,
            'attributeId' ? : string,
            'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
            'pageSize' ? : number,
            'pageNumber' ? : number,
            'sortBy' ? : "clinicalAttributeId" | "value",
            'direction' ? : "ASC" | "DESC",
            $queryParameters ? : any,
            $domain ? : string
        }): Promise < Array < ClinicalData >
        > {
            return this.getAllClinicalDataOfPatientInStudyUsingGETWithHttpInfo(parameters).then(function(response: request.Response) {
                return response.body;
            });
        };
    getAllSamplesOfPatientInStudyUsingGETURL(parameters: {
        'studyId': string,
        'patientId': string,
        'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
        'pageSize' ? : number,
        'pageNumber' ? : number,
        'sortBy' ? : "sampleId" | "sampleType",
        'direction' ? : "ASC" | "DESC",
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/api/studies/{studyId}/patients/{patientId}/samples';

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
     * Get all samples of a patient in a study
     * @method
     * @name CBioPortalAPI#getAllSamplesOfPatientInStudyUsingGET
     * @param {string} studyId - Study ID e.g. acc_tcga
     * @param {string} patientId - Patient ID e.g. TCGA-OR-A5J2
     * @param {string} projection - Level of detail of the response
     * @param {integer} pageSize - Page size of the result list
     * @param {integer} pageNumber - Page number of the result list
     * @param {string} sortBy - Name of the property that the result list is sorted by
     * @param {string} direction - Direction of the sort
     */
    getAllSamplesOfPatientInStudyUsingGETWithHttpInfo(parameters: {
        'studyId': string,
        'patientId': string,
        'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
        'pageSize' ? : number,
        'pageNumber' ? : number,
        'sortBy' ? : "sampleId" | "sampleType",
        'direction' ? : "ASC" | "DESC",
        $queryParameters ? : any,
        $domain ? : string
    }): Promise < request.Response > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        const errorHandlers = this.errorHandlers;
        const request = this.request;
        let path = '/api/studies/{studyId}/patients/{patientId}/samples';
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
     * Get all samples of a patient in a study
     * @method
     * @name CBioPortalAPI#getAllSamplesOfPatientInStudyUsingGET
     * @param {string} studyId - Study ID e.g. acc_tcga
     * @param {string} patientId - Patient ID e.g. TCGA-OR-A5J2
     * @param {string} projection - Level of detail of the response
     * @param {integer} pageSize - Page size of the result list
     * @param {integer} pageNumber - Page number of the result list
     * @param {string} sortBy - Name of the property that the result list is sorted by
     * @param {string} direction - Direction of the sort
     */
    getAllSamplesOfPatientInStudyUsingGET(parameters: {
            'studyId': string,
            'patientId': string,
            'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
            'pageSize' ? : number,
            'pageNumber' ? : number,
            'sortBy' ? : "sampleId" | "sampleType",
            'direction' ? : "ASC" | "DESC",
            $queryParameters ? : any,
            $domain ? : string
        }): Promise < Array < Sample >
        > {
            return this.getAllSamplesOfPatientInStudyUsingGETWithHttpInfo(parameters).then(function(response: request.Response) {
                return response.body;
            });
        };
    getAllSampleListsInStudyUsingGETURL(parameters: {
        'studyId': string,
        'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
        'pageSize' ? : number,
        'pageNumber' ? : number,
        'sortBy' ? : "sampleListId" | "category" | "studyId" | "name" | "description",
        'direction' ? : "ASC" | "DESC",
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/api/studies/{studyId}/sample-lists';

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
     * Get all sample lists in a study
     * @method
     * @name CBioPortalAPI#getAllSampleListsInStudyUsingGET
     * @param {string} studyId - Study ID e.g. acc_tcga
     * @param {string} projection - Level of detail of the response
     * @param {integer} pageSize - Page size of the result list
     * @param {integer} pageNumber - Page number of the result list
     * @param {string} sortBy - Name of the property that the result list is sorted by
     * @param {string} direction - Direction of the sort
     */
    getAllSampleListsInStudyUsingGETWithHttpInfo(parameters: {
        'studyId': string,
        'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
        'pageSize' ? : number,
        'pageNumber' ? : number,
        'sortBy' ? : "sampleListId" | "category" | "studyId" | "name" | "description",
        'direction' ? : "ASC" | "DESC",
        $queryParameters ? : any,
        $domain ? : string
    }): Promise < request.Response > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        const errorHandlers = this.errorHandlers;
        const request = this.request;
        let path = '/api/studies/{studyId}/sample-lists';
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
     * Get all sample lists in a study
     * @method
     * @name CBioPortalAPI#getAllSampleListsInStudyUsingGET
     * @param {string} studyId - Study ID e.g. acc_tcga
     * @param {string} projection - Level of detail of the response
     * @param {integer} pageSize - Page size of the result list
     * @param {integer} pageNumber - Page number of the result list
     * @param {string} sortBy - Name of the property that the result list is sorted by
     * @param {string} direction - Direction of the sort
     */
    getAllSampleListsInStudyUsingGET(parameters: {
            'studyId': string,
            'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
            'pageSize' ? : number,
            'pageNumber' ? : number,
            'sortBy' ? : "sampleListId" | "category" | "studyId" | "name" | "description",
            'direction' ? : "ASC" | "DESC",
            $queryParameters ? : any,
            $domain ? : string
        }): Promise < Array < SampleList >
        > {
            return this.getAllSampleListsInStudyUsingGETWithHttpInfo(parameters).then(function(response: request.Response) {
                return response.body;
            });
        };
    getAllSamplesInStudyUsingGETURL(parameters: {
        'studyId': string,
        'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
        'pageSize' ? : number,
        'pageNumber' ? : number,
        'sortBy' ? : "sampleId" | "sampleType",
        'direction' ? : "ASC" | "DESC",
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/api/studies/{studyId}/samples';

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
     * Get all samples in a study
     * @method
     * @name CBioPortalAPI#getAllSamplesInStudyUsingGET
     * @param {string} studyId - Study ID e.g. acc_tcga
     * @param {string} projection - Level of detail of the response
     * @param {integer} pageSize - Page size of the result list
     * @param {integer} pageNumber - Page number of the result list
     * @param {string} sortBy - Name of the property that the result list is sorted by
     * @param {string} direction - Direction of the sort
     */
    getAllSamplesInStudyUsingGETWithHttpInfo(parameters: {
        'studyId': string,
        'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
        'pageSize' ? : number,
        'pageNumber' ? : number,
        'sortBy' ? : "sampleId" | "sampleType",
        'direction' ? : "ASC" | "DESC",
        $queryParameters ? : any,
        $domain ? : string
    }): Promise < request.Response > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        const errorHandlers = this.errorHandlers;
        const request = this.request;
        let path = '/api/studies/{studyId}/samples';
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
     * Get all samples in a study
     * @method
     * @name CBioPortalAPI#getAllSamplesInStudyUsingGET
     * @param {string} studyId - Study ID e.g. acc_tcga
     * @param {string} projection - Level of detail of the response
     * @param {integer} pageSize - Page size of the result list
     * @param {integer} pageNumber - Page number of the result list
     * @param {string} sortBy - Name of the property that the result list is sorted by
     * @param {string} direction - Direction of the sort
     */
    getAllSamplesInStudyUsingGET(parameters: {
            'studyId': string,
            'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
            'pageSize' ? : number,
            'pageNumber' ? : number,
            'sortBy' ? : "sampleId" | "sampleType",
            'direction' ? : "ASC" | "DESC",
            $queryParameters ? : any,
            $domain ? : string
        }): Promise < Array < Sample >
        > {
            return this.getAllSamplesInStudyUsingGETWithHttpInfo(parameters).then(function(response: request.Response) {
                return response.body;
            });
        };
    getSampleInStudyUsingGETURL(parameters: {
        'studyId': string,
        'sampleId': string,
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/api/studies/{studyId}/samples/{sampleId}';

        path = path.replace('{studyId}', parameters['studyId'] + '');

        path = path.replace('{sampleId}', parameters['sampleId'] + '');

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
     * Get a sample in a study
     * @method
     * @name CBioPortalAPI#getSampleInStudyUsingGET
     * @param {string} studyId - Study ID e.g. acc_tcga
     * @param {string} sampleId - Sample ID e.g. TCGA-OR-A5J2-01
     */
    getSampleInStudyUsingGETWithHttpInfo(parameters: {
        'studyId': string,
        'sampleId': string,
        $queryParameters ? : any,
        $domain ? : string
    }): Promise < request.Response > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        const errorHandlers = this.errorHandlers;
        const request = this.request;
        let path = '/api/studies/{studyId}/samples/{sampleId}';
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
     * Get a sample in a study
     * @method
     * @name CBioPortalAPI#getSampleInStudyUsingGET
     * @param {string} studyId - Study ID e.g. acc_tcga
     * @param {string} sampleId - Sample ID e.g. TCGA-OR-A5J2-01
     */
    getSampleInStudyUsingGET(parameters: {
        'studyId': string,
        'sampleId': string,
        $queryParameters ? : any,
        $domain ? : string
    }): Promise < Sample > {
        return this.getSampleInStudyUsingGETWithHttpInfo(parameters).then(function(response: request.Response) {
            return response.body;
        });
    };
    getAllClinicalDataOfSampleInStudyUsingGETURL(parameters: {
        'studyId': string,
        'sampleId': string,
        'attributeId' ? : string,
        'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
        'pageSize' ? : number,
        'pageNumber' ? : number,
        'sortBy' ? : "clinicalAttributeId" | "value",
        'direction' ? : "ASC" | "DESC",
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/api/studies/{studyId}/samples/{sampleId}/clinical-data';

        path = path.replace('{studyId}', parameters['studyId'] + '');

        path = path.replace('{sampleId}', parameters['sampleId'] + '');
        if (parameters['attributeId'] !== undefined) {
            queryParameters['attributeId'] = parameters['attributeId'];
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
     * Get all clinical data of a sample in a study
     * @method
     * @name CBioPortalAPI#getAllClinicalDataOfSampleInStudyUsingGET
     * @param {string} studyId - Study ID e.g. acc_tcga
     * @param {string} sampleId - Sample ID e.g. TCGA-OR-A5J2-01
     * @param {string} attributeId - Attribute ID e.g. CANCER_TYPE
     * @param {string} projection - Level of detail of the response
     * @param {integer} pageSize - Page size of the result list
     * @param {integer} pageNumber - Page number of the result list
     * @param {string} sortBy - Name of the property that the result list is sorted by
     * @param {string} direction - Direction of the sort
     */
    getAllClinicalDataOfSampleInStudyUsingGETWithHttpInfo(parameters: {
        'studyId': string,
        'sampleId': string,
        'attributeId' ? : string,
        'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
        'pageSize' ? : number,
        'pageNumber' ? : number,
        'sortBy' ? : "clinicalAttributeId" | "value",
        'direction' ? : "ASC" | "DESC",
        $queryParameters ? : any,
        $domain ? : string
    }): Promise < request.Response > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        const errorHandlers = this.errorHandlers;
        const request = this.request;
        let path = '/api/studies/{studyId}/samples/{sampleId}/clinical-data';
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

            if (parameters['attributeId'] !== undefined) {
                queryParameters['attributeId'] = parameters['attributeId'];
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
     * Get all clinical data of a sample in a study
     * @method
     * @name CBioPortalAPI#getAllClinicalDataOfSampleInStudyUsingGET
     * @param {string} studyId - Study ID e.g. acc_tcga
     * @param {string} sampleId - Sample ID e.g. TCGA-OR-A5J2-01
     * @param {string} attributeId - Attribute ID e.g. CANCER_TYPE
     * @param {string} projection - Level of detail of the response
     * @param {integer} pageSize - Page size of the result list
     * @param {integer} pageNumber - Page number of the result list
     * @param {string} sortBy - Name of the property that the result list is sorted by
     * @param {string} direction - Direction of the sort
     */
    getAllClinicalDataOfSampleInStudyUsingGET(parameters: {
            'studyId': string,
            'sampleId': string,
            'attributeId' ? : string,
            'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
            'pageSize' ? : number,
            'pageNumber' ? : number,
            'sortBy' ? : "clinicalAttributeId" | "value",
            'direction' ? : "ASC" | "DESC",
            $queryParameters ? : any,
            $domain ? : string
        }): Promise < Array < ClinicalData >
        > {
            return this.getAllClinicalDataOfSampleInStudyUsingGETWithHttpInfo(parameters).then(function(response: request.Response) {
                return response.body;
            });
        };
    getCopyNumberSegmentsInSampleInStudyUsingGETURL(parameters: {
        'studyId': string,
        'sampleId': string,
        'chromosome' ? : string,
        'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
        'pageSize' ? : number,
        'pageNumber' ? : number,
        'sortBy' ? : "chromosome" | "start" | "end" | "numberOfProbes" | "segmentMean",
        'direction' ? : "ASC" | "DESC",
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/api/studies/{studyId}/samples/{sampleId}/copy-number-segments';

        path = path.replace('{studyId}', parameters['studyId'] + '');

        path = path.replace('{sampleId}', parameters['sampleId'] + '');
        if (parameters['chromosome'] !== undefined) {
            queryParameters['chromosome'] = parameters['chromosome'];
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
     * Get copy number segments in a sample in a study
     * @method
     * @name CBioPortalAPI#getCopyNumberSegmentsInSampleInStudyUsingGET
     * @param {string} studyId - Study ID e.g. acc_tcga
     * @param {string} sampleId - Sample ID e.g. TCGA-OR-A5J2-01
     * @param {string} chromosome - Chromosome
     * @param {string} projection - Level of detail of the response
     * @param {integer} pageSize - Page size of the result list
     * @param {integer} pageNumber - Page number of the result list
     * @param {string} sortBy - Name of the property that the result list is sorted by
     * @param {string} direction - Direction of the sort
     */
    getCopyNumberSegmentsInSampleInStudyUsingGETWithHttpInfo(parameters: {
        'studyId': string,
        'sampleId': string,
        'chromosome' ? : string,
        'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
        'pageSize' ? : number,
        'pageNumber' ? : number,
        'sortBy' ? : "chromosome" | "start" | "end" | "numberOfProbes" | "segmentMean",
        'direction' ? : "ASC" | "DESC",
        $queryParameters ? : any,
        $domain ? : string
    }): Promise < request.Response > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        const errorHandlers = this.errorHandlers;
        const request = this.request;
        let path = '/api/studies/{studyId}/samples/{sampleId}/copy-number-segments';
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

            if (parameters['chromosome'] !== undefined) {
                queryParameters['chromosome'] = parameters['chromosome'];
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
     * Get copy number segments in a sample in a study
     * @method
     * @name CBioPortalAPI#getCopyNumberSegmentsInSampleInStudyUsingGET
     * @param {string} studyId - Study ID e.g. acc_tcga
     * @param {string} sampleId - Sample ID e.g. TCGA-OR-A5J2-01
     * @param {string} chromosome - Chromosome
     * @param {string} projection - Level of detail of the response
     * @param {integer} pageSize - Page size of the result list
     * @param {integer} pageNumber - Page number of the result list
     * @param {string} sortBy - Name of the property that the result list is sorted by
     * @param {string} direction - Direction of the sort
     */
    getCopyNumberSegmentsInSampleInStudyUsingGET(parameters: {
            'studyId': string,
            'sampleId': string,
            'chromosome' ? : string,
            'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
            'pageSize' ? : number,
            'pageNumber' ? : number,
            'sortBy' ? : "chromosome" | "start" | "end" | "numberOfProbes" | "segmentMean",
            'direction' ? : "ASC" | "DESC",
            $queryParameters ? : any,
            $domain ? : string
        }): Promise < Array < CopyNumberSeg >
        > {
            return this.getCopyNumberSegmentsInSampleInStudyUsingGETWithHttpInfo(parameters).then(function(response: request.Response) {
                return response.body;
            });
        };
    getTagsUsingGETURL(parameters: {
        'studyId': string,
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/api/studies/{studyId}/tags';

        path = path.replace('{studyId}', parameters['studyId'] + '');

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
     * Get the tags of a study
     * @method
     * @name CBioPortalAPI#getTagsUsingGET
     * @param {string} studyId - Study ID e.g. acc_tcga
     */
    getTagsUsingGETWithHttpInfo(parameters: {
        'studyId': string,
        $queryParameters ? : any,
        $domain ? : string
    }): Promise < request.Response > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        const errorHandlers = this.errorHandlers;
        const request = this.request;
        let path = '/api/studies/{studyId}/tags';
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
     * Get the tags of a study
     * @method
     * @name CBioPortalAPI#getTagsUsingGET
     * @param {string} studyId - Study ID e.g. acc_tcga
     */
    getTagsUsingGET(parameters: {
        'studyId': string,
        $queryParameters ? : any,
        $domain ? : string
    }): Promise < {} > {
        return this.getTagsUsingGETWithHttpInfo(parameters).then(function(response: request.Response) {
            return response.body;
        });
    };
}