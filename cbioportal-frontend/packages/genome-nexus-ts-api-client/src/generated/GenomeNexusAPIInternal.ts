import * as request from "superagent";

type CallbackHandler = (err: any, res ? : request.Response) => void;
export type AggregatedHotspots = {
    'genomicLocation': GenomicLocation

        'hotspots': Array < Hotspot >

        'proteinLocation': ProteinLocation

        'transcriptId': string

        'variant': string

};
export type AlleleCount = {
    'ac': number

        'ac_afr': number

        'ac_amr': number

        'ac_asj': number

        'ac_eas': number

        'ac_fin': number

        'ac_nfe': number

        'ac_oth': number

        'ac_sas': number

};
export type AlleleFrequency = {
    'af': number

        'af_afr': number

        'af_amr': number

        'af_asj': number

        'af_eas': number

        'af_fin': number

        'af_nfe': number

        'af_oth': number

        'af_sas': number

};
export type AlleleNumber = {
    'an': number

        'an_afr': number

        'an_amr': number

        'an_asj': number

        'an_eas': number

        'an_fin': number

        'an_nfe': number

        'an_oth': number

        'an_sas': number

};
export type Alleles = {
    'allele': string

};
export type AlphaMissense = {
    'pathogenicity': string

        'score': number

};
export type Cosmic = {
    'alt': string

        'chrom': string

        'cosmicId': string

        'hg19': Hg19

        'license': string

        'mutFreq': number

        'mutNt': string

        'ref': string

        'tumorSite': string

};
export type CountByTumorType = {
    'tumorType': string

        'tumorTypeCount': number

        'variantCount': number

};
export type CuriousCases = {
    'comment': string

        'genomicLocation': string

        'hugoGeneSymbol': string

        'pubmedIds': Array < number >

};
export type Dbsnp = {
    '_class': string

        'alleleOrigin': string

        'alleles': Array < Alleles >

        'alt': string

        'chrom': string

        'dbsnpBuild': number

        'flags': Array < string >

        'hg19': Hg19

        'license': string

        'ref': string

        'rsid': string

        'validated': boolean

        'varSubtype': string

        'vartype': string

};
export type Gene = {
    'geneId': string

        'symbol': string

};
export type GeneXref = {
    'db_display_name': string

        'dbname': string

        'description': string

        'display_id': string

        'ensemblGeneId': string

        'info_text': string

        'info_types': string

        'primary_id': string

        'synonyms': Array < string >

        'version': string

};
export type GeneralPopulationStats = {
    'counts': SignalPopulationStats

        'frequencies': SignalPopulationStats

};
export type GenomicLocation = {
    'chromosome': string

        'start': number

        'end': number

        'referenceAllele': string

        'variantAllele': string

};
export type Gnomad = {
    'alleleCount': AlleleCount

        'alleleFrequency': AlleleFrequency

        'alleleNumber': AlleleNumber

        'homozygotes': Homozygotes

};
export type Hg19 = {
    'end': number

        'start': number

};
export type Hg38 = {
    'end': string

        'start': string

};
export type Hgvs = {
    'coding': Array < string >

        'genomic': Array < string >

        'protein': Array < string >

};
export type Homozygotes = {
    'hom': number

        'hom_afr': number

        'hom_amr': number

        'hom_asj': number

        'hom_eas': number

        'hom_fin': number

        'hom_nfe': number

        'hom_oth': number

        'hom_sas': number

};
export type Hotspot = {
    'hugoSymbol': string

        'inframeCount': number

        'missenseCount': number

        'residue': string

        'spliceCount': number

        'transcriptId': string

        'truncatingCount': number

        'tumorCount': number

        'type': string

};
export type HrdScore = {
    'fractionLoh': number

        'lst': number

        'ntelomericAi': number

};
export type Index = {
    'cdna': Array < string >

        'hgvsc': Array < string >

        'hgvsp': Array < string >

        'hgvspShort': Array < string >

        'hugoSymbol': Array < string >

        'rsid': Array < string >

        'variant': string

};
export type IndexSearch = {
    'queryType': "GENE_HGVSPSHORT" | "GENE_CDNA" | "GENE_HGVSP" | "HGVSG" | "HGVSC"

        'results': Array < Index >

};
export type IntegerRange = {
    'end': number

        'start': number

};
export type IntergenicConsequenceSummary = {
    'consequenceTerms': Array < string >

        'impact': string

        'variantAllele': string

        'variantClassification': string

};
export type MutationAssessor = {
    'functionalImpactPrediction': string

        'functionalImpactScore': number

        'hgvspShort': string

        'mav': number

        'msa': string

        'sv': number

        'uniprotId': string

};
export type Mutdb = {
    'alt': string

        'chrom': string

        'cosmicId': string

        'hg19': Hg19

        'mutpredScore': number

        'ref': string

        'rsid': string

        'uniprotId': string

};
export type MyVariantInfo = {
    'clinVar': MyVariantInfoClinVar

        'cosmic': Cosmic

        'dbsnp': Dbsnp

        'gnomadExome': Gnomad

        'gnomadGenome': Gnomad

        'hgvs': string

        'mutdb': Mutdb

        'query': string

        'snpeff': Snpeff

        'variant': string

        'vcf': Vcf

        'version': number

};
export type MyVariantInfoClinVar = {
    'alleleId': number

        'alt': string

        'chrom': string

        'cytogenic': string

        'gene': Gene

        'hg19': Hg19

        'hg38': Hg38

        'hgvs': Hgvs

        'license': string

        'rcv': Array < Rcv >

        'variantId': number

};
export type NucleotideContext = {
    'hgvs': string

        'id': string

        'molecule': string

        'query': string

        'seq': string

};
export type ProteinLocation = {
    'transcriptId': string

        'start': number

        'end': number

        'mutationType': string

};
export type Rcv = {
    'accession': string

        'clinicalSignificance': string

        'origin': string

        'preferredName': string

};
export type SignalMutation = {
    'biallelicCountsByTumorType': Array < CountByTumorType >

        'chromosome': string

        'countsByTumorType': Array < CountByTumorType >

        'endPosition': number

        'generalPopulationStats': GeneralPopulationStats

        'hugoGeneSymbol': string

        'mskExperReview': boolean

        'mutationStatus': string

        'overallNumberOfGermlineHomozygous': number

        'pathogenic': string

        'penetrance': string

        'qcPassCountsByTumorType': Array < CountByTumorType >

        'referenceAllele': string

        'startPosition': number

        'statsByTumorType': Array < StatsByTumorType >

        'variantAllele': string

};
export type SignalMutationFilter = {
    'hugoSymbols': Array < string >

};
export type SignalPopulationStats = {
    'afr': number

        'asj': number

        'asn': number

        'eur': number

        'impact': number

        'oth': number

};
export type SignalQuery = {
    'alteration': string

        'description': string

        'hugoSymbol': string

        'matchType': "EXACT" | "STARTS_WITH" | "PARTIAL" | "NO_MATCH"

        'queryType': "GENE" | "ALTERATION" | "VARIANT" | "REGION"

        'region': string

        'variant': string

};
export type Snpeff = {
    'license': string

};
export type StatsByTumorType = {
    'ageAtDx': number

        'fBiallelic': number

        'fCancerTypeCount': number

        'hrdScore': HrdScore

        'msiScore': number

        'nCancerTypeCount': number

        'numberOfGermlineHomozygous': number

        'numberWithSig': number

        'tmb': number

        'tumorType': string

};
export type TranscriptConsequenceSummary = {
    'alphaMissense': AlphaMissense

        'aminoAcidAlt': string

        'aminoAcidRef': string

        'aminoAcids': string

        'codonChange': string

        'consequenceTerms': string

        'entrezGeneId': string

        'exon': string

        'hgvsc': string

        'hgvsp': string

        'hgvspShort': string

        'hugoGeneSymbol': string

        'isVue': boolean

        'polyphenPrediction': string

        'polyphenScore': number

        'proteinPosition': IntegerRange

        'refSeq': string

        'siftPrediction': string

        'siftScore': number

        'transcriptId': string

        'uniprotId': string

        'variantClassification': string

};
export type VariantAnnotationSummary = {
    'alphaMissense': AlphaMissense

        'assemblyName': string

        'canonicalTranscriptId': string

        'genomicLocation': GenomicLocation

        'intergenicConsequenceSummaries': Array < IntergenicConsequenceSummary >

        'strandSign': string

        'transcriptConsequenceSummaries': Array < TranscriptConsequenceSummary >

        'transcriptConsequenceSummary': TranscriptConsequenceSummary

        'transcriptConsequences': Array < TranscriptConsequenceSummary >

        'variant': string

        'variantType': string

        'vues': Vues

};
export type Vcf = {
    'alt': string

        'position': string

        'ref': string

};
export type VueReference = {
    'pubmedId': number

        'referenceText': string

};
export type Vues = {
    'comment': string

        'confirmed': boolean

        'context': string

        'defaultEffect': string

        'genomicLocation': string

        'genomicLocationDescription': string

        'hugoGeneSymbol': string

        'mutationOrigin': string

        'references': Array < VueReference >

        'revisedProteinEffect': string

        'revisedVariantClassification': string

        'revisedVariantClassificationStandard': string

        'transcriptId': string

        'variant': string

        'vepPredictedProteinEffect': string

        'vepPredictedVariantClassification': string

};

