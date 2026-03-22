import * as request from "superagent";

type CallbackHandler = (err: any, res ? : request.Response) => void;
export type Drug = {
    'drugName': string

        'ncitCode': string

};
export type AnnotateMutationByGenomicChangeQuery = {
    'evidenceTypes': Array < "GENE_SUMMARY" | "MUTATION_SUMMARY" | "TUMOR_TYPE_SUMMARY" | "GENE_TUMOR_TYPE_SUMMARY" | "PROGNOSTIC_SUMMARY" | "DIAGNOSTIC_SUMMARY" | "GENE_BACKGROUND" | "ONCOGENIC" | "MUTATION_EFFECT" | "VUS" | "PROGNOSTIC_IMPLICATION" | "DIAGNOSTIC_IMPLICATION" | "STANDARD_THERAPEUTIC_IMPLICATIONS_FOR_DRUG_SENSITIVITY" | "STANDARD_THERAPEUTIC_IMPLICATIONS_FOR_DRUG_RESISTANCE" | "INVESTIGATIONAL_THERAPEUTIC_IMPLICATIONS_DRUG_SENSITIVITY" | "INVESTIGATIONAL_THERAPEUTIC_IMPLICATIONS_DRUG_RESISTANCE" >

        'genomicLocation': string

        'id': string

        'referenceGenome': "GRCh37" | "GRCh38"

        'tumorType': string

};
export type CuratedGene = {
    'background': string

        'entrezGeneId': number

        'grch37Isoform': string

        'grch37RefSeq': string

        'grch38Isoform': string

        'grch38RefSeq': string

        'highestResistancLevel': string

        'highestResistanceLevel': string

        'highestSensitiveLevel': string

        'hugoSymbol': string

        'oncogene': boolean

        'summary': string

        'tsg': boolean

};
export type Query = {
    'alteration': string

        'alterationType': string

        'consequence': string

        'entrezGeneId': number

        'hgvs': string

        'hugoSymbol': string

        'id': string

        'proteinEnd': number

        'proteinStart': number

        'referenceGenome': "GRCh37" | "GRCh38"

        'svType': "DELETION" | "TRANSLOCATION" | "DUPLICATION" | "INSERTION" | "INVERSION" | "FUSION" | "UNKNOWN"

        'tumorType': string

};
export type QueryGene = {
    'entrezGeneId': number

        'hugoSymbol': string

};
export type ApiHttpError = {
    'detail': string

        'message': string

        'path': string

        'status': number

        'title': string

};
export type CancerGene = {
    'entrezGeneId': number

        'foundation': boolean

        'foundationHeme': boolean

        'geneAliases': Array < string >

        'grch37Isoform': string

        'grch37RefSeq': string

        'grch38Isoform': string

        'grch38RefSeq': string

        'hugoSymbol': string

        'mSKHeme': boolean

        'mSKImpact': boolean

        'occurrenceCount': number

        'oncogene': boolean

        'oncokbAnnotated': boolean

        'sangerCGC': boolean

        'tsg': boolean

        'vogelstein': boolean

};
export type MainType = {
    'id': number

        'name': string

        'tumorForm': "SOLID" | "LIQUID" | "MIXED"

};
export type OncoKBInfo = {
    'apiVersion': SemVer

        'appVersion': SemVer

        'dataVersion': Version

        'levels': Array < InfoLevel >

        'ncitVersion': string

        'oncoTreeVersion': string

        'publicInstance': boolean

};
export type SemVer = {
    'major': number

        'minor': number

        'patch': number

        'stable': boolean

        'suffixTokens': Array < string >

        'version': string

};
export type Implication = {
    'abstracts': Array < ArticleAbstract >

        'alterations': Array < string >

        'description': string

        'levelOfEvidence': "LEVEL_1" | "LEVEL_2" | "LEVEL_3A" | "LEVEL_3B" | "LEVEL_4" | "LEVEL_R1" | "LEVEL_R2" | "LEVEL_Px1" | "LEVEL_Px2" | "LEVEL_Px3" | "LEVEL_Dx1" | "LEVEL_Dx2" | "LEVEL_Dx3" | "LEVEL_Fda1" | "LEVEL_Fda2" | "LEVEL_Fda3" | "NO"

        'pmids': Array < string >

        'tumorType': TumorType

};
export type AnnotateMutationByProteinChangeQuery = {
    'alteration': string

        'consequence': string

        'evidenceTypes': Array < "GENE_SUMMARY" | "MUTATION_SUMMARY" | "TUMOR_TYPE_SUMMARY" | "GENE_TUMOR_TYPE_SUMMARY" | "PROGNOSTIC_SUMMARY" | "DIAGNOSTIC_SUMMARY" | "GENE_BACKGROUND" | "ONCOGENIC" | "MUTATION_EFFECT" | "VUS" | "PROGNOSTIC_IMPLICATION" | "DIAGNOSTIC_IMPLICATION" | "STANDARD_THERAPEUTIC_IMPLICATIONS_FOR_DRUG_SENSITIVITY" | "STANDARD_THERAPEUTIC_IMPLICATIONS_FOR_DRUG_RESISTANCE" | "INVESTIGATIONAL_THERAPEUTIC_IMPLICATIONS_DRUG_SENSITIVITY" | "INVESTIGATIONAL_THERAPEUTIC_IMPLICATIONS_DRUG_RESISTANCE" >

        'gene': QueryGene

        'id': string

        'proteinEnd': number

        'proteinStart': number

        'referenceGenome': "GRCh37" | "GRCh38"

        'tumorType': string

};
export type IndicatorQueryTreatment = {
    'abstracts': Array < ArticleAbstract >

        'alterations': Array < string >

        'approvedIndications': Array < string >

        'description': string

        'drugs': Array < Drug >

        'fdaLevel': "LEVEL_1" | "LEVEL_2" | "LEVEL_3A" | "LEVEL_3B" | "LEVEL_4" | "LEVEL_R1" | "LEVEL_R2" | "LEVEL_Px1" | "LEVEL_Px2" | "LEVEL_Px3" | "LEVEL_Dx1" | "LEVEL_Dx2" | "LEVEL_Dx3" | "LEVEL_Fda1" | "LEVEL_Fda2" | "LEVEL_Fda3" | "NO"

        'level': "LEVEL_1" | "LEVEL_2" | "LEVEL_3A" | "LEVEL_3B" | "LEVEL_4" | "LEVEL_R1" | "LEVEL_R2" | "LEVEL_Px1" | "LEVEL_Px2" | "LEVEL_Px3" | "LEVEL_Dx1" | "LEVEL_Dx2" | "LEVEL_Dx3" | "LEVEL_Fda1" | "LEVEL_Fda2" | "LEVEL_Fda3" | "NO"

        'levelAssociatedCancerType': TumorType

        'levelExcludedCancerTypes': Array < TumorType >

        'pmids': Array < string >

};
export type TumorType = {
    'children': {}

    'code': string

        'color': string

        'id': number

        'level': number

        'mainType': MainType

        'name': string

        'parent': string

        'tissue': string

        'tumorForm': "SOLID" | "LIQUID" | "MIXED"

};
export type MutationEffectResp = {
    'citations': Citations

        'description': string

        'knownEffect': string

};
export type AnnotateCopyNumberAlterationQuery = {
    'copyNameAlterationType': "AMPLIFICATION" | "DELETION" | "GAIN" | "LOSS"

        'evidenceTypes': Array < "GENE_SUMMARY" | "MUTATION_SUMMARY" | "TUMOR_TYPE_SUMMARY" | "GENE_TUMOR_TYPE_SUMMARY" | "PROGNOSTIC_SUMMARY" | "DIAGNOSTIC_SUMMARY" | "GENE_BACKGROUND" | "ONCOGENIC" | "MUTATION_EFFECT" | "VUS" | "PROGNOSTIC_IMPLICATION" | "DIAGNOSTIC_IMPLICATION" | "STANDARD_THERAPEUTIC_IMPLICATIONS_FOR_DRUG_SENSITIVITY" | "STANDARD_THERAPEUTIC_IMPLICATIONS_FOR_DRUG_RESISTANCE" | "INVESTIGATIONAL_THERAPEUTIC_IMPLICATIONS_DRUG_SENSITIVITY" | "INVESTIGATIONAL_THERAPEUTIC_IMPLICATIONS_DRUG_RESISTANCE" >

        'gene': QueryGene

        'id': string

        'referenceGenome': "GRCh37" | "GRCh38"

        'tumorType': string

};
export type Version = {
    'date': string

        'version': string

};
export type AnnotateMutationByHGVSgQuery = {
    'evidenceTypes': Array < "GENE_SUMMARY" | "MUTATION_SUMMARY" | "TUMOR_TYPE_SUMMARY" | "GENE_TUMOR_TYPE_SUMMARY" | "PROGNOSTIC_SUMMARY" | "DIAGNOSTIC_SUMMARY" | "GENE_BACKGROUND" | "ONCOGENIC" | "MUTATION_EFFECT" | "VUS" | "PROGNOSTIC_IMPLICATION" | "DIAGNOSTIC_IMPLICATION" | "STANDARD_THERAPEUTIC_IMPLICATIONS_FOR_DRUG_SENSITIVITY" | "STANDARD_THERAPEUTIC_IMPLICATIONS_FOR_DRUG_RESISTANCE" | "INVESTIGATIONAL_THERAPEUTIC_IMPLICATIONS_DRUG_SENSITIVITY" | "INVESTIGATIONAL_THERAPEUTIC_IMPLICATIONS_DRUG_RESISTANCE" >

        'hgvsg': string

        'id': string

        'referenceGenome': "GRCh37" | "GRCh38"

        'tumorType': string

};
export type AnnotateStructuralVariantQuery = {
    'evidenceTypes': Array < "GENE_SUMMARY" | "MUTATION_SUMMARY" | "TUMOR_TYPE_SUMMARY" | "GENE_TUMOR_TYPE_SUMMARY" | "PROGNOSTIC_SUMMARY" | "DIAGNOSTIC_SUMMARY" | "GENE_BACKGROUND" | "ONCOGENIC" | "MUTATION_EFFECT" | "VUS" | "PROGNOSTIC_IMPLICATION" | "DIAGNOSTIC_IMPLICATION" | "STANDARD_THERAPEUTIC_IMPLICATIONS_FOR_DRUG_SENSITIVITY" | "STANDARD_THERAPEUTIC_IMPLICATIONS_FOR_DRUG_RESISTANCE" | "INVESTIGATIONAL_THERAPEUTIC_IMPLICATIONS_DRUG_SENSITIVITY" | "INVESTIGATIONAL_THERAPEUTIC_IMPLICATIONS_DRUG_RESISTANCE" >

        'functionalFusion': boolean

        'geneA': QueryGene

        'geneB': QueryGene

        'id': string

        'referenceGenome': "GRCh37" | "GRCh38"

        'structuralVariantType': "DELETION" | "TRANSLOCATION" | "DUPLICATION" | "INSERTION" | "INVERSION" | "FUSION" | "UNKNOWN"

        'tumorType': string

};
export type IndicatorQueryResp = {
    'alleleExist': boolean

        'dataVersion': string

        'diagnosticImplications': Array < Implication >

        'diagnosticSummary': string

        'geneExist': boolean

        'geneSummary': string

        'highestDiagnosticImplicationLevel': "LEVEL_1" | "LEVEL_2" | "LEVEL_3A" | "LEVEL_3B" | "LEVEL_4" | "LEVEL_R1" | "LEVEL_R2" | "LEVEL_Px1" | "LEVEL_Px2" | "LEVEL_Px3" | "LEVEL_Dx1" | "LEVEL_Dx2" | "LEVEL_Dx3" | "LEVEL_Fda1" | "LEVEL_Fda2" | "LEVEL_Fda3" | "NO"

        'highestFdaLevel': "LEVEL_1" | "LEVEL_2" | "LEVEL_3A" | "LEVEL_3B" | "LEVEL_4" | "LEVEL_R1" | "LEVEL_R2" | "LEVEL_Px1" | "LEVEL_Px2" | "LEVEL_Px3" | "LEVEL_Dx1" | "LEVEL_Dx2" | "LEVEL_Dx3" | "LEVEL_Fda1" | "LEVEL_Fda2" | "LEVEL_Fda3" | "NO"

        'highestPrognosticImplicationLevel': "LEVEL_1" | "LEVEL_2" | "LEVEL_3A" | "LEVEL_3B" | "LEVEL_4" | "LEVEL_R1" | "LEVEL_R2" | "LEVEL_Px1" | "LEVEL_Px2" | "LEVEL_Px3" | "LEVEL_Dx1" | "LEVEL_Dx2" | "LEVEL_Dx3" | "LEVEL_Fda1" | "LEVEL_Fda2" | "LEVEL_Fda3" | "NO"

        'highestResistanceLevel': "LEVEL_1" | "LEVEL_2" | "LEVEL_3A" | "LEVEL_3B" | "LEVEL_4" | "LEVEL_R1" | "LEVEL_R2" | "LEVEL_Px1" | "LEVEL_Px2" | "LEVEL_Px3" | "LEVEL_Dx1" | "LEVEL_Dx2" | "LEVEL_Dx3" | "LEVEL_Fda1" | "LEVEL_Fda2" | "LEVEL_Fda3" | "NO"

        'highestSensitiveLevel': "LEVEL_1" | "LEVEL_2" | "LEVEL_3A" | "LEVEL_3B" | "LEVEL_4" | "LEVEL_R1" | "LEVEL_R2" | "LEVEL_Px1" | "LEVEL_Px2" | "LEVEL_Px3" | "LEVEL_Dx1" | "LEVEL_Dx2" | "LEVEL_Dx3" | "LEVEL_Fda1" | "LEVEL_Fda2" | "LEVEL_Fda3" | "NO"

        'hotspot': boolean

        'lastUpdate': string

        'mutationEffect': MutationEffectResp

        'oncogenic': string

        'otherSignificantResistanceLevels': Array < "LEVEL_1" | "LEVEL_2" | "LEVEL_3A" | "LEVEL_3B" | "LEVEL_4" | "LEVEL_R1" | "LEVEL_R2" | "LEVEL_Px1" | "LEVEL_Px2" | "LEVEL_Px3" | "LEVEL_Dx1" | "LEVEL_Dx2" | "LEVEL_Dx3" | "LEVEL_Fda1" | "LEVEL_Fda2" | "LEVEL_Fda3" | "NO" >

        'otherSignificantSensitiveLevels': Array < "LEVEL_1" | "LEVEL_2" | "LEVEL_3A" | "LEVEL_3B" | "LEVEL_4" | "LEVEL_R1" | "LEVEL_R2" | "LEVEL_Px1" | "LEVEL_Px2" | "LEVEL_Px3" | "LEVEL_Dx1" | "LEVEL_Dx2" | "LEVEL_Dx3" | "LEVEL_Fda1" | "LEVEL_Fda2" | "LEVEL_Fda3" | "NO" >

        'prognosticImplications': Array < Implication >

        'prognosticSummary': string

        'query': Query

        'treatments': Array < IndicatorQueryTreatment >

        'tumorTypeSummary': string

        'variantExist': boolean

        'variantSummary': string

        'vus': boolean

};
export type Citations = {
    'abstracts': Array < ArticleAbstract >

        'pmids': Array < string >

};
export type ArticleAbstract = {
    'abstract': string

        'link': string

};
export type InfoLevel = {
    'colorHex': string

        'description': string

        'htmlDescription': string

        'levelOfEvidence': "LEVEL_1" | "LEVEL_2" | "LEVEL_3A" | "LEVEL_3B" | "LEVEL_4" | "LEVEL_R1" | "LEVEL_R2" | "LEVEL_Px1" | "LEVEL_Px2" | "LEVEL_Px3" | "LEVEL_Dx1" | "LEVEL_Dx2" | "LEVEL_Dx3" | "LEVEL_Fda1" | "LEVEL_Fda2" | "LEVEL_Fda3" | "NO"

};