/**
 * This page shows how to use HTTP requests to access the Genome Nexus API. There are more high level clients available in Python, R, JavaScript, TypeScript and various other languages as well as a command line client to annotate MAF and VCF. See https://docs.genomenexus.org/api.

Aside from programmatic clients there are web based tools to annotate variants, see https://docs.genomenexus.org/tools.

 We currently only provide long-term support for the '/annotation' endpoint. The other endpoints might change.
 * @class GenomeNexusAPIInternal
 * @param {(string)} [domainOrOptions] - The project domain.
 */
export default class GenomeNexusAPIInternal {

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

    fetchVariantAnnotationSummaryPOSTURL(parameters: {
        'variants': Array < string > ,
        'isoformOverrideSource' ? : string,
        'projection' ? : "ALL" | "CANONICAL",
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/annotation/summary';

        if (parameters['isoformOverrideSource'] !== undefined) {
            queryParameters['isoformOverrideSource'] = parameters['isoformOverrideSource'];
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
     * Retrieves VEP annotation summary for the provided list of variants
     * @method
     * @name GenomeNexusAPIInternal#fetchVariantAnnotationSummaryPOST
     * @param {} variants - List of variants. For example ["X:g.66937331T>A","17:g.41242962_41242963insGA"] (GRCh37) or ["1:g.182712A>C", "2:g.265023C>T", "3:g.319781del", "19:g.110753dup", "1:g.1385015_1387562del"] (GRCh38)
     * @param {string} isoformOverrideSource - Isoform override source. For example uniprot
     * @param {string} projection - Indicates whether to return summary for all transcripts or only for canonical transcript
     */
    fetchVariantAnnotationSummaryPOSTWithHttpInfo(parameters: {
        'variants': Array < string > ,
        'isoformOverrideSource' ? : string,
        'projection' ? : "ALL" | "CANONICAL",
        $queryParameters ? : any,
        $domain ? : string
    }): Promise < request.Response > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        const errorHandlers = this.errorHandlers;
        const request = this.request;
        let path = '/annotation/summary';
        let body: any;
        let queryParameters: any = {};
        let headers: any = {};
        let form: any = {};
        return new Promise(function(resolve, reject) {
            headers['Accept'] = 'application/json';
            headers['Content-Type'] = 'application/json';

            if (parameters['variants'] !== undefined) {
                body = parameters['variants'];
            }

            if (parameters['variants'] === undefined) {
                reject(new Error('Missing required  parameter: variants'));
                return;
            }

            if (parameters['isoformOverrideSource'] !== undefined) {
                queryParameters['isoformOverrideSource'] = parameters['isoformOverrideSource'];
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

            request('POST', domain + path, body, headers, queryParameters, form, reject, resolve, errorHandlers);

        });
    };

    /**
     * Retrieves VEP annotation summary for the provided list of variants
     * @method
     * @name GenomeNexusAPIInternal#fetchVariantAnnotationSummaryPOST
     * @param {} variants - List of variants. For example ["X:g.66937331T>A","17:g.41242962_41242963insGA"] (GRCh37) or ["1:g.182712A>C", "2:g.265023C>T", "3:g.319781del", "19:g.110753dup", "1:g.1385015_1387562del"] (GRCh38)
     * @param {string} isoformOverrideSource - Isoform override source. For example uniprot
     * @param {string} projection - Indicates whether to return summary for all transcripts or only for canonical transcript
     */
    fetchVariantAnnotationSummaryPOST(parameters: {
            'variants': Array < string > ,
            'isoformOverrideSource' ? : string,
            'projection' ? : "ALL" | "CANONICAL",
            $queryParameters ? : any,
            $domain ? : string
        }): Promise < Array < VariantAnnotationSummary >
        > {
            return this.fetchVariantAnnotationSummaryPOSTWithHttpInfo(parameters).then(function(response: request.Response) {
                return response.body;
            });
        };
    fetchVariantAnnotationSummaryGETURL(parameters: {
        'variant': string,
        'isoformOverrideSource' ? : string,
        'projection' ? : "ALL" | "CANONICAL",
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/annotation/summary/{variant}';

        path = path.replace('{variant}', parameters['variant'] + '');
        if (parameters['isoformOverrideSource'] !== undefined) {
            queryParameters['isoformOverrideSource'] = parameters['isoformOverrideSource'];
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
     * Retrieves VEP annotation summary for the provided variant
     * @method
     * @name GenomeNexusAPIInternal#fetchVariantAnnotationSummaryGET
     * @param {string} variant - Variant. For example 17:g.41242962_41242963insGA
     * @param {string} isoformOverrideSource - Isoform override source. For example uniprot
     * @param {string} projection - Indicates whether to return summary for all transcripts or only for canonical transcript
     */
    fetchVariantAnnotationSummaryGETWithHttpInfo(parameters: {
        'variant': string,
        'isoformOverrideSource' ? : string,
        'projection' ? : "ALL" | "CANONICAL",
        $queryParameters ? : any,
        $domain ? : string
    }): Promise < request.Response > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        const errorHandlers = this.errorHandlers;
        const request = this.request;
        let path = '/annotation/summary/{variant}';
        let body: any;
        let queryParameters: any = {};
        let headers: any = {};
        let form: any = {};
        return new Promise(function(resolve, reject) {
            headers['Accept'] = 'application/json';
            headers['Content-Type'] = 'application/json';

            path = path.replace('{variant}', parameters['variant'] + '');

            if (parameters['variant'] === undefined) {
                reject(new Error('Missing required  parameter: variant'));
                return;
            }

            if (parameters['isoformOverrideSource'] !== undefined) {
                queryParameters['isoformOverrideSource'] = parameters['isoformOverrideSource'];
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
     * Retrieves VEP annotation summary for the provided variant
     * @method
     * @name GenomeNexusAPIInternal#fetchVariantAnnotationSummaryGET
     * @param {string} variant - Variant. For example 17:g.41242962_41242963insGA
     * @param {string} isoformOverrideSource - Isoform override source. For example uniprot
     * @param {string} projection - Indicates whether to return summary for all transcripts or only for canonical transcript
     */
    fetchVariantAnnotationSummaryGET(parameters: {
        'variant': string,
        'isoformOverrideSource' ? : string,
        'projection' ? : "ALL" | "CANONICAL",
        $queryParameters ? : any,
        $domain ? : string
    }): Promise < VariantAnnotationSummary > {
        return this.fetchVariantAnnotationSummaryGETWithHttpInfo(parameters).then(function(response: request.Response) {
            return response.body;
        });
    };
    fetchHotspotAnnotationByGenomicLocationPOSTURL(parameters: {
        'genomicLocations': Array < GenomicLocation > ,
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/cancer_hotspots/genomic';

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
     * Retrieves hotspot annotations for the provided list of genomic locations
     * @method
     * @name GenomeNexusAPIInternal#fetchHotspotAnnotationByGenomicLocationPOST
     * @param {} genomicLocations - List of genomic locations.
     */
    fetchHotspotAnnotationByGenomicLocationPOSTWithHttpInfo(parameters: {
        'genomicLocations': Array < GenomicLocation > ,
        $queryParameters ? : any,
        $domain ? : string
    }): Promise < request.Response > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        const errorHandlers = this.errorHandlers;
        const request = this.request;
        let path = '/cancer_hotspots/genomic';
        let body: any;
        let queryParameters: any = {};
        let headers: any = {};
        let form: any = {};
        return new Promise(function(resolve, reject) {
            headers['Accept'] = 'application/json';
            headers['Content-Type'] = 'application/json';

            if (parameters['genomicLocations'] !== undefined) {
                body = parameters['genomicLocations'];
            }

            if (parameters['genomicLocations'] === undefined) {
                reject(new Error('Missing required  parameter: genomicLocations'));
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
     * Retrieves hotspot annotations for the provided list of genomic locations
     * @method
     * @name GenomeNexusAPIInternal#fetchHotspotAnnotationByGenomicLocationPOST
     * @param {} genomicLocations - List of genomic locations.
     */
    fetchHotspotAnnotationByGenomicLocationPOST(parameters: {
            'genomicLocations': Array < GenomicLocation > ,
            $queryParameters ? : any,
            $domain ? : string
        }): Promise < Array < AggregatedHotspots >
        > {
            return this.fetchHotspotAnnotationByGenomicLocationPOSTWithHttpInfo(parameters).then(function(response: request.Response) {
                return response.body;
            });
        };
    fetchHotspotAnnotationByGenomicLocationGETURL(parameters: {
        'genomicLocation': string,
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/cancer_hotspots/genomic/{genomicLocation}';

        path = path.replace('{genomicLocation}', parameters['genomicLocation'] + '');

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
     * Retrieves hotspot annotations for a specific genomic location
     * @method
     * @name GenomeNexusAPIInternal#fetchHotspotAnnotationByGenomicLocationGET
     * @param {string} genomicLocation - A genomic location. For example 7,140453136,140453136,A,T
     */
    fetchHotspotAnnotationByGenomicLocationGETWithHttpInfo(parameters: {
        'genomicLocation': string,
        $queryParameters ? : any,
        $domain ? : string
    }): Promise < request.Response > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        const errorHandlers = this.errorHandlers;
        const request = this.request;
        let path = '/cancer_hotspots/genomic/{genomicLocation}';
        let body: any;
        let queryParameters: any = {};
        let headers: any = {};
        let form: any = {};
        return new Promise(function(resolve, reject) {
            headers['Accept'] = 'application/json';
            headers['Content-Type'] = 'application/json';

            path = path.replace('{genomicLocation}', parameters['genomicLocation'] + '');

            if (parameters['genomicLocation'] === undefined) {
                reject(new Error('Missing required  parameter: genomicLocation'));
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
     * Retrieves hotspot annotations for a specific genomic location
     * @method
     * @name GenomeNexusAPIInternal#fetchHotspotAnnotationByGenomicLocationGET
     * @param {string} genomicLocation - A genomic location. For example 7,140453136,140453136,A,T
     */
    fetchHotspotAnnotationByGenomicLocationGET(parameters: {
            'genomicLocation': string,
            $queryParameters ? : any,
            $domain ? : string
        }): Promise < Array < Hotspot >
        > {
            return this.fetchHotspotAnnotationByGenomicLocationGETWithHttpInfo(parameters).then(function(response: request.Response) {
                return response.body;
            });
        };
    fetchHotspotAnnotationByHgvsPOSTURL(parameters: {
        'variants': Array < string > ,
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/cancer_hotspots/hgvs';

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
     * Retrieves hotspot annotations for the provided list of variants
     * @method
     * @name GenomeNexusAPIInternal#fetchHotspotAnnotationByHgvsPOST
     * @param {} variants - List of variants. For example ["7:g.140453136A>T","12:g.25398285C>A"]
     */
    fetchHotspotAnnotationByHgvsPOSTWithHttpInfo(parameters: {
        'variants': Array < string > ,
        $queryParameters ? : any,
        $domain ? : string
    }): Promise < request.Response > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        const errorHandlers = this.errorHandlers;
        const request = this.request;
        let path = '/cancer_hotspots/hgvs';
        let body: any;
        let queryParameters: any = {};
        let headers: any = {};
        let form: any = {};
        return new Promise(function(resolve, reject) {
            headers['Accept'] = 'application/json';
            headers['Content-Type'] = 'application/json';

            if (parameters['variants'] !== undefined) {
                body = parameters['variants'];
            }

            if (parameters['variants'] === undefined) {
                reject(new Error('Missing required  parameter: variants'));
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
     * Retrieves hotspot annotations for the provided list of variants
     * @method
     * @name GenomeNexusAPIInternal#fetchHotspotAnnotationByHgvsPOST
     * @param {} variants - List of variants. For example ["7:g.140453136A>T","12:g.25398285C>A"]
     */
    fetchHotspotAnnotationByHgvsPOST(parameters: {
            'variants': Array < string > ,
            $queryParameters ? : any,
            $domain ? : string
        }): Promise < Array < AggregatedHotspots >
        > {
            return this.fetchHotspotAnnotationByHgvsPOSTWithHttpInfo(parameters).then(function(response: request.Response) {
                return response.body;
            });
        };
    fetchHotspotAnnotationByHgvsGETURL(parameters: {
        'variant': string,
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/cancer_hotspots/hgvs/{variant}';

        path = path.replace('{variant}', parameters['variant'] + '');

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
     * Retrieves hotspot annotations for a specific variant
     * @method
     * @name GenomeNexusAPIInternal#fetchHotspotAnnotationByHgvsGET
     * @param {string} variant - A variant. For example 7:g.140453136A>T
     */
    fetchHotspotAnnotationByHgvsGETWithHttpInfo(parameters: {
        'variant': string,
        $queryParameters ? : any,
        $domain ? : string
    }): Promise < request.Response > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        const errorHandlers = this.errorHandlers;
        const request = this.request;
        let path = '/cancer_hotspots/hgvs/{variant}';
        let body: any;
        let queryParameters: any = {};
        let headers: any = {};
        let form: any = {};
        return new Promise(function(resolve, reject) {
            headers['Accept'] = 'application/json';
            headers['Content-Type'] = 'application/json';

            path = path.replace('{variant}', parameters['variant'] + '');

            if (parameters['variant'] === undefined) {
                reject(new Error('Missing required  parameter: variant'));
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
     * Retrieves hotspot annotations for a specific variant
     * @method
     * @name GenomeNexusAPIInternal#fetchHotspotAnnotationByHgvsGET
     * @param {string} variant - A variant. For example 7:g.140453136A>T
     */
    fetchHotspotAnnotationByHgvsGET(parameters: {
            'variant': string,
            $queryParameters ? : any,
            $domain ? : string
        }): Promise < Array < Hotspot >
        > {
            return this.fetchHotspotAnnotationByHgvsGETWithHttpInfo(parameters).then(function(response: request.Response) {
                return response.body;
            });
        };
    fetchHotspotAnnotationByProteinLocationsPOSTURL(parameters: {
        'proteinLocations': Array < ProteinLocation > ,
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/cancer_hotspots/proteinLocations';

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
     * Retrieves hotspot annotations for the provided list of transcript id, protein location and mutation type
     * @method
     * @name GenomeNexusAPIInternal#fetchHotspotAnnotationByProteinLocationsPOST
     * @param {} proteinLocations - List of transcript id, protein start location, protein end location, mutation type. The mutation types are limited to 'Missense_Mutation', 'In_Frame_Ins', 'In_Frame_Del', 'Splice_Site', and 'Splice_Region'
     */
    fetchHotspotAnnotationByProteinLocationsPOSTWithHttpInfo(parameters: {
        'proteinLocations': Array < ProteinLocation > ,
        $queryParameters ? : any,
        $domain ? : string
    }): Promise < request.Response > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        const errorHandlers = this.errorHandlers;
        const request = this.request;
        let path = '/cancer_hotspots/proteinLocations';
        let body: any;
        let queryParameters: any = {};
        let headers: any = {};
        let form: any = {};
        return new Promise(function(resolve, reject) {
            headers['Accept'] = 'application/json';
            headers['Content-Type'] = 'application/json';

            if (parameters['proteinLocations'] !== undefined) {
                body = parameters['proteinLocations'];
            }

            if (parameters['proteinLocations'] === undefined) {
                reject(new Error('Missing required  parameter: proteinLocations'));
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
     * Retrieves hotspot annotations for the provided list of transcript id, protein location and mutation type
     * @method
     * @name GenomeNexusAPIInternal#fetchHotspotAnnotationByProteinLocationsPOST
     * @param {} proteinLocations - List of transcript id, protein start location, protein end location, mutation type. The mutation types are limited to 'Missense_Mutation', 'In_Frame_Ins', 'In_Frame_Del', 'Splice_Site', and 'Splice_Region'
     */
    fetchHotspotAnnotationByProteinLocationsPOST(parameters: {
            'proteinLocations': Array < ProteinLocation > ,
            $queryParameters ? : any,
            $domain ? : string
        }): Promise < Array < AggregatedHotspots >
        > {
            return this.fetchHotspotAnnotationByProteinLocationsPOSTWithHttpInfo(parameters).then(function(response: request.Response) {
                return response.body;
            });
        };
    fetchHotspotAnnotationByTranscriptIdPOSTURL(parameters: {
        'transcriptIds': Array < string > ,
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/cancer_hotspots/transcript';

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
     * Retrieves hotspot annotations for the provided list of transcript ID
     * @method
     * @name GenomeNexusAPIInternal#fetchHotspotAnnotationByTranscriptIdPOST
     * @param {} transcriptIds - List of transcript Id. For example ["ENST00000288602","ENST00000256078"]
     */
    fetchHotspotAnnotationByTranscriptIdPOSTWithHttpInfo(parameters: {
        'transcriptIds': Array < string > ,
        $queryParameters ? : any,
        $domain ? : string
    }): Promise < request.Response > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        const errorHandlers = this.errorHandlers;
        const request = this.request;
        let path = '/cancer_hotspots/transcript';
        let body: any;
        let queryParameters: any = {};
        let headers: any = {};
        let form: any = {};
        return new Promise(function(resolve, reject) {
            headers['Accept'] = 'application/json';
            headers['Content-Type'] = 'application/json';

            if (parameters['transcriptIds'] !== undefined) {
                body = parameters['transcriptIds'];
            }

            if (parameters['transcriptIds'] === undefined) {
                reject(new Error('Missing required  parameter: transcriptIds'));
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
     * Retrieves hotspot annotations for the provided list of transcript ID
     * @method
     * @name GenomeNexusAPIInternal#fetchHotspotAnnotationByTranscriptIdPOST
     * @param {} transcriptIds - List of transcript Id. For example ["ENST00000288602","ENST00000256078"]
     */
    fetchHotspotAnnotationByTranscriptIdPOST(parameters: {
            'transcriptIds': Array < string > ,
            $queryParameters ? : any,
            $domain ? : string
        }): Promise < Array < AggregatedHotspots >
        > {
            return this.fetchHotspotAnnotationByTranscriptIdPOSTWithHttpInfo(parameters).then(function(response: request.Response) {
                return response.body;
            });
        };
    fetchHotspotAnnotationByTranscriptIdGETURL(parameters: {
        'transcriptId': string,
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/cancer_hotspots/transcript/{transcriptId}';

        path = path.replace('{transcriptId}', parameters['transcriptId'] + '');

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
     * Retrieves hotspot annotations for the provided transcript ID
     * @method
     * @name GenomeNexusAPIInternal#fetchHotspotAnnotationByTranscriptIdGET
     * @param {string} transcriptId - A Transcript Id. For example ENST00000288602
     */
    fetchHotspotAnnotationByTranscriptIdGETWithHttpInfo(parameters: {
        'transcriptId': string,
        $queryParameters ? : any,
        $domain ? : string
    }): Promise < request.Response > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        const errorHandlers = this.errorHandlers;
        const request = this.request;
        let path = '/cancer_hotspots/transcript/{transcriptId}';
        let body: any;
        let queryParameters: any = {};
        let headers: any = {};
        let form: any = {};
        return new Promise(function(resolve, reject) {
            headers['Accept'] = 'application/json';
            headers['Content-Type'] = 'application/json';

            path = path.replace('{transcriptId}', parameters['transcriptId'] + '');

            if (parameters['transcriptId'] === undefined) {
                reject(new Error('Missing required  parameter: transcriptId'));
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
     * Retrieves hotspot annotations for the provided transcript ID
     * @method
     * @name GenomeNexusAPIInternal#fetchHotspotAnnotationByTranscriptIdGET
     * @param {string} transcriptId - A Transcript Id. For example ENST00000288602
     */
    fetchHotspotAnnotationByTranscriptIdGET(parameters: {
            'transcriptId': string,
            $queryParameters ? : any,
            $domain ? : string
        }): Promise < Array < Hotspot >
        > {
            return this.fetchHotspotAnnotationByTranscriptIdGETWithHttpInfo(parameters).then(function(response: request.Response) {
                return response.body;
            });
        };
    fetchCuriousCasesGETURL(parameters: {
        'genomicLocation': string,
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/curious_cases/{genomicLocation}';

        path = path.replace('{genomicLocation}', parameters['genomicLocation'] + '');

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
     * Retrieves Curious Cases info by a genomic location
     * @method
     * @name GenomeNexusAPIInternal#fetchCuriousCasesGET
     * @param {string} genomicLocation - Genomic location, for example: 7,116411883,116411905,TTCTTTCTCTCTGTTTTAAGATC,-
     */
    fetchCuriousCasesGETWithHttpInfo(parameters: {
        'genomicLocation': string,
        $queryParameters ? : any,
        $domain ? : string
    }): Promise < request.Response > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        const errorHandlers = this.errorHandlers;
        const request = this.request;
        let path = '/curious_cases/{genomicLocation}';
        let body: any;
        let queryParameters: any = {};
        let headers: any = {};
        let form: any = {};
        return new Promise(function(resolve, reject) {
            headers['Accept'] = 'application/json';
            headers['Content-Type'] = 'application/json';

            path = path.replace('{genomicLocation}', parameters['genomicLocation'] + '');

            if (parameters['genomicLocation'] === undefined) {
                reject(new Error('Missing required  parameter: genomicLocation'));
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
     * Retrieves Curious Cases info by a genomic location
     * @method
     * @name GenomeNexusAPIInternal#fetchCuriousCasesGET
     * @param {string} genomicLocation - Genomic location, for example: 7,116411883,116411905,TTCTTTCTCTCTGTTTTAAGATC,-
     */
    fetchCuriousCasesGET(parameters: {
        'genomicLocation': string,
        $queryParameters ? : any,
        $domain ? : string
    }): Promise < CuriousCases > {
        return this.fetchCuriousCasesGETWithHttpInfo(parameters).then(function(response: request.Response) {
            return response.body;
        });
    };
    postMutationAssessorURL(parameters: {
        'variants': Array < string > ,
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/mutation_assessor';

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
     * Retrieves mutation assessor information for the provided list of variants
     * @method
     * @name GenomeNexusAPIInternal#postMutationAssessor
     * @param {} variants - List of variants. For example ["7:g.140453136A>T","12:g.25398285C>A"]
     */
    postMutationAssessorWithHttpInfo(parameters: {
        'variants': Array < string > ,
        $queryParameters ? : any,
        $domain ? : string
    }): Promise < request.Response > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        const errorHandlers = this.errorHandlers;
        const request = this.request;
        let path = '/mutation_assessor';
        let body: any;
        let queryParameters: any = {};
        let headers: any = {};
        let form: any = {};
        return new Promise(function(resolve, reject) {
            headers['Accept'] = 'application/json';
            headers['Content-Type'] = 'application/json';

            if (parameters['variants'] !== undefined) {
                body = parameters['variants'];
            }

            if (parameters['variants'] === undefined) {
                reject(new Error('Missing required  parameter: variants'));
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
     * Retrieves mutation assessor information for the provided list of variants
     * @method
     * @name GenomeNexusAPIInternal#postMutationAssessor
     * @param {} variants - List of variants. For example ["7:g.140453136A>T","12:g.25398285C>A"]
     */
    postMutationAssessor(parameters: {
            'variants': Array < string > ,
            $queryParameters ? : any,
            $domain ? : string
        }): Promise < Array < MutationAssessor >
        > {
            return this.postMutationAssessorWithHttpInfo(parameters).then(function(response: request.Response) {
                return response.body;
            });
        };
    fetchMutationAssessorGETURL(parameters: {
        'variant': string,
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/mutation_assessor/{variant}';

        path = path.replace('{variant}', parameters['variant'] + '');

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
     * Retrieves mutation assessor information for the provided list of variants
     * @method
     * @name GenomeNexusAPIInternal#fetchMutationAssessorGET
     * @param {string} variant - A variant. For example 7:g.140453136A>T
     */
    fetchMutationAssessorGETWithHttpInfo(parameters: {
        'variant': string,
        $queryParameters ? : any,
        $domain ? : string
    }): Promise < request.Response > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        const errorHandlers = this.errorHandlers;
        const request = this.request;
        let path = '/mutation_assessor/{variant}';
        let body: any;
        let queryParameters: any = {};
        let headers: any = {};
        let form: any = {};
        return new Promise(function(resolve, reject) {
            headers['Accept'] = 'application/json';
            headers['Content-Type'] = 'application/json';

            path = path.replace('{variant}', parameters['variant'] + '');

            if (parameters['variant'] === undefined) {
                reject(new Error('Missing required  parameter: variant'));
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
     * Retrieves mutation assessor information for the provided list of variants
     * @method
     * @name GenomeNexusAPIInternal#fetchMutationAssessorGET
     * @param {string} variant - A variant. For example 7:g.140453136A>T
     */
    fetchMutationAssessorGET(parameters: {
        'variant': string,
        $queryParameters ? : any,
        $domain ? : string
    }): Promise < MutationAssessor > {
        return this.fetchMutationAssessorGETWithHttpInfo(parameters).then(function(response: request.Response) {
            return response.body;
        });
    };
    postMyVariantInfoAnnotationURL(parameters: {
        'variants': Array < string > ,
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/my_variant_info/variant';

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
     * Retrieves myvariant information for the provided list of variants
     * @method
     * @name GenomeNexusAPIInternal#postMyVariantInfoAnnotation
     * @param {} variants - List of variants. For example ["7:g.140453136A>T","12:g.25398285C>A"]
     */
    postMyVariantInfoAnnotationWithHttpInfo(parameters: {
        'variants': Array < string > ,
        $queryParameters ? : any,
        $domain ? : string
    }): Promise < request.Response > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        const errorHandlers = this.errorHandlers;
        const request = this.request;
        let path = '/my_variant_info/variant';
        let body: any;
        let queryParameters: any = {};
        let headers: any = {};
        let form: any = {};
        return new Promise(function(resolve, reject) {
            headers['Accept'] = 'application/json';
            headers['Content-Type'] = 'application/json';

            if (parameters['variants'] !== undefined) {
                body = parameters['variants'];
            }

            if (parameters['variants'] === undefined) {
                reject(new Error('Missing required  parameter: variants'));
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
     * Retrieves myvariant information for the provided list of variants
     * @method
     * @name GenomeNexusAPIInternal#postMyVariantInfoAnnotation
     * @param {} variants - List of variants. For example ["7:g.140453136A>T","12:g.25398285C>A"]
     */
    postMyVariantInfoAnnotation(parameters: {
            'variants': Array < string > ,
            $queryParameters ? : any,
            $domain ? : string
        }): Promise < Array < MyVariantInfo >
        > {
            return this.postMyVariantInfoAnnotationWithHttpInfo(parameters).then(function(response: request.Response) {
                return response.body;
            });
        };
    fetchMyVariantInfoAnnotationGETURL(parameters: {
        'variant': string,
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/my_variant_info/variant/{variant}';

        path = path.replace('{variant}', parameters['variant'] + '');

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
     * Retrieves myvariant information for the provided list of variants
     * @method
     * @name GenomeNexusAPIInternal#fetchMyVariantInfoAnnotationGET
     * @param {string} variant - . For example 7:g.140453136A>T
     */
    fetchMyVariantInfoAnnotationGETWithHttpInfo(parameters: {
        'variant': string,
        $queryParameters ? : any,
        $domain ? : string
    }): Promise < request.Response > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        const errorHandlers = this.errorHandlers;
        const request = this.request;
        let path = '/my_variant_info/variant/{variant}';
        let body: any;
        let queryParameters: any = {};
        let headers: any = {};
        let form: any = {};
        return new Promise(function(resolve, reject) {
            headers['Accept'] = 'application/json';
            headers['Content-Type'] = 'application/json';

            path = path.replace('{variant}', parameters['variant'] + '');

            if (parameters['variant'] === undefined) {
                reject(new Error('Missing required  parameter: variant'));
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
     * Retrieves myvariant information for the provided list of variants
     * @method
     * @name GenomeNexusAPIInternal#fetchMyVariantInfoAnnotationGET
     * @param {string} variant - . For example 7:g.140453136A>T
     */
    fetchMyVariantInfoAnnotationGET(parameters: {
        'variant': string,
        $queryParameters ? : any,
        $domain ? : string
    }): Promise < MyVariantInfo > {
        return this.fetchMyVariantInfoAnnotationGETWithHttpInfo(parameters).then(function(response: request.Response) {
            return response.body;
        });
    };
    postNucleotideContextAnnotationURL(parameters: {
        'variants': Array < string > ,
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/nucleotide_context';

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
     * Retrieves nucleotide context information for the provided list of variants
     * @method
     * @name GenomeNexusAPIInternal#postNucleotideContextAnnotation
     * @param {} variants - List of variants. For example ["7:g.140453136A>T","12:g.25398285C>A"]
     */
    postNucleotideContextAnnotationWithHttpInfo(parameters: {
        'variants': Array < string > ,
        $queryParameters ? : any,
        $domain ? : string
    }): Promise < request.Response > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        const errorHandlers = this.errorHandlers;
        const request = this.request;
        let path = '/nucleotide_context';
        let body: any;
        let queryParameters: any = {};
        let headers: any = {};
        let form: any = {};
        return new Promise(function(resolve, reject) {
            headers['Accept'] = 'application/json';
            headers['Content-Type'] = 'application/json';

            if (parameters['variants'] !== undefined) {
                body = parameters['variants'];
            }

            if (parameters['variants'] === undefined) {
                reject(new Error('Missing required  parameter: variants'));
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
     * Retrieves nucleotide context information for the provided list of variants
     * @method
     * @name GenomeNexusAPIInternal#postNucleotideContextAnnotation
     * @param {} variants - List of variants. For example ["7:g.140453136A>T","12:g.25398285C>A"]
     */
    postNucleotideContextAnnotation(parameters: {
            'variants': Array < string > ,
            $queryParameters ? : any,
            $domain ? : string
        }): Promise < Array < NucleotideContext >
        > {
            return this.postNucleotideContextAnnotationWithHttpInfo(parameters).then(function(response: request.Response) {
                return response.body;
            });
        };
    fetchNucleotideContextAnnotationGETURL(parameters: {
        'variant': string,
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/nucleotide_context/{variant}';

        path = path.replace('{variant}', parameters['variant'] + '');

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
     * Retrieves nucleotide context information for the provided list of variants
     * @method
     * @name GenomeNexusAPIInternal#fetchNucleotideContextAnnotationGET
     * @param {string} variant - A variant. For example 7:g.140453136A>T
     */
    fetchNucleotideContextAnnotationGETWithHttpInfo(parameters: {
        'variant': string,
        $queryParameters ? : any,
        $domain ? : string
    }): Promise < request.Response > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        const errorHandlers = this.errorHandlers;
        const request = this.request;
        let path = '/nucleotide_context/{variant}';
        let body: any;
        let queryParameters: any = {};
        let headers: any = {};
        let form: any = {};
        return new Promise(function(resolve, reject) {
            headers['Accept'] = 'application/json';
            headers['Content-Type'] = 'application/json';

            path = path.replace('{variant}', parameters['variant'] + '');

            if (parameters['variant'] === undefined) {
                reject(new Error('Missing required  parameter: variant'));
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
     * Retrieves nucleotide context information for the provided list of variants
     * @method
     * @name GenomeNexusAPIInternal#fetchNucleotideContextAnnotationGET
     * @param {string} variant - A variant. For example 7:g.140453136A>T
     */
    fetchNucleotideContextAnnotationGET(parameters: {
        'variant': string,
        $queryParameters ? : any,
        $domain ? : string
    }): Promise < NucleotideContext > {
        return this.fetchNucleotideContextAnnotationGETWithHttpInfo(parameters).then(function(response: request.Response) {
            return response.body;
        });
    };
    searchAnnotationByKeywordGETUsingGETURL(parameters: {
        'keyword': string,
        'limit' ? : number,
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/search';
        if (parameters['keyword'] !== undefined) {
            queryParameters['keyword'] = parameters['keyword'];
        }

        if (parameters['limit'] !== undefined) {
            queryParameters['limit'] = parameters['limit'];
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
     * Performs index search.
     * @method
     * @name GenomeNexusAPIInternal#searchAnnotationByKeywordGETUsingGET
     * @param {string} keyword - keyword. For example 13:g.32890665G>A, TP53 p.R273C, BRAF c.1799T>A
     * @param {integer} limit - Max number of matching results to return
     */
    searchAnnotationByKeywordGETUsingGETWithHttpInfo(parameters: {
        'keyword': string,
        'limit' ? : number,
        $queryParameters ? : any,
        $domain ? : string
    }): Promise < request.Response > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        const errorHandlers = this.errorHandlers;
        const request = this.request;
        let path = '/search';
        let body: any;
        let queryParameters: any = {};
        let headers: any = {};
        let form: any = {};
        return new Promise(function(resolve, reject) {
            headers['Accept'] = 'application/json';
            headers['Content-Type'] = 'application/json';

            if (parameters['keyword'] !== undefined) {
                queryParameters['keyword'] = parameters['keyword'];
            }

            if (parameters['keyword'] === undefined) {
                reject(new Error('Missing required  parameter: keyword'));
                return;
            }

            if (parameters['limit'] !== undefined) {
                queryParameters['limit'] = parameters['limit'];
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
     * Performs index search.
     * @method
     * @name GenomeNexusAPIInternal#searchAnnotationByKeywordGETUsingGET
     * @param {string} keyword - keyword. For example 13:g.32890665G>A, TP53 p.R273C, BRAF c.1799T>A
     * @param {integer} limit - Max number of matching results to return
     */
    searchAnnotationByKeywordGETUsingGET(parameters: {
            'keyword': string,
            'limit' ? : number,
            $queryParameters ? : any,
            $domain ? : string
        }): Promise < Array < IndexSearch >
        > {
            return this.searchAnnotationByKeywordGETUsingGETWithHttpInfo(parameters).then(function(response: request.Response) {
                return response.body;
            });
        };
    fetchSignalMutationsByHugoSymbolGETUsingGETURL(parameters: {
        'hugoGeneSymbol' ? : string,
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/signal/mutation';
        if (parameters['hugoGeneSymbol'] !== undefined) {
            queryParameters['hugoGeneSymbol'] = parameters['hugoGeneSymbol'];
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
     * Retrieves SignalDB mutations by Hugo Gene Symbol
     * @method
     * @name GenomeNexusAPIInternal#fetchSignalMutationsByHugoSymbolGETUsingGET
     * @param {string} hugoGeneSymbol - Hugo Symbol. For example BRCA1
     */
    fetchSignalMutationsByHugoSymbolGETUsingGETWithHttpInfo(parameters: {
        'hugoGeneSymbol' ? : string,
        $queryParameters ? : any,
            $domain ? : string
    }): Promise < request.Response > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        const errorHandlers = this.errorHandlers;
        const request = this.request;
        let path = '/signal/mutation';
        let body: any;
        let queryParameters: any = {};
        let headers: any = {};
        let form: any = {};
        return new Promise(function(resolve, reject) {
            headers['Accept'] = 'application/json';
            headers['Content-Type'] = 'application/json';

            if (parameters['hugoGeneSymbol'] !== undefined) {
                queryParameters['hugoGeneSymbol'] = parameters['hugoGeneSymbol'];
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
     * Retrieves SignalDB mutations by Hugo Gene Symbol
     * @method
     * @name GenomeNexusAPIInternal#fetchSignalMutationsByHugoSymbolGETUsingGET
     * @param {string} hugoGeneSymbol - Hugo Symbol. For example BRCA1
     */
    fetchSignalMutationsByHugoSymbolGETUsingGET(parameters: {
            'hugoGeneSymbol' ? : string,
            $queryParameters ? : any,
                $domain ? : string
        }): Promise < Array < SignalMutation >
        > {
            return this.fetchSignalMutationsByHugoSymbolGETUsingGETWithHttpInfo(parameters).then(function(response: request.Response) {
                return response.body;
            });
        };
    fetchSignalMutationsByMutationFilterPOSTUsingPOSTURL(parameters: {
        'mutationFilter': SignalMutationFilter,
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/signal/mutation';

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
     * Retrieves SignalDB mutations by Mutation Filter
     * @method
     * @name GenomeNexusAPIInternal#fetchSignalMutationsByMutationFilterPOSTUsingPOST
     * @param {} mutationFilter - List of Hugo Gene Symbols. For example ["TP53", "PIK3CA", "BRCA1"]
     */
    fetchSignalMutationsByMutationFilterPOSTUsingPOSTWithHttpInfo(parameters: {
        'mutationFilter': SignalMutationFilter,
        $queryParameters ? : any,
        $domain ? : string
    }): Promise < request.Response > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        const errorHandlers = this.errorHandlers;
        const request = this.request;
        let path = '/signal/mutation';
        let body: any;
        let queryParameters: any = {};
        let headers: any = {};
        let form: any = {};
        return new Promise(function(resolve, reject) {
            headers['Accept'] = 'application/json';
            headers['Content-Type'] = 'application/json';

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
     * Retrieves SignalDB mutations by Mutation Filter
     * @method
     * @name GenomeNexusAPIInternal#fetchSignalMutationsByMutationFilterPOSTUsingPOST
     * @param {} mutationFilter - List of Hugo Gene Symbols. For example ["TP53", "PIK3CA", "BRCA1"]
     */
    fetchSignalMutationsByMutationFilterPOSTUsingPOST(parameters: {
            'mutationFilter': SignalMutationFilter,
            $queryParameters ? : any,
            $domain ? : string
        }): Promise < Array < SignalMutation >
        > {
            return this.fetchSignalMutationsByMutationFilterPOSTUsingPOSTWithHttpInfo(parameters).then(function(response: request.Response) {
                return response.body;
            });
        };
    fetchSignalMutationsByHgvsgGETUsingGETURL(parameters: {
        'variant': string,
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/signal/mutation/hgvs/{variant}';

        path = path.replace('{variant}', parameters['variant'] + '');

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
     * Retrieves SignalDB mutations by hgvgs variant
     * @method
     * @name GenomeNexusAPIInternal#fetchSignalMutationsByHgvsgGETUsingGET
     * @param {string} variant - A variant. For example 13:g.32890665G>A
     */
    fetchSignalMutationsByHgvsgGETUsingGETWithHttpInfo(parameters: {
        'variant': string,
        $queryParameters ? : any,
        $domain ? : string
    }): Promise < request.Response > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        const errorHandlers = this.errorHandlers;
        const request = this.request;
        let path = '/signal/mutation/hgvs/{variant}';
        let body: any;
        let queryParameters: any = {};
        let headers: any = {};
        let form: any = {};
        return new Promise(function(resolve, reject) {
            headers['Accept'] = 'application/json';
            headers['Content-Type'] = 'application/json';

            path = path.replace('{variant}', parameters['variant'] + '');

            if (parameters['variant'] === undefined) {
                reject(new Error('Missing required  parameter: variant'));
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
     * Retrieves SignalDB mutations by hgvgs variant
     * @method
     * @name GenomeNexusAPIInternal#fetchSignalMutationsByHgvsgGETUsingGET
     * @param {string} variant - A variant. For example 13:g.32890665G>A
     */
    fetchSignalMutationsByHgvsgGETUsingGET(parameters: {
            'variant': string,
            $queryParameters ? : any,
            $domain ? : string
        }): Promise < Array < SignalMutation >
        > {
            return this.fetchSignalMutationsByHgvsgGETUsingGETWithHttpInfo(parameters).then(function(response: request.Response) {
                return response.body;
            });
        };
    searchSignalByKeywordGETUsingGETURL(parameters: {
        'keyword': string,
        'limit' ? : number,
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/signal/search';
        if (parameters['keyword'] !== undefined) {
            queryParameters['keyword'] = parameters['keyword'];
        }

        if (parameters['limit'] !== undefined) {
            queryParameters['limit'] = parameters['limit'];
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
     * Performs search by gene, protein change, variant or region.
     * @method
     * @name GenomeNexusAPIInternal#searchSignalByKeywordGETUsingGET
     * @param {string} keyword - keyword. For example BRCA; BRAF V600; 13:32906640-32906640; 13:g.32890665G>A
     * @param {integer} limit - Max number of matching results to return
     */
    searchSignalByKeywordGETUsingGETWithHttpInfo(parameters: {
        'keyword': string,
        'limit' ? : number,
        $queryParameters ? : any,
        $domain ? : string
    }): Promise < request.Response > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        const errorHandlers = this.errorHandlers;
        const request = this.request;
        let path = '/signal/search';
        let body: any;
        let queryParameters: any = {};
        let headers: any = {};
        let form: any = {};
        return new Promise(function(resolve, reject) {
            headers['Accept'] = 'application/json';
            headers['Content-Type'] = 'application/json';

            if (parameters['keyword'] !== undefined) {
                queryParameters['keyword'] = parameters['keyword'];
            }

            if (parameters['keyword'] === undefined) {
                reject(new Error('Missing required  parameter: keyword'));
                return;
            }

            if (parameters['limit'] !== undefined) {
                queryParameters['limit'] = parameters['limit'];
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
     * Performs search by gene, protein change, variant or region.
     * @method
     * @name GenomeNexusAPIInternal#searchSignalByKeywordGETUsingGET
     * @param {string} keyword - keyword. For example BRCA; BRAF V600; 13:32906640-32906640; 13:g.32890665G>A
     * @param {integer} limit - Max number of matching results to return
     */
    searchSignalByKeywordGETUsingGET(parameters: {
            'keyword': string,
            'limit' ? : number,
            $queryParameters ? : any,
            $domain ? : string
        }): Promise < Array < SignalQuery >
        > {
            return this.searchSignalByKeywordGETUsingGETWithHttpInfo(parameters).then(function(response: request.Response) {
                return response.body;
            });
        };
    fetchGeneXrefsGET_1URL(parameters: {
        'accession': string,
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/xrefs/{accession}';

        path = path.replace('{accession}', parameters['accession'] + '');

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
     * Perform lookups of Ensembl identifiers and retrieve their external references in other databases
     * @method
     * @name GenomeNexusAPIInternal#fetchGeneXrefsGET_1
     * @param {string} accession - Ensembl gene accession. For example ENSG00000169083
     */
    fetchGeneXrefsGET_1WithHttpInfo(parameters: {
        'accession': string,
        $queryParameters ? : any,
        $domain ? : string
    }): Promise < request.Response > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        const errorHandlers = this.errorHandlers;
        const request = this.request;
        let path = '/xrefs/{accession}';
        let body: any;
        let queryParameters: any = {};
        let headers: any = {};
        let form: any = {};
        return new Promise(function(resolve, reject) {
            headers['Accept'] = 'application/json';
            headers['Content-Type'] = 'application/json';

            path = path.replace('{accession}', parameters['accession'] + '');

            if (parameters['accession'] === undefined) {
                reject(new Error('Missing required  parameter: accession'));
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
     * Perform lookups of Ensembl identifiers and retrieve their external references in other databases
     * @method
     * @name GenomeNexusAPIInternal#fetchGeneXrefsGET_1
     * @param {string} accession - Ensembl gene accession. For example ENSG00000169083
     */
    fetchGeneXrefsGET_1(parameters: {
            'accession': string,
            $queryParameters ? : any,
            $domain ? : string
        }): Promise < Array < GeneXref >
        > {
            return this.fetchGeneXrefsGET_1WithHttpInfo(parameters).then(function(response: request.Response) {
                return response.body;
            });
        };
}