/**
 * OncoKB, a comprehensive and curated precision oncology knowledge base, offers oncologists detailed, evidence-based information about individual somatic mutations and structural alterations present in patient tumors with the goal of supporting optimal treatment decisions.
 * @class OncoKbAPI
 * @param {(string)} [domainOrOptions] - The project domain.
 */
export default class OncoKbAPI {

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

    annotateCopyNumberAlterationsGetUsingGET_1URL(parameters: {
        'hugoSymbol' ? : string,
        'entrezGeneId' ? : number,
        'copyNameAlterationType': "AMPLIFICATION" | "DELETION" | "GAIN" | "LOSS",
        'referenceGenome' ? : string,
        'tumorType' ? : string,
        'evidenceType' ? : string,
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/annotate/copyNumberAlterations';
        if (parameters['hugoSymbol'] !== undefined) {
            queryParameters['hugoSymbol'] = parameters['hugoSymbol'];
        }

        if (parameters['entrezGeneId'] !== undefined) {
            queryParameters['entrezGeneId'] = parameters['entrezGeneId'];
        }

        if (parameters['copyNameAlterationType'] !== undefined) {
            queryParameters['copyNameAlterationType'] = parameters['copyNameAlterationType'];
        }

        if (parameters['referenceGenome'] !== undefined) {
            queryParameters['referenceGenome'] = parameters['referenceGenome'];
        }

        if (parameters['tumorType'] !== undefined) {
            queryParameters['tumorType'] = parameters['tumorType'];
        }

        if (parameters['evidenceType'] !== undefined) {
            queryParameters['evidenceType'] = parameters['evidenceType'];
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
     * Annotate copy number alteration.
     * @method
     * @name OncoKbAPI#annotateCopyNumberAlterationsGetUsingGET_1
     * @param {string} hugoSymbol - The gene symbol used in Human Genome Organisation. Example: BRAF
     * @param {integer} entrezGeneId - The entrez gene ID. (Higher priority than hugoSymbol). Example: 673
     * @param {string} copyNameAlterationType - Copy number alteration type
     * @param {string} referenceGenome - Reference genome, either GRCh37 or GRCh38. The default is GRCh37
     * @param {string} tumorType - OncoTree(http://oncotree.info) tumor type name. The field supports OncoTree Code, OncoTree Name and OncoTree Main type. Example: Melanoma
     * @param {string} evidenceType - DEPRECATED. We do not recommend using this parameter and it will eventually be removed.
     */
    annotateCopyNumberAlterationsGetUsingGET_1WithHttpInfo(parameters: {
        'hugoSymbol' ? : string,
        'entrezGeneId' ? : number,
        'copyNameAlterationType': "AMPLIFICATION" | "DELETION" | "GAIN" | "LOSS",
        'referenceGenome' ? : string,
        'tumorType' ? : string,
        'evidenceType' ? : string,
        $queryParameters ? : any,
            $domain ? : string
    }): Promise < request.Response > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        const errorHandlers = this.errorHandlers;
        const request = this.request;
        let path = '/annotate/copyNumberAlterations';
        let body: any;
        let queryParameters: any = {};
        let headers: any = {};
        let form: any = {};
        return new Promise(function(resolve, reject) {
            headers['Accept'] = 'application/json';
            headers['Content-Type'] = 'application/json';

            if (parameters['hugoSymbol'] !== undefined) {
                queryParameters['hugoSymbol'] = parameters['hugoSymbol'];
            }

            if (parameters['entrezGeneId'] !== undefined) {
                queryParameters['entrezGeneId'] = parameters['entrezGeneId'];
            }

            if (parameters['copyNameAlterationType'] !== undefined) {
                queryParameters['copyNameAlterationType'] = parameters['copyNameAlterationType'];
            }

            if (parameters['copyNameAlterationType'] === undefined) {
                reject(new Error('Missing required  parameter: copyNameAlterationType'));
                return;
            }

            if (parameters['referenceGenome'] !== undefined) {
                queryParameters['referenceGenome'] = parameters['referenceGenome'];
            }

            if (parameters['tumorType'] !== undefined) {
                queryParameters['tumorType'] = parameters['tumorType'];
            }

            if (parameters['evidenceType'] !== undefined) {
                queryParameters['evidenceType'] = parameters['evidenceType'];
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
     * Annotate copy number alteration.
     * @method
     * @name OncoKbAPI#annotateCopyNumberAlterationsGetUsingGET_1
     * @param {string} hugoSymbol - The gene symbol used in Human Genome Organisation. Example: BRAF
     * @param {integer} entrezGeneId - The entrez gene ID. (Higher priority than hugoSymbol). Example: 673
     * @param {string} copyNameAlterationType - Copy number alteration type
     * @param {string} referenceGenome - Reference genome, either GRCh37 or GRCh38. The default is GRCh37
     * @param {string} tumorType - OncoTree(http://oncotree.info) tumor type name. The field supports OncoTree Code, OncoTree Name and OncoTree Main type. Example: Melanoma
     * @param {string} evidenceType - DEPRECATED. We do not recommend using this parameter and it will eventually be removed.
     */
    annotateCopyNumberAlterationsGetUsingGET_1(parameters: {
        'hugoSymbol' ? : string,
        'entrezGeneId' ? : number,
        'copyNameAlterationType': "AMPLIFICATION" | "DELETION" | "GAIN" | "LOSS",
        'referenceGenome' ? : string,
        'tumorType' ? : string,
        'evidenceType' ? : string,
        $queryParameters ? : any,
            $domain ? : string
    }): Promise < IndicatorQueryResp > {
        return this.annotateCopyNumberAlterationsGetUsingGET_1WithHttpInfo(parameters).then(function(response: request.Response) {
            return response.body;
        });
    };
    annotateCopyNumberAlterationsPostUsingPOST_1URL(parameters: {
        'body': Array < AnnotateCopyNumberAlterationQuery > ,
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/annotate/copyNumberAlterations';

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
     * Annotate copy number alterations.
     * @method
     * @name OncoKbAPI#annotateCopyNumberAlterationsPostUsingPOST_1
     * @param {} body - List of queries. Please see swagger.json for request body format.
     */
    annotateCopyNumberAlterationsPostUsingPOST_1WithHttpInfo(parameters: {
        'body': Array < AnnotateCopyNumberAlterationQuery > ,
        $queryParameters ? : any,
        $domain ? : string
    }): Promise < request.Response > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        const errorHandlers = this.errorHandlers;
        const request = this.request;
        let path = '/annotate/copyNumberAlterations';
        let body: any;
        let queryParameters: any = {};
        let headers: any = {};
        let form: any = {};
        return new Promise(function(resolve, reject) {
            headers['Accept'] = 'application/json';
            headers['Content-Type'] = 'application/json';

            if (parameters['body'] !== undefined) {
                body = parameters['body'];
            }

            if (parameters['body'] === undefined) {
                reject(new Error('Missing required  parameter: body'));
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
     * Annotate copy number alterations.
     * @method
     * @name OncoKbAPI#annotateCopyNumberAlterationsPostUsingPOST_1
     * @param {} body - List of queries. Please see swagger.json for request body format.
     */
    annotateCopyNumberAlterationsPostUsingPOST_1(parameters: {
            'body': Array < AnnotateCopyNumberAlterationQuery > ,
            $queryParameters ? : any,
            $domain ? : string
        }): Promise < Array < IndicatorQueryResp >
        > {
            return this.annotateCopyNumberAlterationsPostUsingPOST_1WithHttpInfo(parameters).then(function(response: request.Response) {
                return response.body;
            });
        };
    annotateMutationsByGenomicChangeGetUsingGET_1URL(parameters: {
        'genomicLocation': string,
        'referenceGenome' ? : string,
        'tumorType' ? : string,
        'evidenceType' ? : string,
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/annotate/mutations/byGenomicChange';
        if (parameters['genomicLocation'] !== undefined) {
            queryParameters['genomicLocation'] = parameters['genomicLocation'];
        }

        if (parameters['referenceGenome'] !== undefined) {
            queryParameters['referenceGenome'] = parameters['referenceGenome'];
        }

        if (parameters['tumorType'] !== undefined) {
            queryParameters['tumorType'] = parameters['tumorType'];
        }

        if (parameters['evidenceType'] !== undefined) {
            queryParameters['evidenceType'] = parameters['evidenceType'];
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
     * Annotate mutation by genomic change.
     * @method
     * @name OncoKbAPI#annotateMutationsByGenomicChangeGetUsingGET_1
     * @param {string} genomicLocation - Genomic location following TCGA MAF format. Example: 7,140453136,140453136,A,T
     * @param {string} referenceGenome - Reference genome, either GRCh37 or GRCh38. The default is GRCh37
     * @param {string} tumorType - OncoTree(http://oncotree.info) tumor type name. The field supports OncoTree Code, OncoTree Name and OncoTree Main type. Example: Melanoma
     * @param {string} evidenceType - DEPRECATED. We do not recommend using this parameter and it will eventually be removed.
     */
    annotateMutationsByGenomicChangeGetUsingGET_1WithHttpInfo(parameters: {
        'genomicLocation': string,
        'referenceGenome' ? : string,
        'tumorType' ? : string,
        'evidenceType' ? : string,
        $queryParameters ? : any,
        $domain ? : string
    }): Promise < request.Response > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        const errorHandlers = this.errorHandlers;
        const request = this.request;
        let path = '/annotate/mutations/byGenomicChange';
        let body: any;
        let queryParameters: any = {};
        let headers: any = {};
        let form: any = {};
        return new Promise(function(resolve, reject) {
            headers['Accept'] = 'application/json';
            headers['Content-Type'] = 'application/json';

            if (parameters['genomicLocation'] !== undefined) {
                queryParameters['genomicLocation'] = parameters['genomicLocation'];
            }

            if (parameters['genomicLocation'] === undefined) {
                reject(new Error('Missing required  parameter: genomicLocation'));
                return;
            }

            if (parameters['referenceGenome'] !== undefined) {
                queryParameters['referenceGenome'] = parameters['referenceGenome'];
            }

            if (parameters['tumorType'] !== undefined) {
                queryParameters['tumorType'] = parameters['tumorType'];
            }

            if (parameters['evidenceType'] !== undefined) {
                queryParameters['evidenceType'] = parameters['evidenceType'];
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
     * Annotate mutation by genomic change.
     * @method
     * @name OncoKbAPI#annotateMutationsByGenomicChangeGetUsingGET_1
     * @param {string} genomicLocation - Genomic location following TCGA MAF format. Example: 7,140453136,140453136,A,T
     * @param {string} referenceGenome - Reference genome, either GRCh37 or GRCh38. The default is GRCh37
     * @param {string} tumorType - OncoTree(http://oncotree.info) tumor type name. The field supports OncoTree Code, OncoTree Name and OncoTree Main type. Example: Melanoma
     * @param {string} evidenceType - DEPRECATED. We do not recommend using this parameter and it will eventually be removed.
     */
    annotateMutationsByGenomicChangeGetUsingGET_1(parameters: {
        'genomicLocation': string,
        'referenceGenome' ? : string,
        'tumorType' ? : string,
        'evidenceType' ? : string,
        $queryParameters ? : any,
        $domain ? : string
    }): Promise < IndicatorQueryResp > {
        return this.annotateMutationsByGenomicChangeGetUsingGET_1WithHttpInfo(parameters).then(function(response: request.Response) {
            return response.body;
        });
    };
    annotateMutationsByGenomicChangePostUsingPOST_1URL(parameters: {
        'body': Array < AnnotateMutationByGenomicChangeQuery > ,
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/annotate/mutations/byGenomicChange';

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
     * Annotate mutations by genomic change.
     * @method
     * @name OncoKbAPI#annotateMutationsByGenomicChangePostUsingPOST_1
     * @param {} body - List of queries. Please see swagger.json for request body format.
     */
    annotateMutationsByGenomicChangePostUsingPOST_1WithHttpInfo(parameters: {
        'body': Array < AnnotateMutationByGenomicChangeQuery > ,
        $queryParameters ? : any,
        $domain ? : string
    }): Promise < request.Response > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        const errorHandlers = this.errorHandlers;
        const request = this.request;
        let path = '/annotate/mutations/byGenomicChange';
        let body: any;
        let queryParameters: any = {};
        let headers: any = {};
        let form: any = {};
        return new Promise(function(resolve, reject) {
            headers['Accept'] = 'application/json';
            headers['Content-Type'] = 'application/json';

            if (parameters['body'] !== undefined) {
                body = parameters['body'];
            }

            if (parameters['body'] === undefined) {
                reject(new Error('Missing required  parameter: body'));
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
     * Annotate mutations by genomic change.
     * @method
     * @name OncoKbAPI#annotateMutationsByGenomicChangePostUsingPOST_1
     * @param {} body - List of queries. Please see swagger.json for request body format.
     */
    annotateMutationsByGenomicChangePostUsingPOST_1(parameters: {
            'body': Array < AnnotateMutationByGenomicChangeQuery > ,
            $queryParameters ? : any,
            $domain ? : string
        }): Promise < Array < IndicatorQueryResp >
        > {
            return this.annotateMutationsByGenomicChangePostUsingPOST_1WithHttpInfo(parameters).then(function(response: request.Response) {
                return response.body;
            });
        };
    annotateMutationsByHGVSgGetUsingGET_1URL(parameters: {
        'hgvsg': string,
        'referenceGenome' ? : string,
        'tumorType' ? : string,
        'evidenceType' ? : string,
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/annotate/mutations/byHGVSg';
        if (parameters['hgvsg'] !== undefined) {
            queryParameters['hgvsg'] = parameters['hgvsg'];
        }

        if (parameters['referenceGenome'] !== undefined) {
            queryParameters['referenceGenome'] = parameters['referenceGenome'];
        }

        if (parameters['tumorType'] !== undefined) {
            queryParameters['tumorType'] = parameters['tumorType'];
        }

        if (parameters['evidenceType'] !== undefined) {
            queryParameters['evidenceType'] = parameters['evidenceType'];
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
     * Annotate mutation by HGVSg.
     * @method
     * @name OncoKbAPI#annotateMutationsByHGVSgGetUsingGET_1
     * @param {string} hgvsg - HGVS genomic format following HGVS nomenclature. Example: 7:g.140453136A>T
     * @param {string} referenceGenome - Reference genome, either GRCh37 or GRCh38. The default is GRCh37
     * @param {string} tumorType - OncoTree(http://oncotree.info) tumor type name. The field supports OncoTree Code, OncoTree Name and OncoTree Main type. Example: Melanoma
     * @param {string} evidenceType - DEPRECATED. We do not recommend using this parameter and it will eventually be removed.
     */
    annotateMutationsByHGVSgGetUsingGET_1WithHttpInfo(parameters: {
        'hgvsg': string,
        'referenceGenome' ? : string,
        'tumorType' ? : string,
        'evidenceType' ? : string,
        $queryParameters ? : any,
        $domain ? : string
    }): Promise < request.Response > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        const errorHandlers = this.errorHandlers;
        const request = this.request;
        let path = '/annotate/mutations/byHGVSg';
        let body: any;
        let queryParameters: any = {};
        let headers: any = {};
        let form: any = {};
        return new Promise(function(resolve, reject) {
            headers['Accept'] = 'application/json';
            headers['Content-Type'] = 'application/json';

            if (parameters['hgvsg'] !== undefined) {
                queryParameters['hgvsg'] = parameters['hgvsg'];
            }

            if (parameters['hgvsg'] === undefined) {
                reject(new Error('Missing required  parameter: hgvsg'));
                return;
            }

            if (parameters['referenceGenome'] !== undefined) {
                queryParameters['referenceGenome'] = parameters['referenceGenome'];
            }

            if (parameters['tumorType'] !== undefined) {
                queryParameters['tumorType'] = parameters['tumorType'];
            }

            if (parameters['evidenceType'] !== undefined) {
                queryParameters['evidenceType'] = parameters['evidenceType'];
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
     * Annotate mutation by HGVSg.
     * @method
     * @name OncoKbAPI#annotateMutationsByHGVSgGetUsingGET_1
     * @param {string} hgvsg - HGVS genomic format following HGVS nomenclature. Example: 7:g.140453136A>T
     * @param {string} referenceGenome - Reference genome, either GRCh37 or GRCh38. The default is GRCh37
     * @param {string} tumorType - OncoTree(http://oncotree.info) tumor type name. The field supports OncoTree Code, OncoTree Name and OncoTree Main type. Example: Melanoma
     * @param {string} evidenceType - DEPRECATED. We do not recommend using this parameter and it will eventually be removed.
     */
    annotateMutationsByHGVSgGetUsingGET_1(parameters: {
        'hgvsg': string,
        'referenceGenome' ? : string,
        'tumorType' ? : string,
        'evidenceType' ? : string,
        $queryParameters ? : any,
        $domain ? : string
    }): Promise < IndicatorQueryResp > {
        return this.annotateMutationsByHGVSgGetUsingGET_1WithHttpInfo(parameters).then(function(response: request.Response) {
            return response.body;
        });
    };
    annotateMutationsByHGVSgPostUsingPOST_1URL(parameters: {
        'body': Array < AnnotateMutationByHGVSgQuery > ,
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/annotate/mutations/byHGVSg';

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
     * Annotate mutations by HGVSg.
     * @method
     * @name OncoKbAPI#annotateMutationsByHGVSgPostUsingPOST_1
     * @param {} body - List of queries. Please see swagger.json for request body format.
     */
    annotateMutationsByHGVSgPostUsingPOST_1WithHttpInfo(parameters: {
        'body': Array < AnnotateMutationByHGVSgQuery > ,
        $queryParameters ? : any,
        $domain ? : string
    }): Promise < request.Response > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        const errorHandlers = this.errorHandlers;
        const request = this.request;
        let path = '/annotate/mutations/byHGVSg';
        let body: any;
        let queryParameters: any = {};
        let headers: any = {};
        let form: any = {};
        return new Promise(function(resolve, reject) {
            headers['Accept'] = 'application/json';
            headers['Content-Type'] = 'application/json';

            if (parameters['body'] !== undefined) {
                body = parameters['body'];
            }

            if (parameters['body'] === undefined) {
                reject(new Error('Missing required  parameter: body'));
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
     * Annotate mutations by HGVSg.
     * @method
     * @name OncoKbAPI#annotateMutationsByHGVSgPostUsingPOST_1
     * @param {} body - List of queries. Please see swagger.json for request body format.
     */
    annotateMutationsByHGVSgPostUsingPOST_1(parameters: {
            'body': Array < AnnotateMutationByHGVSgQuery > ,
            $queryParameters ? : any,
            $domain ? : string
        }): Promise < Array < IndicatorQueryResp >
        > {
            return this.annotateMutationsByHGVSgPostUsingPOST_1WithHttpInfo(parameters).then(function(response: request.Response) {
                return response.body;
            });
        };
    annotateMutationsByProteinChangeGetUsingGET_1URL(parameters: {
        'hugoSymbol' ? : string,
        'entrezGeneId' ? : number,
        'alteration' ? : string,
        'referenceGenome' ? : string,
        'consequence' ? : "feature_truncation" | "frameshift_variant" | "inframe_deletion" | "inframe_insertion" | "start_lost" | "missense_variant" | "splice_region_variant" | "stop_gained" | "synonymous_variant" | "intron_variant",
        'proteinStart' ? : number,
        'proteinEnd' ? : number,
        'tumorType' ? : string,
        'evidenceType' ? : string,
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/annotate/mutations/byProteinChange';
        if (parameters['hugoSymbol'] !== undefined) {
            queryParameters['hugoSymbol'] = parameters['hugoSymbol'];
        }

        if (parameters['entrezGeneId'] !== undefined) {
            queryParameters['entrezGeneId'] = parameters['entrezGeneId'];
        }

        if (parameters['alteration'] !== undefined) {
            queryParameters['alteration'] = parameters['alteration'];
        }

        if (parameters['referenceGenome'] !== undefined) {
            queryParameters['referenceGenome'] = parameters['referenceGenome'];
        }

        if (parameters['consequence'] !== undefined) {
            queryParameters['consequence'] = parameters['consequence'];
        }

        if (parameters['proteinStart'] !== undefined) {
            queryParameters['proteinStart'] = parameters['proteinStart'];
        }

        if (parameters['proteinEnd'] !== undefined) {
            queryParameters['proteinEnd'] = parameters['proteinEnd'];
        }

        if (parameters['tumorType'] !== undefined) {
            queryParameters['tumorType'] = parameters['tumorType'];
        }

        if (parameters['evidenceType'] !== undefined) {
            queryParameters['evidenceType'] = parameters['evidenceType'];
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
     * Annotate mutation by protein change.
     * @method
     * @name OncoKbAPI#annotateMutationsByProteinChangeGetUsingGET_1
     * @param {string} hugoSymbol - The gene symbol used in Human Genome Organisation. Example: BRAF
     * @param {integer} entrezGeneId - The entrez gene ID. (Higher priority than hugoSymbol). Example: 673
     * @param {string} alteration - Protein Change. Example: V600E
     * @param {string} referenceGenome - Reference genome, either GRCh37 or GRCh38. The default is GRCh37
     * @param {string} consequence - Consequence. Exacmple: missense_variant
     * @param {integer} proteinStart - Protein Start. Example: 600
     * @param {integer} proteinEnd - Protein End. Example: 600
     * @param {string} tumorType - OncoTree(http://oncotree.info) tumor type name. The field supports OncoTree Code, OncoTree Name and OncoTree Main type. Example: Melanoma
     * @param {string} evidenceType - DEPRECATED. We do not recommend using this parameter and it will eventually be removed.
     */
    annotateMutationsByProteinChangeGetUsingGET_1WithHttpInfo(parameters: {
        'hugoSymbol' ? : string,
        'entrezGeneId' ? : number,
        'alteration' ? : string,
        'referenceGenome' ? : string,
        'consequence' ? : "feature_truncation" | "frameshift_variant" | "inframe_deletion" | "inframe_insertion" | "start_lost" | "missense_variant" | "splice_region_variant" | "stop_gained" | "synonymous_variant" | "intron_variant",
        'proteinStart' ? : number,
        'proteinEnd' ? : number,
        'tumorType' ? : string,
        'evidenceType' ? : string,
        $queryParameters ? : any,
            $domain ? : string
    }): Promise < request.Response > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        const errorHandlers = this.errorHandlers;
        const request = this.request;
        let path = '/annotate/mutations/byProteinChange';
        let body: any;
        let queryParameters: any = {};
        let headers: any = {};
        let form: any = {};
        return new Promise(function(resolve, reject) {
            headers['Accept'] = 'application/json';
            headers['Content-Type'] = 'application/json';

            if (parameters['hugoSymbol'] !== undefined) {
                queryParameters['hugoSymbol'] = parameters['hugoSymbol'];
            }

            if (parameters['entrezGeneId'] !== undefined) {
                queryParameters['entrezGeneId'] = parameters['entrezGeneId'];
            }

            if (parameters['alteration'] !== undefined) {
                queryParameters['alteration'] = parameters['alteration'];
            }

            if (parameters['referenceGenome'] !== undefined) {
                queryParameters['referenceGenome'] = parameters['referenceGenome'];
            }

            if (parameters['consequence'] !== undefined) {
                queryParameters['consequence'] = parameters['consequence'];
            }

            if (parameters['proteinStart'] !== undefined) {
                queryParameters['proteinStart'] = parameters['proteinStart'];
            }

            if (parameters['proteinEnd'] !== undefined) {
                queryParameters['proteinEnd'] = parameters['proteinEnd'];
            }

            if (parameters['tumorType'] !== undefined) {
                queryParameters['tumorType'] = parameters['tumorType'];
            }

            if (parameters['evidenceType'] !== undefined) {
                queryParameters['evidenceType'] = parameters['evidenceType'];
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
     * Annotate mutation by protein change.
     * @method
     * @name OncoKbAPI#annotateMutationsByProteinChangeGetUsingGET_1
     * @param {string} hugoSymbol - The gene symbol used in Human Genome Organisation. Example: BRAF
     * @param {integer} entrezGeneId - The entrez gene ID. (Higher priority than hugoSymbol). Example: 673
     * @param {string} alteration - Protein Change. Example: V600E
     * @param {string} referenceGenome - Reference genome, either GRCh37 or GRCh38. The default is GRCh37
     * @param {string} consequence - Consequence. Exacmple: missense_variant
     * @param {integer} proteinStart - Protein Start. Example: 600
     * @param {integer} proteinEnd - Protein End. Example: 600
     * @param {string} tumorType - OncoTree(http://oncotree.info) tumor type name. The field supports OncoTree Code, OncoTree Name and OncoTree Main type. Example: Melanoma
     * @param {string} evidenceType - DEPRECATED. We do not recommend using this parameter and it will eventually be removed.
     */
    annotateMutationsByProteinChangeGetUsingGET_1(parameters: {
        'hugoSymbol' ? : string,
        'entrezGeneId' ? : number,
        'alteration' ? : string,
        'referenceGenome' ? : string,
        'consequence' ? : "feature_truncation" | "frameshift_variant" | "inframe_deletion" | "inframe_insertion" | "start_lost" | "missense_variant" | "splice_region_variant" | "stop_gained" | "synonymous_variant" | "intron_variant",
        'proteinStart' ? : number,
        'proteinEnd' ? : number,
        'tumorType' ? : string,
        'evidenceType' ? : string,
        $queryParameters ? : any,
            $domain ? : string
    }): Promise < IndicatorQueryResp > {
        return this.annotateMutationsByProteinChangeGetUsingGET_1WithHttpInfo(parameters).then(function(response: request.Response) {
            return response.body;
        });
    };
    annotateMutationsByProteinChangePostUsingPOST_1URL(parameters: {
        'body': Array < AnnotateMutationByProteinChangeQuery > ,
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/annotate/mutations/byProteinChange';

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
     * Annotate mutations by protein change.
     * @method
     * @name OncoKbAPI#annotateMutationsByProteinChangePostUsingPOST_1
     * @param {} body - List of queries. Please see swagger.json for request body format.
     */
    annotateMutationsByProteinChangePostUsingPOST_1WithHttpInfo(parameters: {
        'body': Array < AnnotateMutationByProteinChangeQuery > ,
        $queryParameters ? : any,
        $domain ? : string
    }): Promise < request.Response > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        const errorHandlers = this.errorHandlers;
        const request = this.request;
        let path = '/annotate/mutations/byProteinChange';
        let body: any;
        let queryParameters: any = {};
        let headers: any = {};
        let form: any = {};
        return new Promise(function(resolve, reject) {
            headers['Accept'] = 'application/json';
            headers['Content-Type'] = 'application/json';

            if (parameters['body'] !== undefined) {
                body = parameters['body'];
            }

            if (parameters['body'] === undefined) {
                reject(new Error('Missing required  parameter: body'));
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
     * Annotate mutations by protein change.
     * @method
     * @name OncoKbAPI#annotateMutationsByProteinChangePostUsingPOST_1
     * @param {} body - List of queries. Please see swagger.json for request body format.
     */
    annotateMutationsByProteinChangePostUsingPOST_1(parameters: {
            'body': Array < AnnotateMutationByProteinChangeQuery > ,
            $queryParameters ? : any,
            $domain ? : string
        }): Promise < Array < IndicatorQueryResp >
        > {
            return this.annotateMutationsByProteinChangePostUsingPOST_1WithHttpInfo(parameters).then(function(response: request.Response) {
                return response.body;
            });
        };
    annotateStructuralVariantsGetUsingGET_1URL(parameters: {
        'hugoSymbolA' ? : string,
        'entrezGeneIdA' ? : number,
        'hugoSymbolB' ? : string,
        'entrezGeneIdB' ? : number,
        'structuralVariantType': "DELETION" | "TRANSLOCATION" | "DUPLICATION" | "INSERTION" | "INVERSION" | "FUSION" | "UNKNOWN",
        'isFunctionalFusion': boolean,
        'referenceGenome' ? : string,
        'tumorType' ? : string,
        'evidenceType' ? : string,
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/annotate/structuralVariants';
        if (parameters['hugoSymbolA'] !== undefined) {
            queryParameters['hugoSymbolA'] = parameters['hugoSymbolA'];
        }

        if (parameters['entrezGeneIdA'] !== undefined) {
            queryParameters['entrezGeneIdA'] = parameters['entrezGeneIdA'];
        }

        if (parameters['hugoSymbolB'] !== undefined) {
            queryParameters['hugoSymbolB'] = parameters['hugoSymbolB'];
        }

        if (parameters['entrezGeneIdB'] !== undefined) {
            queryParameters['entrezGeneIdB'] = parameters['entrezGeneIdB'];
        }

        if (parameters['structuralVariantType'] !== undefined) {
            queryParameters['structuralVariantType'] = parameters['structuralVariantType'];
        }

        if (parameters['isFunctionalFusion'] !== undefined) {
            queryParameters['isFunctionalFusion'] = parameters['isFunctionalFusion'];
        }

        if (parameters['referenceGenome'] !== undefined) {
            queryParameters['referenceGenome'] = parameters['referenceGenome'];
        }

        if (parameters['tumorType'] !== undefined) {
            queryParameters['tumorType'] = parameters['tumorType'];
        }

        if (parameters['evidenceType'] !== undefined) {
            queryParameters['evidenceType'] = parameters['evidenceType'];
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
     * Annotate structural variant.
     * @method
     * @name OncoKbAPI#annotateStructuralVariantsGetUsingGET_1
     * @param {string} hugoSymbolA - The gene symbol A used in Human Genome Organisation. Example: ABL1
     * @param {integer} entrezGeneIdA - The entrez gene ID A. (Higher priority than hugoSymbolA) Example: 25
     * @param {string} hugoSymbolB - The gene symbol B used in Human Genome Organisation.Example: BCR 
     * @param {integer} entrezGeneIdB - The entrez gene ID B. (Higher priority than hugoSymbolB) Example: 613
     * @param {string} structuralVariantType - Structural variant type
     * @param {boolean} isFunctionalFusion - Whether is functional fusion
     * @param {string} referenceGenome - Reference genome, either GRCh37 or GRCh38. The default is GRCh37
     * @param {string} tumorType - OncoTree(http://oncotree.info) tumor type name. The field supports OncoTree Code, OncoTree Name and OncoTree Main type. Example: Melanoma
     * @param {string} evidenceType - DEPRECATED. We do not recommend using this parameter and it will eventually be removed.
     */
    annotateStructuralVariantsGetUsingGET_1WithHttpInfo(parameters: {
        'hugoSymbolA' ? : string,
        'entrezGeneIdA' ? : number,
        'hugoSymbolB' ? : string,
        'entrezGeneIdB' ? : number,
        'structuralVariantType': "DELETION" | "TRANSLOCATION" | "DUPLICATION" | "INSERTION" | "INVERSION" | "FUSION" | "UNKNOWN",
        'isFunctionalFusion': boolean,
        'referenceGenome' ? : string,
        'tumorType' ? : string,
        'evidenceType' ? : string,
        $queryParameters ? : any,
            $domain ? : string
    }): Promise < request.Response > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        const errorHandlers = this.errorHandlers;
        const request = this.request;
        let path = '/annotate/structuralVariants';
        let body: any;
        let queryParameters: any = {};
        let headers: any = {};
        let form: any = {};
        return new Promise(function(resolve, reject) {
            headers['Accept'] = 'application/json';
            headers['Content-Type'] = 'application/json';

            if (parameters['hugoSymbolA'] !== undefined) {
                queryParameters['hugoSymbolA'] = parameters['hugoSymbolA'];
            }

            if (parameters['entrezGeneIdA'] !== undefined) {
                queryParameters['entrezGeneIdA'] = parameters['entrezGeneIdA'];
            }

            if (parameters['hugoSymbolB'] !== undefined) {
                queryParameters['hugoSymbolB'] = parameters['hugoSymbolB'];
            }

            if (parameters['entrezGeneIdB'] !== undefined) {
                queryParameters['entrezGeneIdB'] = parameters['entrezGeneIdB'];
            }

            if (parameters['structuralVariantType'] !== undefined) {
                queryParameters['structuralVariantType'] = parameters['structuralVariantType'];
            }

            if (parameters['structuralVariantType'] === undefined) {
                reject(new Error('Missing required  parameter: structuralVariantType'));
                return;
            }

            if (parameters['isFunctionalFusion'] !== undefined) {
                queryParameters['isFunctionalFusion'] = parameters['isFunctionalFusion'];
            }

            if (parameters['isFunctionalFusion'] === undefined) {
                reject(new Error('Missing required  parameter: isFunctionalFusion'));
                return;
            }

            if (parameters['referenceGenome'] !== undefined) {
                queryParameters['referenceGenome'] = parameters['referenceGenome'];
            }

            if (parameters['tumorType'] !== undefined) {
                queryParameters['tumorType'] = parameters['tumorType'];
            }

            if (parameters['evidenceType'] !== undefined) {
                queryParameters['evidenceType'] = parameters['evidenceType'];
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
     * Annotate structural variant.
     * @method
     * @name OncoKbAPI#annotateStructuralVariantsGetUsingGET_1
     * @param {string} hugoSymbolA - The gene symbol A used in Human Genome Organisation. Example: ABL1
     * @param {integer} entrezGeneIdA - The entrez gene ID A. (Higher priority than hugoSymbolA) Example: 25
     * @param {string} hugoSymbolB - The gene symbol B used in Human Genome Organisation.Example: BCR 
     * @param {integer} entrezGeneIdB - The entrez gene ID B. (Higher priority than hugoSymbolB) Example: 613
     * @param {string} structuralVariantType - Structural variant type
     * @param {boolean} isFunctionalFusion - Whether is functional fusion
     * @param {string} referenceGenome - Reference genome, either GRCh37 or GRCh38. The default is GRCh37
     * @param {string} tumorType - OncoTree(http://oncotree.info) tumor type name. The field supports OncoTree Code, OncoTree Name and OncoTree Main type. Example: Melanoma
     * @param {string} evidenceType - DEPRECATED. We do not recommend using this parameter and it will eventually be removed.
     */
    annotateStructuralVariantsGetUsingGET_1(parameters: {
        'hugoSymbolA' ? : string,
        'entrezGeneIdA' ? : number,
        'hugoSymbolB' ? : string,
        'entrezGeneIdB' ? : number,
        'structuralVariantType': "DELETION" | "TRANSLOCATION" | "DUPLICATION" | "INSERTION" | "INVERSION" | "FUSION" | "UNKNOWN",
        'isFunctionalFusion': boolean,
        'referenceGenome' ? : string,
        'tumorType' ? : string,
        'evidenceType' ? : string,
        $queryParameters ? : any,
            $domain ? : string
    }): Promise < IndicatorQueryResp > {
        return this.annotateStructuralVariantsGetUsingGET_1WithHttpInfo(parameters).then(function(response: request.Response) {
            return response.body;
        });
    };
    annotateStructuralVariantsPostUsingPOST_1URL(parameters: {
        'body': Array < AnnotateStructuralVariantQuery > ,
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/annotate/structuralVariants';

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
     * Annotate structural variants.
     * @method
     * @name OncoKbAPI#annotateStructuralVariantsPostUsingPOST_1
     * @param {} body - List of queries. Please see swagger.json for request body format.
     */
    annotateStructuralVariantsPostUsingPOST_1WithHttpInfo(parameters: {
        'body': Array < AnnotateStructuralVariantQuery > ,
        $queryParameters ? : any,
        $domain ? : string
    }): Promise < request.Response > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        const errorHandlers = this.errorHandlers;
        const request = this.request;
        let path = '/annotate/structuralVariants';
        let body: any;
        let queryParameters: any = {};
        let headers: any = {};
        let form: any = {};
        return new Promise(function(resolve, reject) {
            headers['Accept'] = 'application/json';
            headers['Content-Type'] = 'application/json';

            if (parameters['body'] !== undefined) {
                body = parameters['body'];
            }

            if (parameters['body'] === undefined) {
                reject(new Error('Missing required  parameter: body'));
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
     * Annotate structural variants.
     * @method
     * @name OncoKbAPI#annotateStructuralVariantsPostUsingPOST_1
     * @param {} body - List of queries. Please see swagger.json for request body format.
     */
    annotateStructuralVariantsPostUsingPOST_1(parameters: {
            'body': Array < AnnotateStructuralVariantQuery > ,
            $queryParameters ? : any,
            $domain ? : string
        }): Promise < Array < IndicatorQueryResp >
        > {
            return this.annotateStructuralVariantsPostUsingPOST_1WithHttpInfo(parameters).then(function(response: request.Response) {
                return response.body;
            });
        };
    infoGetUsingGET_1URL(parameters: {
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/info';

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
     * infoGet
     * @method
     * @name OncoKbAPI#infoGetUsingGET_1
     */
    infoGetUsingGET_1WithHttpInfo(parameters: {
        $queryParameters ? : any,
            $domain ? : string
    }): Promise < request.Response > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        const errorHandlers = this.errorHandlers;
        const request = this.request;
        let path = '/info';
        let body: any;
        let queryParameters: any = {};
        let headers: any = {};
        let form: any = {};
        return new Promise(function(resolve, reject) {
            headers['Accept'] = 'application/json';
            headers['Content-Type'] = 'application/json';

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
     * infoGet
     * @method
     * @name OncoKbAPI#infoGetUsingGET_1
     */
    infoGetUsingGET_1(parameters: {
        $queryParameters ? : any,
            $domain ? : string
    }): Promise < OncoKBInfo > {
        return this.infoGetUsingGET_1WithHttpInfo(parameters).then(function(response: request.Response) {
            return response.body;
        });
    };
    levelsGetUsingGET_1URL(parameters: {
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/levels';

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
     * Get all levels.
     * @method
     * @name OncoKbAPI#levelsGetUsingGET_1
     */
    levelsGetUsingGET_1WithHttpInfo(parameters: {
        $queryParameters ? : any,
            $domain ? : string
    }): Promise < request.Response > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        const errorHandlers = this.errorHandlers;
        const request = this.request;
        let path = '/levels';
        let body: any;
        let queryParameters: any = {};
        let headers: any = {};
        let form: any = {};
        return new Promise(function(resolve, reject) {
            headers['Accept'] = 'application/json';
            headers['Content-Type'] = 'application/json';

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
     * Get all levels.
     * @method
     * @name OncoKbAPI#levelsGetUsingGET_1
     */
    levelsGetUsingGET_1(parameters: {
        $queryParameters ? : any,
            $domain ? : string
    }): Promise < {} > {
        return this.levelsGetUsingGET_1WithHttpInfo(parameters).then(function(response: request.Response) {
            return response.body;
        });
    };
    levelsDiagnosticGetUsingGET_1URL(parameters: {
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/levels/diagnostic';

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
     * Get all diagnostic levels.
     * @method
     * @name OncoKbAPI#levelsDiagnosticGetUsingGET_1
     */
    levelsDiagnosticGetUsingGET_1WithHttpInfo(parameters: {
        $queryParameters ? : any,
            $domain ? : string
    }): Promise < request.Response > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        const errorHandlers = this.errorHandlers;
        const request = this.request;
        let path = '/levels/diagnostic';
        let body: any;
        let queryParameters: any = {};
        let headers: any = {};
        let form: any = {};
        return new Promise(function(resolve, reject) {
            headers['Accept'] = 'application/json';
            headers['Content-Type'] = 'application/json';

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
     * Get all diagnostic levels.
     * @method
     * @name OncoKbAPI#levelsDiagnosticGetUsingGET_1
     */
    levelsDiagnosticGetUsingGET_1(parameters: {
        $queryParameters ? : any,
            $domain ? : string
    }): Promise < {} > {
        return this.levelsDiagnosticGetUsingGET_1WithHttpInfo(parameters).then(function(response: request.Response) {
            return response.body;
        });
    };
    levelsPrognosticGetUsingGET_1URL(parameters: {
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/levels/prognostic';

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
     * Get all prognostic levels.
     * @method
     * @name OncoKbAPI#levelsPrognosticGetUsingGET_1
     */
    levelsPrognosticGetUsingGET_1WithHttpInfo(parameters: {
        $queryParameters ? : any,
            $domain ? : string
    }): Promise < request.Response > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        const errorHandlers = this.errorHandlers;
        const request = this.request;
        let path = '/levels/prognostic';
        let body: any;
        let queryParameters: any = {};
        let headers: any = {};
        let form: any = {};
        return new Promise(function(resolve, reject) {
            headers['Accept'] = 'application/json';
            headers['Content-Type'] = 'application/json';

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
     * Get all prognostic levels.
     * @method
     * @name OncoKbAPI#levelsPrognosticGetUsingGET_1
     */
    levelsPrognosticGetUsingGET_1(parameters: {
        $queryParameters ? : any,
            $domain ? : string
    }): Promise < {} > {
        return this.levelsPrognosticGetUsingGET_1WithHttpInfo(parameters).then(function(response: request.Response) {
            return response.body;
        });
    };
    levelsResistanceGetUsingGET_1URL(parameters: {
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/levels/resistance';

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
     * Get all resistance levels.
     * @method
     * @name OncoKbAPI#levelsResistanceGetUsingGET_1
     */
    levelsResistanceGetUsingGET_1WithHttpInfo(parameters: {
        $queryParameters ? : any,
            $domain ? : string
    }): Promise < request.Response > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        const errorHandlers = this.errorHandlers;
        const request = this.request;
        let path = '/levels/resistance';
        let body: any;
        let queryParameters: any = {};
        let headers: any = {};
        let form: any = {};
        return new Promise(function(resolve, reject) {
            headers['Accept'] = 'application/json';
            headers['Content-Type'] = 'application/json';

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
     * Get all resistance levels.
     * @method
     * @name OncoKbAPI#levelsResistanceGetUsingGET_1
     */
    levelsResistanceGetUsingGET_1(parameters: {
        $queryParameters ? : any,
            $domain ? : string
    }): Promise < {} > {
        return this.levelsResistanceGetUsingGET_1WithHttpInfo(parameters).then(function(response: request.Response) {
            return response.body;
        });
    };
    levelsSensitiveGetUsingGET_1URL(parameters: {
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/levels/sensitive';

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
     * Get all sensitive levels.
     * @method
     * @name OncoKbAPI#levelsSensitiveGetUsingGET_1
     */
    levelsSensitiveGetUsingGET_1WithHttpInfo(parameters: {
        $queryParameters ? : any,
            $domain ? : string
    }): Promise < request.Response > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        const errorHandlers = this.errorHandlers;
        const request = this.request;
        let path = '/levels/sensitive';
        let body: any;
        let queryParameters: any = {};
        let headers: any = {};
        let form: any = {};
        return new Promise(function(resolve, reject) {
            headers['Accept'] = 'application/json';
            headers['Content-Type'] = 'application/json';

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
     * Get all sensitive levels.
     * @method
     * @name OncoKbAPI#levelsSensitiveGetUsingGET_1
     */
    levelsSensitiveGetUsingGET_1(parameters: {
        $queryParameters ? : any,
            $domain ? : string
    }): Promise < {} > {
        return this.levelsSensitiveGetUsingGET_1WithHttpInfo(parameters).then(function(response: request.Response) {
            return response.body;
        });
    };
    utilsAllCuratedGenesGetUsingGET_1URL(parameters: {
        'version' ? : string,
        'includeEvidence' ? : boolean,
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/utils/allCuratedGenes';
        if (parameters['version'] !== undefined) {
            queryParameters['version'] = parameters['version'];
        }

        if (parameters['includeEvidence'] !== undefined) {
            queryParameters['includeEvidence'] = parameters['includeEvidence'];
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
     * Get list of genes OncoKB curated
     * @method
     * @name OncoKbAPI#utilsAllCuratedGenesGetUsingGET_1
     * @param {string} version - The data version
     * @param {boolean} includeEvidence - Include gene summary and background
     */
    utilsAllCuratedGenesGetUsingGET_1WithHttpInfo(parameters: {
        'version' ? : string,
        'includeEvidence' ? : boolean,
        $queryParameters ? : any,
            $domain ? : string
    }): Promise < request.Response > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        const errorHandlers = this.errorHandlers;
        const request = this.request;
        let path = '/utils/allCuratedGenes';
        let body: any;
        let queryParameters: any = {};
        let headers: any = {};
        let form: any = {};
        return new Promise(function(resolve, reject) {
            headers['Accept'] = 'application/json';
            headers['Content-Type'] = 'application/json';

            if (parameters['version'] !== undefined) {
                queryParameters['version'] = parameters['version'];
            }

            if (parameters['includeEvidence'] !== undefined) {
                queryParameters['includeEvidence'] = parameters['includeEvidence'];
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
     * Get list of genes OncoKB curated
     * @method
     * @name OncoKbAPI#utilsAllCuratedGenesGetUsingGET_1
     * @param {string} version - The data version
     * @param {boolean} includeEvidence - Include gene summary and background
     */
    utilsAllCuratedGenesGetUsingGET_1(parameters: {
            'version' ? : string,
            'includeEvidence' ? : boolean,
            $queryParameters ? : any,
                $domain ? : string
        }): Promise < Array < CuratedGene >
        > {
            return this.utilsAllCuratedGenesGetUsingGET_1WithHttpInfo(parameters).then(function(response: request.Response) {
                return response.body;
            });
        };
    utilsAllCuratedGenesTxtGetUsingGET_1URL(parameters: {
        'version' ? : string,
        'includeEvidence' ? : boolean,
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/utils/allCuratedGenes.txt';
        if (parameters['version'] !== undefined) {
            queryParameters['version'] = parameters['version'];
        }

        if (parameters['includeEvidence'] !== undefined) {
            queryParameters['includeEvidence'] = parameters['includeEvidence'];
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
     * Get list of genes OncoKB curated in text file.
     * @method
     * @name OncoKbAPI#utilsAllCuratedGenesTxtGetUsingGET_1
     * @param {string} version - The data version
     * @param {boolean} includeEvidence - Include gene summary and background
     */
    utilsAllCuratedGenesTxtGetUsingGET_1WithHttpInfo(parameters: {
        'version' ? : string,
        'includeEvidence' ? : boolean,
        $queryParameters ? : any,
            $domain ? : string
    }): Promise < request.Response > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        const errorHandlers = this.errorHandlers;
        const request = this.request;
        let path = '/utils/allCuratedGenes.txt';
        let body: any;
        let queryParameters: any = {};
        let headers: any = {};
        let form: any = {};
        return new Promise(function(resolve, reject) {
            headers['Accept'] = 'text/plain;charset=UTF-8';
            headers['Content-Type'] = 'application/json';

            if (parameters['version'] !== undefined) {
                queryParameters['version'] = parameters['version'];
            }

            if (parameters['includeEvidence'] !== undefined) {
                queryParameters['includeEvidence'] = parameters['includeEvidence'];
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
     * Get list of genes OncoKB curated in text file.
     * @method
     * @name OncoKbAPI#utilsAllCuratedGenesTxtGetUsingGET_1
     * @param {string} version - The data version
     * @param {boolean} includeEvidence - Include gene summary and background
     */
    utilsAllCuratedGenesTxtGetUsingGET_1(parameters: {
        'version' ? : string,
        'includeEvidence' ? : boolean,
        $queryParameters ? : any,
            $domain ? : string
    }): Promise < string > {
        return this.utilsAllCuratedGenesTxtGetUsingGET_1WithHttpInfo(parameters).then(function(response: request.Response) {
            return response.body;
        });
    };
    utilsCancerGeneListGetUsingGET_1URL(parameters: {
        'version' ? : string,
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/utils/cancerGeneList';
        if (parameters['version'] !== undefined) {
            queryParameters['version'] = parameters['version'];
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
     * Get cancer gene list
     * @method
     * @name OncoKbAPI#utilsCancerGeneListGetUsingGET_1
     * @param {string} version - The data version
     */
    utilsCancerGeneListGetUsingGET_1WithHttpInfo(parameters: {
        'version' ? : string,
        $queryParameters ? : any,
            $domain ? : string
    }): Promise < request.Response > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        const errorHandlers = this.errorHandlers;
        const request = this.request;
        let path = '/utils/cancerGeneList';
        let body: any;
        let queryParameters: any = {};
        let headers: any = {};
        let form: any = {};
        return new Promise(function(resolve, reject) {
            headers['Accept'] = 'application/json';
            headers['Content-Type'] = 'application/json';

            if (parameters['version'] !== undefined) {
                queryParameters['version'] = parameters['version'];
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
     * Get cancer gene list
     * @method
     * @name OncoKbAPI#utilsCancerGeneListGetUsingGET_1
     * @param {string} version - The data version
     */
    utilsCancerGeneListGetUsingGET_1(parameters: {
            'version' ? : string,
            $queryParameters ? : any,
                $domain ? : string
        }): Promise < Array < CancerGene >
        > {
            return this.utilsCancerGeneListGetUsingGET_1WithHttpInfo(parameters).then(function(response: request.Response) {
                return response.body;
            });
        };
    utilsCancerGeneListTxtGetUsingGET_1URL(parameters: {
        'version' ? : string,
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/utils/cancerGeneList.txt';
        if (parameters['version'] !== undefined) {
            queryParameters['version'] = parameters['version'];
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
     * Get cancer gene list in text file.
     * @method
     * @name OncoKbAPI#utilsCancerGeneListTxtGetUsingGET_1
     * @param {string} version - The data version
     */
    utilsCancerGeneListTxtGetUsingGET_1WithHttpInfo(parameters: {
        'version' ? : string,
        $queryParameters ? : any,
            $domain ? : string
    }): Promise < request.Response > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        const errorHandlers = this.errorHandlers;
        const request = this.request;
        let path = '/utils/cancerGeneList.txt';
        let body: any;
        let queryParameters: any = {};
        let headers: any = {};
        let form: any = {};
        return new Promise(function(resolve, reject) {
            headers['Accept'] = 'text/plain;charset=UTF-8';
            headers['Content-Type'] = 'application/json';

            if (parameters['version'] !== undefined) {
                queryParameters['version'] = parameters['version'];
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
     * Get cancer gene list in text file.
     * @method
     * @name OncoKbAPI#utilsCancerGeneListTxtGetUsingGET_1
     * @param {string} version - The data version
     */
    utilsCancerGeneListTxtGetUsingGET_1(parameters: {
        'version' ? : string,
        $queryParameters ? : any,
            $domain ? : string
    }): Promise < string > {
        return this.utilsCancerGeneListTxtGetUsingGET_1WithHttpInfo(parameters).then(function(response: request.Response) {
            return response.body;
        });
    };
}