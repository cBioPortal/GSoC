import * as request from "superagent";

type CallbackHandler = (err: any, res ? : request.Response) => void;
export type AggregateSourceInfo = {
    'annotationSourcesInfo': Array < SourceVersionInfo >

        'genomeNexus': GenomeNexusInfo

        'vep': VEPInfo

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
export type ArticleAbstract = {
    'abstract': string

        'link': string

};
export type Citations = {
    'abstracts': Array < ArticleAbstract >

        'pmids': Array < string >

};
export type Clinvar = {
    'alternateAllele': string

        'chromosome': string

        'clinicalSignificance': string

        'clinvarId': number

        'conflictingClinicalSignificance': string

        'endPosition': number

        'referenceAllele': string

        'startPosition': number

};
export type ClinvarAnnotation = {
    'annotation': Clinvar

};
export type ColocatedVariant = {
    'dbSnpId': string

        'gnomad_nfe_allele': string

        'gnomad_nfe_maf': string

        'gnomad_afr_allele': string

        'gnomad_afr_maf': string

        'gnomad_eas_allele': string

        'gnomad_eas_maf': string

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
export type Drug = {
    'drugName': string

        'ncitCode': string

        'synonyms': Array < string >

        'uuid': string

};
export type EnsemblFilter = {
    'geneIds': Array < string >

        'hugoSymbols': Array < string >

        'proteinIds': Array < string >

        'transcriptIds': Array < string >

};
export type EnsemblGene = {
    'geneId': string

        'hugoSymbol': string

        'synonyms': Array < string >

        'previousSymbols': Array < string >

        'entrezGeneId': string

};
export type EnsemblTranscript = {
    'uniprotId': string

        'transcriptId': string

        'geneId': string

        'proteinId': string

        'proteinLength': number

        'pfamDomains': Array < PfamDomainRange >

        'hugoSymbols': Array < string >

        'refseqMrnaId': string

        'ccdsId': string

        'exons': Array < Exon >

        'utrs': Array < UntranslatedRegion >

};
export type Exon = {
    'exonId': string

        'exonStart': number

        'exonEnd': number

        'rank': number

        'strand': number

        'version': number

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
export type GenomeNexusInfo = {
    'database': Version

        'server': Version

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
export type HotspotAnnotation = {
    'annotation': Array < Array < Hotspot >
        >

        'license': string

};
export type HrdScore = {
    'fractionLoh': number

        'lst': number

        'ntelomericAi': number

};
export type Implication = {
    'abstracts': Array < ArticleAbstract >

        'alterations': Array < string >

        'description': string

        'levelOfEvidence': "LEVEL_1" | "LEVEL_2" | "LEVEL_3A" | "LEVEL_3B" | "LEVEL_4" | "LEVEL_R1" | "LEVEL_R2" | "LEVEL_Px1" | "LEVEL_Px2" | "LEVEL_Px3" | "LEVEL_Dx1" | "LEVEL_Dx2" | "LEVEL_Dx3" | "LEVEL_Fda1" | "LEVEL_Fda2" | "LEVEL_Fda3" | "NO"

        'pmids': Array < string >

        'tumorType': TumorType

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
export type IntergenicConsequences = {
    'impact': string

        'variantAllele': string

        'consequenceTerms': Array < string >

};
export type MainType = {
    'id': number

        'name': string

        'tumorForm': "SOLID" | "LIQUID" | "MIXED"

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
export type MutationEffectResp = {
    'citations': Citations

        'description': string

        'knownEffect': string

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
export type MyVariantInfoAnnotation = {
    'annotation': MyVariantInfo

        'license': string

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
export type NucleotideContextAnnotation = {
    'annotation': NucleotideContext

        'license': string

};
export type OncokbAnnotation = {
    'annotation': IndicatorQueryResp

        'license': string

};
export type PdbHeader = {
    'compound': {}

    'pdbId': string

        'source': {}

        'title': string

};
export type PfamDomain = {
    'description': string

        'name': string

        'pfamAccession': string

};
export type PfamDomainRange = {
    'pfamDomainId': string

        'pfamDomainStart': number

        'pfamDomainEnd': number

};
export type PostTranslationalModification = {
    'ensemblTranscriptIds': Array < string >

        'position': number

        'pubmedIds': Array < string >

        'sequence': string

        'type': string

        'uniprotAccession': string

        'uniprotEntry': string

};
export type PtmAnnotation = {
    'annotation': Array < Array < PostTranslationalModification >
        >

        'license': string

};
export type PtmFilter = {
    'transcriptIds': Array < string >

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
export type Rcv = {
    'accession': string

        'clinicalSignificance': string

        'origin': string

        'preferredName': string

};
export type SignalAnnotation = {
    'annotation': Array < SignalMutation >

        'license': string

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
export type SignalPopulationStats = {
    'afr': number

        'asj': number

        'asn': number

        'eur': number

        'impact': number

        'oth': number

};
export type Snpeff = {
    'license': string

};
export type SourceVersionInfo = {
    'description': string

        'id': string

        'name': string

        'type': string

        'url': string

        'version': string

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
export type TranscriptConsequence = {
    'alphaMissense': AlphaMissense

        'amino_acids': string

        'canonical': string

        'codons': string

        'consequence_terms': Array < string >

        'exon': string

        'gene_id': string

        'gene_symbol': string

        'hgnc_id': string

        'hgvsc': string

        'hgvsg': string

        'hgvsp': string

        'polyphen_prediction': string

        'polyphen_score': number

        'protein_end': number

        'protein_id': string

        'protein_start': number

        'refseq_transcript_ids': Array < string >

        'sift_prediction': string

        'sift_score': number

        'transcript_id': string

        'uniprotId': string

        'variant_allele': string

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
export type UntranslatedRegion = {
    'type': string

        'start': number

        'end': number

        'strand': number

};
export type VEPInfo = {
    'cache': Version

        'comment': string

        'server': Version

};
export type VariantAnnotation = {
    'allele_string': string

        'annotationJSON': string

        'annotation_summary': VariantAnnotationSummary

        'assembly_name': string

        'clinvar': ClinvarAnnotation

        'colocatedVariants': Array < ColocatedVariant >

        'end': number

        'errorMessage': string

        'genomicLocationExplanation': string

        'hgvsg': string

        'hotspots': HotspotAnnotation

        'id': string

        'intergenic_consequences': Array < IntergenicConsequences >

        'most_severe_consequence': string

        'mutation_assessor': MutationAssessor

        'my_variant_info': MyVariantInfoAnnotation

        'nucleotide_context': NucleotideContextAnnotation

        'oncokb': OncokbAnnotation

        'originalVariantQuery': string

        'ptms': PtmAnnotation

        'seq_region_name': string

        'signalAnnotation': SignalAnnotation

        'start': number

        'strand': number

        'successfully_annotated': boolean

        'transcript_consequences': Array < TranscriptConsequence >

        'variant': string

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
export type Version = {
    'static': boolean

        'version': string

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
 * @class GenomeNexusAPI
 * @param {(string)} [domainOrOptions] - The project domain.
 */
export default class GenomeNexusAPI {

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

    fetchVariantAnnotationPOSTURL(parameters: {
        'variants': Array < string > ,
        'isoformOverrideSource' ? : string,
        'token' ? : string,
        'fields' ? : "annotation_summary" | "clinvar" | "hotspots" | "mutation_assessor" | "my_variant_info" | "nucleotide_context" | "oncokb" | "ptms" | "signal",
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/annotation';

        if (parameters['isoformOverrideSource'] !== undefined) {
            queryParameters['isoformOverrideSource'] = parameters['isoformOverrideSource'];
        }

        if (parameters['token'] !== undefined) {
            queryParameters['token'] = parameters['token'];
        }

        if (parameters['fields'] !== undefined) {
            queryParameters['fields'] = parameters['fields'];
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
     * Retrieves VEP annotation for the provided list of variants
     * @method
     * @name GenomeNexusAPI#fetchVariantAnnotationPOST
     * @param {} variants - List of variants. For example ["X:g.66937331T>A","17:g.41242962_41242963insGA"] (GRCh37) or ["1:g.182712A>C", "2:g.265023C>T", "3:g.319781del", "19:g.110753dup", "1:g.1385015_1387562del"] (GRCh38)
     * @param {string} isoformOverrideSource - Isoform override source. For example uniprot
     * @param {string} token - Map of tokens. For example {"source1":"put-your-token1-here","source2":"put-your-token2-here"}
     * @param {array} fields - Comma separated list of fields to include in the annotation (case-sensitive!). Defaults to "annotation_summary" if no value passed. Valid values: {annotation_summary, clinvar, hotspots, mutation_assessor, my_variant_info, nucleotide_context, oncokb, ptms, signal}
     */
    fetchVariantAnnotationPOSTWithHttpInfo(parameters: {
        'variants': Array < string > ,
        'isoformOverrideSource' ? : string,
        'token' ? : string,
        'fields' ? : "annotation_summary" | "clinvar" | "hotspots" | "mutation_assessor" | "my_variant_info" | "nucleotide_context" | "oncokb" | "ptms" | "signal",
        $queryParameters ? : any,
        $domain ? : string
    }): Promise < request.Response > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        const errorHandlers = this.errorHandlers;
        const request = this.request;
        let path = '/annotation';
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

            if (parameters['token'] !== undefined) {
                queryParameters['token'] = parameters['token'];
            }

            if (parameters['fields'] !== undefined) {
                queryParameters['fields'] = parameters['fields'];
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
     * Retrieves VEP annotation for the provided list of variants
     * @method
     * @name GenomeNexusAPI#fetchVariantAnnotationPOST
     * @param {} variants - List of variants. For example ["X:g.66937331T>A","17:g.41242962_41242963insGA"] (GRCh37) or ["1:g.182712A>C", "2:g.265023C>T", "3:g.319781del", "19:g.110753dup", "1:g.1385015_1387562del"] (GRCh38)
     * @param {string} isoformOverrideSource - Isoform override source. For example uniprot
     * @param {string} token - Map of tokens. For example {"source1":"put-your-token1-here","source2":"put-your-token2-here"}
     * @param {array} fields - Comma separated list of fields to include in the annotation (case-sensitive!). Defaults to "annotation_summary" if no value passed. Valid values: {annotation_summary, clinvar, hotspots, mutation_assessor, my_variant_info, nucleotide_context, oncokb, ptms, signal}
     */
    fetchVariantAnnotationPOST(parameters: {
            'variants': Array < string > ,
            'isoformOverrideSource' ? : string,
            'token' ? : string,
            'fields' ? : "annotation_summary" | "clinvar" | "hotspots" | "mutation_assessor" | "my_variant_info" | "nucleotide_context" | "oncokb" | "ptms" | "signal",
            $queryParameters ? : any,
            $domain ? : string
        }): Promise < Array < VariantAnnotation >
        > {
            return this.fetchVariantAnnotationPOSTWithHttpInfo(parameters).then(function(response: request.Response) {
                return response.body;
            });
        };
    fetchVariantAnnotationByIdPOSTURL(parameters: {
        'variantIds': Array < string > ,
        'isoformOverrideSource' ? : string,
        'token' ? : string,
        'fields' ? : "annotation_summary" | "clinvar" | "hotspots" | "mutation_assessor" | "my_variant_info" | "nucleotide_context" | "oncokb" | "ptms" | "signal",
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/annotation/dbsnp/';

        if (parameters['isoformOverrideSource'] !== undefined) {
            queryParameters['isoformOverrideSource'] = parameters['isoformOverrideSource'];
        }

        if (parameters['token'] !== undefined) {
            queryParameters['token'] = parameters['token'];
        }

        if (parameters['fields'] !== undefined) {
            queryParameters['fields'] = parameters['fields'];
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
     * Retrieves VEP annotation for the provided list of dbSNP ids
     * @method
     * @name GenomeNexusAPI#fetchVariantAnnotationByIdPOST
     * @param {} variantIds - List of variant IDs. For example ["rs116035550"]
     * @param {string} isoformOverrideSource - Isoform override source. For example uniprot
     * @param {string} token - Map of tokens. For example {"source1":"put-your-token1-here","source2":"put-your-token2-here"}
     * @param {array} fields - Comma separated list of fields to include in the annotation (case-sensitive!). Defaults to "annotation_summary" if no value passed. Valid values: {annotation_summary, clinvar, hotspots, mutation_assessor, my_variant_info, nucleotide_context, oncokb, ptms, signal}
     */
    fetchVariantAnnotationByIdPOSTWithHttpInfo(parameters: {
        'variantIds': Array < string > ,
        'isoformOverrideSource' ? : string,
        'token' ? : string,
        'fields' ? : "annotation_summary" | "clinvar" | "hotspots" | "mutation_assessor" | "my_variant_info" | "nucleotide_context" | "oncokb" | "ptms" | "signal",
        $queryParameters ? : any,
        $domain ? : string
    }): Promise < request.Response > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        const errorHandlers = this.errorHandlers;
        const request = this.request;
        let path = '/annotation/dbsnp/';
        let body: any;
        let queryParameters: any = {};
        let headers: any = {};
        let form: any = {};
        return new Promise(function(resolve, reject) {
            headers['Accept'] = 'application/json';
            headers['Content-Type'] = 'application/json';

            if (parameters['variantIds'] !== undefined) {
                body = parameters['variantIds'];
            }

            if (parameters['variantIds'] === undefined) {
                reject(new Error('Missing required  parameter: variantIds'));
                return;
            }

            if (parameters['isoformOverrideSource'] !== undefined) {
                queryParameters['isoformOverrideSource'] = parameters['isoformOverrideSource'];
            }

            if (parameters['token'] !== undefined) {
                queryParameters['token'] = parameters['token'];
            }

            if (parameters['fields'] !== undefined) {
                queryParameters['fields'] = parameters['fields'];
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
     * Retrieves VEP annotation for the provided list of dbSNP ids
     * @method
     * @name GenomeNexusAPI#fetchVariantAnnotationByIdPOST
     * @param {} variantIds - List of variant IDs. For example ["rs116035550"]
     * @param {string} isoformOverrideSource - Isoform override source. For example uniprot
     * @param {string} token - Map of tokens. For example {"source1":"put-your-token1-here","source2":"put-your-token2-here"}
     * @param {array} fields - Comma separated list of fields to include in the annotation (case-sensitive!). Defaults to "annotation_summary" if no value passed. Valid values: {annotation_summary, clinvar, hotspots, mutation_assessor, my_variant_info, nucleotide_context, oncokb, ptms, signal}
     */
    fetchVariantAnnotationByIdPOST(parameters: {
            'variantIds': Array < string > ,
            'isoformOverrideSource' ? : string,
            'token' ? : string,
            'fields' ? : "annotation_summary" | "clinvar" | "hotspots" | "mutation_assessor" | "my_variant_info" | "nucleotide_context" | "oncokb" | "ptms" | "signal",
            $queryParameters ? : any,
            $domain ? : string
        }): Promise < Array < VariantAnnotation >
        > {
            return this.fetchVariantAnnotationByIdPOSTWithHttpInfo(parameters).then(function(response: request.Response) {
                return response.body;
            });
        };
    fetchVariantAnnotationByIdGETURL(parameters: {
        'variantId': string,
        'isoformOverrideSource' ? : string,
        'token' ? : string,
        'fields' ? : "annotation_summary" | "clinvar" | "hotspots" | "mutation_assessor" | "my_variant_info" | "nucleotide_context" | "oncokb" | "ptms" | "signal",
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/annotation/dbsnp/{variantId}';

        path = path.replace('{variantId}', parameters['variantId'] + '');
        if (parameters['isoformOverrideSource'] !== undefined) {
            queryParameters['isoformOverrideSource'] = parameters['isoformOverrideSource'];
        }

        if (parameters['token'] !== undefined) {
            queryParameters['token'] = parameters['token'];
        }

        if (parameters['fields'] !== undefined) {
            queryParameters['fields'] = parameters['fields'];
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
     * Retrieves VEP annotation for the give dbSNP id
     * @method
     * @name GenomeNexusAPI#fetchVariantAnnotationByIdGET
     * @param {string} variantId - dbSNP id. For example rs116035550.
     * @param {string} isoformOverrideSource - Isoform override source. For example uniprot
     * @param {string} token - Map of tokens. For example {"source1":"put-your-token1-here","source2":"put-your-token2-here"}
     * @param {array} fields - Comma separated list of fields to include in the annotation (case-sensitive!). Defaults to "annotation_summary" if no value passed. Valid values: {annotation_summary, clinvar, hotspots, mutation_assessor, my_variant_info, nucleotide_context, oncokb, ptms, signal}
     */
    fetchVariantAnnotationByIdGETWithHttpInfo(parameters: {
        'variantId': string,
        'isoformOverrideSource' ? : string,
        'token' ? : string,
        'fields' ? : "annotation_summary" | "clinvar" | "hotspots" | "mutation_assessor" | "my_variant_info" | "nucleotide_context" | "oncokb" | "ptms" | "signal",
        $queryParameters ? : any,
        $domain ? : string
    }): Promise < request.Response > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        const errorHandlers = this.errorHandlers;
        const request = this.request;
        let path = '/annotation/dbsnp/{variantId}';
        let body: any;
        let queryParameters: any = {};
        let headers: any = {};
        let form: any = {};
        return new Promise(function(resolve, reject) {
            headers['Accept'] = 'application/json';
            headers['Content-Type'] = 'application/json';

            path = path.replace('{variantId}', parameters['variantId'] + '');

            if (parameters['variantId'] === undefined) {
                reject(new Error('Missing required  parameter: variantId'));
                return;
            }

            if (parameters['isoformOverrideSource'] !== undefined) {
                queryParameters['isoformOverrideSource'] = parameters['isoformOverrideSource'];
            }

            if (parameters['token'] !== undefined) {
                queryParameters['token'] = parameters['token'];
            }

            if (parameters['fields'] !== undefined) {
                queryParameters['fields'] = parameters['fields'];
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
     * Retrieves VEP annotation for the give dbSNP id
     * @method
     * @name GenomeNexusAPI#fetchVariantAnnotationByIdGET
     * @param {string} variantId - dbSNP id. For example rs116035550.
     * @param {string} isoformOverrideSource - Isoform override source. For example uniprot
     * @param {string} token - Map of tokens. For example {"source1":"put-your-token1-here","source2":"put-your-token2-here"}
     * @param {array} fields - Comma separated list of fields to include in the annotation (case-sensitive!). Defaults to "annotation_summary" if no value passed. Valid values: {annotation_summary, clinvar, hotspots, mutation_assessor, my_variant_info, nucleotide_context, oncokb, ptms, signal}
     */
    fetchVariantAnnotationByIdGET(parameters: {
        'variantId': string,
        'isoformOverrideSource' ? : string,
        'token' ? : string,
        'fields' ? : "annotation_summary" | "clinvar" | "hotspots" | "mutation_assessor" | "my_variant_info" | "nucleotide_context" | "oncokb" | "ptms" | "signal",
        $queryParameters ? : any,
        $domain ? : string
    }): Promise < VariantAnnotation > {
        return this.fetchVariantAnnotationByIdGETWithHttpInfo(parameters).then(function(response: request.Response) {
            return response.body;
        });
    };
    fetchVariantAnnotationByGenomicLocationPOSTURL(parameters: {
        'genomicLocations': Array < GenomicLocation > ,
        'isoformOverrideSource' ? : string,
        'token' ? : string,
        'fields' ? : "annotation_summary" | "clinvar" | "hotspots" | "mutation_assessor" | "my_variant_info" | "nucleotide_context" | "oncokb" | "ptms" | "signal",
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/annotation/genomic';

        if (parameters['isoformOverrideSource'] !== undefined) {
            queryParameters['isoformOverrideSource'] = parameters['isoformOverrideSource'];
        }

        if (parameters['token'] !== undefined) {
            queryParameters['token'] = parameters['token'];
        }

        if (parameters['fields'] !== undefined) {
            queryParameters['fields'] = parameters['fields'];
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
     * Retrieves VEP annotation for the provided list of genomic locations
     * @method
     * @name GenomeNexusAPI#fetchVariantAnnotationByGenomicLocationPOST
     * @param {} genomicLocations - List of Genomic Locations
     * @param {string} isoformOverrideSource - Isoform override source. For example uniprot
     * @param {string} token - Map of tokens. For example {"source1":"put-your-token1-here","source2":"put-your-token2-here"}
     * @param {array} fields - Comma separated list of fields to include in the annotation (case-sensitive!). Defaults to "annotation_summary" if no value passed. Valid values: {annotation_summary, clinvar, hotspots, mutation_assessor, my_variant_info, nucleotide_context, oncokb, ptms, signal}
     */
    fetchVariantAnnotationByGenomicLocationPOSTWithHttpInfo(parameters: {
        'genomicLocations': Array < GenomicLocation > ,
        'isoformOverrideSource' ? : string,
        'token' ? : string,
        'fields' ? : "annotation_summary" | "clinvar" | "hotspots" | "mutation_assessor" | "my_variant_info" | "nucleotide_context" | "oncokb" | "ptms" | "signal",
        $queryParameters ? : any,
        $domain ? : string
    }): Promise < request.Response > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        const errorHandlers = this.errorHandlers;
        const request = this.request;
        let path = '/annotation/genomic';
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

            if (parameters['isoformOverrideSource'] !== undefined) {
                queryParameters['isoformOverrideSource'] = parameters['isoformOverrideSource'];
            }

            if (parameters['token'] !== undefined) {
                queryParameters['token'] = parameters['token'];
            }

            if (parameters['fields'] !== undefined) {
                queryParameters['fields'] = parameters['fields'];
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
     * Retrieves VEP annotation for the provided list of genomic locations
     * @method
     * @name GenomeNexusAPI#fetchVariantAnnotationByGenomicLocationPOST
     * @param {} genomicLocations - List of Genomic Locations
     * @param {string} isoformOverrideSource - Isoform override source. For example uniprot
     * @param {string} token - Map of tokens. For example {"source1":"put-your-token1-here","source2":"put-your-token2-here"}
     * @param {array} fields - Comma separated list of fields to include in the annotation (case-sensitive!). Defaults to "annotation_summary" if no value passed. Valid values: {annotation_summary, clinvar, hotspots, mutation_assessor, my_variant_info, nucleotide_context, oncokb, ptms, signal}
     */
    fetchVariantAnnotationByGenomicLocationPOST(parameters: {
            'genomicLocations': Array < GenomicLocation > ,
            'isoformOverrideSource' ? : string,
            'token' ? : string,
            'fields' ? : "annotation_summary" | "clinvar" | "hotspots" | "mutation_assessor" | "my_variant_info" | "nucleotide_context" | "oncokb" | "ptms" | "signal",
            $queryParameters ? : any,
            $domain ? : string
        }): Promise < Array < VariantAnnotation >
        > {
            return this.fetchVariantAnnotationByGenomicLocationPOSTWithHttpInfo(parameters).then(function(response: request.Response) {
                return response.body;
            });
        };
    fetchVariantAnnotationByGenomicLocationGETURL(parameters: {
        'genomicLocation': string,
        'isoformOverrideSource' ? : string,
        'token' ? : string,
        'fields' ? : "annotation_summary" | "clinvar" | "hotspots" | "mutation_assessor" | "my_variant_info" | "nucleotide_context" | "oncokb" | "ptms" | "signal",
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/annotation/genomic/{genomicLocation}';

        path = path.replace('{genomicLocation}', parameters['genomicLocation'] + '');
        if (parameters['isoformOverrideSource'] !== undefined) {
            queryParameters['isoformOverrideSource'] = parameters['isoformOverrideSource'];
        }

        if (parameters['token'] !== undefined) {
            queryParameters['token'] = parameters['token'];
        }

        if (parameters['fields'] !== undefined) {
            queryParameters['fields'] = parameters['fields'];
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
     * Retrieves VEP annotation for the provided genomic location
     * @method
     * @name GenomeNexusAPI#fetchVariantAnnotationByGenomicLocationGET
     * @param {string} genomicLocation - A genomic location. For example 7,140453136,140453136,A,T
     * @param {string} isoformOverrideSource - Isoform override source. For example uniprot
     * @param {string} token - Map of tokens. For example {"source1":"put-your-token1-here","source2":"put-your-token2-here"}
     * @param {array} fields - Comma separated list of fields to include in the annotation (case-sensitive!). Defaults to "annotation_summary" if no value passed. Valid values: {annotation_summary, clinvar, hotspots, mutation_assessor, my_variant_info, nucleotide_context, oncokb, ptms, signal}
     */
    fetchVariantAnnotationByGenomicLocationGETWithHttpInfo(parameters: {
        'genomicLocation': string,
        'isoformOverrideSource' ? : string,
        'token' ? : string,
        'fields' ? : "annotation_summary" | "clinvar" | "hotspots" | "mutation_assessor" | "my_variant_info" | "nucleotide_context" | "oncokb" | "ptms" | "signal",
        $queryParameters ? : any,
        $domain ? : string
    }): Promise < request.Response > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        const errorHandlers = this.errorHandlers;
        const request = this.request;
        let path = '/annotation/genomic/{genomicLocation}';
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

            if (parameters['isoformOverrideSource'] !== undefined) {
                queryParameters['isoformOverrideSource'] = parameters['isoformOverrideSource'];
            }

            if (parameters['token'] !== undefined) {
                queryParameters['token'] = parameters['token'];
            }

            if (parameters['fields'] !== undefined) {
                queryParameters['fields'] = parameters['fields'];
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
     * Retrieves VEP annotation for the provided genomic location
     * @method
     * @name GenomeNexusAPI#fetchVariantAnnotationByGenomicLocationGET
     * @param {string} genomicLocation - A genomic location. For example 7,140453136,140453136,A,T
     * @param {string} isoformOverrideSource - Isoform override source. For example uniprot
     * @param {string} token - Map of tokens. For example {"source1":"put-your-token1-here","source2":"put-your-token2-here"}
     * @param {array} fields - Comma separated list of fields to include in the annotation (case-sensitive!). Defaults to "annotation_summary" if no value passed. Valid values: {annotation_summary, clinvar, hotspots, mutation_assessor, my_variant_info, nucleotide_context, oncokb, ptms, signal}
     */
    fetchVariantAnnotationByGenomicLocationGET(parameters: {
        'genomicLocation': string,
        'isoformOverrideSource' ? : string,
        'token' ? : string,
        'fields' ? : "annotation_summary" | "clinvar" | "hotspots" | "mutation_assessor" | "my_variant_info" | "nucleotide_context" | "oncokb" | "ptms" | "signal",
        $queryParameters ? : any,
        $domain ? : string
    }): Promise < VariantAnnotation > {
        return this.fetchVariantAnnotationByGenomicLocationGETWithHttpInfo(parameters).then(function(response: request.Response) {
            return response.body;
        });
    };
    fetchVariantAnnotationGETURL(parameters: {
        'variant': string,
        'isoformOverrideSource' ? : string,
        'token' ? : string,
        'fields' ? : "annotation_summary" | "clinvar" | "hotspots" | "mutation_assessor" | "my_variant_info" | "nucleotide_context" | "oncokb" | "ptms" | "signal",
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/annotation/{variant}';

        path = path.replace('{variant}', parameters['variant'] + '');
        if (parameters['isoformOverrideSource'] !== undefined) {
            queryParameters['isoformOverrideSource'] = parameters['isoformOverrideSource'];
        }

        if (parameters['token'] !== undefined) {
            queryParameters['token'] = parameters['token'];
        }

        if (parameters['fields'] !== undefined) {
            queryParameters['fields'] = parameters['fields'];
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
     * Retrieves VEP annotation for the provided variant
     * @method
     * @name GenomeNexusAPI#fetchVariantAnnotationGET
     * @param {string} variant - Variant. For example 17:g.41242962_41242963insGA
     * @param {string} isoformOverrideSource - Isoform override source. For example uniprot
     * @param {string} token - Map of tokens. For example {"source1":"put-your-token1-here","source2":"put-your-token2-here"}
     * @param {array} fields - Comma separated list of fields to include in the annotation (case-sensitive!). Defaults to "annotation_summary" if no value passed. Valid values: {annotation_summary, clinvar, hotspots, mutation_assessor, my_variant_info, nucleotide_context, oncokb, ptms, signal}
     */
    fetchVariantAnnotationGETWithHttpInfo(parameters: {
        'variant': string,
        'isoformOverrideSource' ? : string,
        'token' ? : string,
        'fields' ? : "annotation_summary" | "clinvar" | "hotspots" | "mutation_assessor" | "my_variant_info" | "nucleotide_context" | "oncokb" | "ptms" | "signal",
        $queryParameters ? : any,
        $domain ? : string
    }): Promise < request.Response > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        const errorHandlers = this.errorHandlers;
        const request = this.request;
        let path = '/annotation/{variant}';
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

            if (parameters['token'] !== undefined) {
                queryParameters['token'] = parameters['token'];
            }

            if (parameters['fields'] !== undefined) {
                queryParameters['fields'] = parameters['fields'];
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
     * Retrieves VEP annotation for the provided variant
     * @method
     * @name GenomeNexusAPI#fetchVariantAnnotationGET
     * @param {string} variant - Variant. For example 17:g.41242962_41242963insGA
     * @param {string} isoformOverrideSource - Isoform override source. For example uniprot
     * @param {string} token - Map of tokens. For example {"source1":"put-your-token1-here","source2":"put-your-token2-here"}
     * @param {array} fields - Comma separated list of fields to include in the annotation (case-sensitive!). Defaults to "annotation_summary" if no value passed. Valid values: {annotation_summary, clinvar, hotspots, mutation_assessor, my_variant_info, nucleotide_context, oncokb, ptms, signal}
     */
    fetchVariantAnnotationGET(parameters: {
        'variant': string,
        'isoformOverrideSource' ? : string,
        'token' ? : string,
        'fields' ? : "annotation_summary" | "clinvar" | "hotspots" | "mutation_assessor" | "my_variant_info" | "nucleotide_context" | "oncokb" | "ptms" | "signal",
        $queryParameters ? : any,
        $domain ? : string
    }): Promise < VariantAnnotation > {
        return this.fetchVariantAnnotationGETWithHttpInfo(parameters).then(function(response: request.Response) {
            return response.body;
        });
    };
    fetchCanonicalEnsemblGeneIdByEntrezGeneIdsPOSTURL(parameters: {
        'entrezGeneIds': Array < string > ,
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/ensembl/canonical-gene/entrez';

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
     * Retrieves canonical Ensembl Gene ID by Entrez Gene Ids
     * @method
     * @name GenomeNexusAPI#fetchCanonicalEnsemblGeneIdByEntrezGeneIdsPOST
     * @param {} entrezGeneIds - List of Entrez Gene Ids. For example ["23140","26009","100131879"]
     */
    fetchCanonicalEnsemblGeneIdByEntrezGeneIdsPOSTWithHttpInfo(parameters: {
        'entrezGeneIds': Array < string > ,
        $queryParameters ? : any,
        $domain ? : string
    }): Promise < request.Response > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        const errorHandlers = this.errorHandlers;
        const request = this.request;
        let path = '/ensembl/canonical-gene/entrez';
        let body: any;
        let queryParameters: any = {};
        let headers: any = {};
        let form: any = {};
        return new Promise(function(resolve, reject) {
            headers['Accept'] = 'application/json';
            headers['Content-Type'] = 'application/json';

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
     * Retrieves canonical Ensembl Gene ID by Entrez Gene Ids
     * @method
     * @name GenomeNexusAPI#fetchCanonicalEnsemblGeneIdByEntrezGeneIdsPOST
     * @param {} entrezGeneIds - List of Entrez Gene Ids. For example ["23140","26009","100131879"]
     */
    fetchCanonicalEnsemblGeneIdByEntrezGeneIdsPOST(parameters: {
            'entrezGeneIds': Array < string > ,
            $queryParameters ? : any,
            $domain ? : string
        }): Promise < Array < EnsemblGene >
        > {
            return this.fetchCanonicalEnsemblGeneIdByEntrezGeneIdsPOSTWithHttpInfo(parameters).then(function(response: request.Response) {
                return response.body;
            });
        };
    fetchCanonicalEnsemblGeneIdByEntrezGeneIdGETURL(parameters: {
        'entrezGeneId': string,
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/ensembl/canonical-gene/entrez/{entrezGeneId}';

        path = path.replace('{entrezGeneId}', parameters['entrezGeneId'] + '');

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
     * Retrieves Ensembl canonical gene id by Entrez Gene Id
     * @method
     * @name GenomeNexusAPI#fetchCanonicalEnsemblGeneIdByEntrezGeneIdGET
     * @param {string} entrezGeneId - An Entrez Gene Id. For example 23140
     */
    fetchCanonicalEnsemblGeneIdByEntrezGeneIdGETWithHttpInfo(parameters: {
        'entrezGeneId': string,
        $queryParameters ? : any,
        $domain ? : string
    }): Promise < request.Response > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        const errorHandlers = this.errorHandlers;
        const request = this.request;
        let path = '/ensembl/canonical-gene/entrez/{entrezGeneId}';
        let body: any;
        let queryParameters: any = {};
        let headers: any = {};
        let form: any = {};
        return new Promise(function(resolve, reject) {
            headers['Accept'] = 'application/json';
            headers['Content-Type'] = 'application/json';

            path = path.replace('{entrezGeneId}', parameters['entrezGeneId'] + '');

            if (parameters['entrezGeneId'] === undefined) {
                reject(new Error('Missing required  parameter: entrezGeneId'));
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
     * Retrieves Ensembl canonical gene id by Entrez Gene Id
     * @method
     * @name GenomeNexusAPI#fetchCanonicalEnsemblGeneIdByEntrezGeneIdGET
     * @param {string} entrezGeneId - An Entrez Gene Id. For example 23140
     */
    fetchCanonicalEnsemblGeneIdByEntrezGeneIdGET(parameters: {
        'entrezGeneId': string,
        $queryParameters ? : any,
        $domain ? : string
    }): Promise < EnsemblGene > {
        return this.fetchCanonicalEnsemblGeneIdByEntrezGeneIdGETWithHttpInfo(parameters).then(function(response: request.Response) {
            return response.body;
        });
    };
    fetchCanonicalEnsemblGeneIdByHugoSymbolsPOSTURL(parameters: {
        'hugoSymbols': Array < string > ,
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/ensembl/canonical-gene/hgnc';

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
     * Retrieves canonical Ensembl Gene ID by Hugo Symbols
     * @method
     * @name GenomeNexusAPI#fetchCanonicalEnsemblGeneIdByHugoSymbolsPOST
     * @param {} hugoSymbols - List of Hugo Symbols. For example ["TP53","PIK3CA","BRCA1"]
     */
    fetchCanonicalEnsemblGeneIdByHugoSymbolsPOSTWithHttpInfo(parameters: {
        'hugoSymbols': Array < string > ,
        $queryParameters ? : any,
        $domain ? : string
    }): Promise < request.Response > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        const errorHandlers = this.errorHandlers;
        const request = this.request;
        let path = '/ensembl/canonical-gene/hgnc';
        let body: any;
        let queryParameters: any = {};
        let headers: any = {};
        let form: any = {};
        return new Promise(function(resolve, reject) {
            headers['Accept'] = 'application/json';
            headers['Content-Type'] = 'application/json';

            if (parameters['hugoSymbols'] !== undefined) {
                body = parameters['hugoSymbols'];
            }

            if (parameters['hugoSymbols'] === undefined) {
                reject(new Error('Missing required  parameter: hugoSymbols'));
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
     * Retrieves canonical Ensembl Gene ID by Hugo Symbols
     * @method
     * @name GenomeNexusAPI#fetchCanonicalEnsemblGeneIdByHugoSymbolsPOST
     * @param {} hugoSymbols - List of Hugo Symbols. For example ["TP53","PIK3CA","BRCA1"]
     */
    fetchCanonicalEnsemblGeneIdByHugoSymbolsPOST(parameters: {
            'hugoSymbols': Array < string > ,
            $queryParameters ? : any,
            $domain ? : string
        }): Promise < Array < EnsemblGene >
        > {
            return this.fetchCanonicalEnsemblGeneIdByHugoSymbolsPOSTWithHttpInfo(parameters).then(function(response: request.Response) {
                return response.body;
            });
        };
    fetchCanonicalEnsemblGeneIdByHugoSymbolGETURL(parameters: {
        'hugoSymbol': string,
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/ensembl/canonical-gene/hgnc/{hugoSymbol}';

        path = path.replace('{hugoSymbol}', parameters['hugoSymbol'] + '');

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
     * Retrieves Ensembl canonical gene id by Hugo Symbol
     * @method
     * @name GenomeNexusAPI#fetchCanonicalEnsemblGeneIdByHugoSymbolGET
     * @param {string} hugoSymbol - A Hugo Symbol. For example TP53
     */
    fetchCanonicalEnsemblGeneIdByHugoSymbolGETWithHttpInfo(parameters: {
        'hugoSymbol': string,
        $queryParameters ? : any,
        $domain ? : string
    }): Promise < request.Response > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        const errorHandlers = this.errorHandlers;
        const request = this.request;
        let path = '/ensembl/canonical-gene/hgnc/{hugoSymbol}';
        let body: any;
        let queryParameters: any = {};
        let headers: any = {};
        let form: any = {};
        return new Promise(function(resolve, reject) {
            headers['Accept'] = 'application/json';
            headers['Content-Type'] = 'application/json';

            path = path.replace('{hugoSymbol}', parameters['hugoSymbol'] + '');

            if (parameters['hugoSymbol'] === undefined) {
                reject(new Error('Missing required  parameter: hugoSymbol'));
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
     * Retrieves Ensembl canonical gene id by Hugo Symbol
     * @method
     * @name GenomeNexusAPI#fetchCanonicalEnsemblGeneIdByHugoSymbolGET
     * @param {string} hugoSymbol - A Hugo Symbol. For example TP53
     */
    fetchCanonicalEnsemblGeneIdByHugoSymbolGET(parameters: {
        'hugoSymbol': string,
        $queryParameters ? : any,
        $domain ? : string
    }): Promise < EnsemblGene > {
        return this.fetchCanonicalEnsemblGeneIdByHugoSymbolGETWithHttpInfo(parameters).then(function(response: request.Response) {
            return response.body;
        });
    };
    fetchCanonicalEnsemblTranscriptsByHugoSymbolsPOSTURL(parameters: {
        'hugoSymbols': Array < string > ,
        'isoformOverrideSource' ? : string,
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/ensembl/canonical-transcript/hgnc';

        if (parameters['isoformOverrideSource'] !== undefined) {
            queryParameters['isoformOverrideSource'] = parameters['isoformOverrideSource'];
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
     * Retrieves Ensembl canonical transcripts by Hugo Symbols
     * @method
     * @name GenomeNexusAPI#fetchCanonicalEnsemblTranscriptsByHugoSymbolsPOST
     * @param {} hugoSymbols - List of Hugo Symbols. For example ["TP53","PIK3CA","BRCA1"]
     * @param {string} isoformOverrideSource - Isoform override source. For example uniprot
     */
    fetchCanonicalEnsemblTranscriptsByHugoSymbolsPOSTWithHttpInfo(parameters: {
        'hugoSymbols': Array < string > ,
        'isoformOverrideSource' ? : string,
        $queryParameters ? : any,
        $domain ? : string
    }): Promise < request.Response > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        const errorHandlers = this.errorHandlers;
        const request = this.request;
        let path = '/ensembl/canonical-transcript/hgnc';
        let body: any;
        let queryParameters: any = {};
        let headers: any = {};
        let form: any = {};
        return new Promise(function(resolve, reject) {
            headers['Accept'] = 'application/json';
            headers['Content-Type'] = 'application/json';

            if (parameters['hugoSymbols'] !== undefined) {
                body = parameters['hugoSymbols'];
            }

            if (parameters['hugoSymbols'] === undefined) {
                reject(new Error('Missing required  parameter: hugoSymbols'));
                return;
            }

            if (parameters['isoformOverrideSource'] !== undefined) {
                queryParameters['isoformOverrideSource'] = parameters['isoformOverrideSource'];
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
     * Retrieves Ensembl canonical transcripts by Hugo Symbols
     * @method
     * @name GenomeNexusAPI#fetchCanonicalEnsemblTranscriptsByHugoSymbolsPOST
     * @param {} hugoSymbols - List of Hugo Symbols. For example ["TP53","PIK3CA","BRCA1"]
     * @param {string} isoformOverrideSource - Isoform override source. For example uniprot
     */
    fetchCanonicalEnsemblTranscriptsByHugoSymbolsPOST(parameters: {
            'hugoSymbols': Array < string > ,
            'isoformOverrideSource' ? : string,
            $queryParameters ? : any,
            $domain ? : string
        }): Promise < Array < EnsemblTranscript >
        > {
            return this.fetchCanonicalEnsemblTranscriptsByHugoSymbolsPOSTWithHttpInfo(parameters).then(function(response: request.Response) {
                return response.body;
            });
        };
    fetchCanonicalEnsemblTranscriptByHugoSymbolGETURL(parameters: {
        'hugoSymbol': string,
        'isoformOverrideSource' ? : string,
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/ensembl/canonical-transcript/hgnc/{hugoSymbol}';

        path = path.replace('{hugoSymbol}', parameters['hugoSymbol'] + '');
        if (parameters['isoformOverrideSource'] !== undefined) {
            queryParameters['isoformOverrideSource'] = parameters['isoformOverrideSource'];
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
     * Retrieves Ensembl canonical transcript by Hugo Symbol
     * @method
     * @name GenomeNexusAPI#fetchCanonicalEnsemblTranscriptByHugoSymbolGET
     * @param {string} hugoSymbol - A Hugo Symbol. For example TP53
     * @param {string} isoformOverrideSource - Isoform override source. For example uniprot
     */
    fetchCanonicalEnsemblTranscriptByHugoSymbolGETWithHttpInfo(parameters: {
        'hugoSymbol': string,
        'isoformOverrideSource' ? : string,
        $queryParameters ? : any,
        $domain ? : string
    }): Promise < request.Response > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        const errorHandlers = this.errorHandlers;
        const request = this.request;
        let path = '/ensembl/canonical-transcript/hgnc/{hugoSymbol}';
        let body: any;
        let queryParameters: any = {};
        let headers: any = {};
        let form: any = {};
        return new Promise(function(resolve, reject) {
            headers['Accept'] = 'application/json';
            headers['Content-Type'] = 'application/json';

            path = path.replace('{hugoSymbol}', parameters['hugoSymbol'] + '');

            if (parameters['hugoSymbol'] === undefined) {
                reject(new Error('Missing required  parameter: hugoSymbol'));
                return;
            }

            if (parameters['isoformOverrideSource'] !== undefined) {
                queryParameters['isoformOverrideSource'] = parameters['isoformOverrideSource'];
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
     * Retrieves Ensembl canonical transcript by Hugo Symbol
     * @method
     * @name GenomeNexusAPI#fetchCanonicalEnsemblTranscriptByHugoSymbolGET
     * @param {string} hugoSymbol - A Hugo Symbol. For example TP53
     * @param {string} isoformOverrideSource - Isoform override source. For example uniprot
     */
    fetchCanonicalEnsemblTranscriptByHugoSymbolGET(parameters: {
        'hugoSymbol': string,
        'isoformOverrideSource' ? : string,
        $queryParameters ? : any,
        $domain ? : string
    }): Promise < EnsemblTranscript > {
        return this.fetchCanonicalEnsemblTranscriptByHugoSymbolGETWithHttpInfo(parameters).then(function(response: request.Response) {
            return response.body;
        });
    };
    fetchEnsemblTranscriptsGETURL(parameters: {
        'geneId' ? : string,
        'proteinId' ? : string,
        'hugoSymbol' ? : string,
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/ensembl/transcript';
        if (parameters['geneId'] !== undefined) {
            queryParameters['geneId'] = parameters['geneId'];
        }

        if (parameters['proteinId'] !== undefined) {
            queryParameters['proteinId'] = parameters['proteinId'];
        }

        if (parameters['hugoSymbol'] !== undefined) {
            queryParameters['hugoSymbol'] = parameters['hugoSymbol'];
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
     * Retrieves Ensembl Transcripts by protein ID, and gene ID. Retrieves all transcripts in case no query parameter provided
     * @method
     * @name GenomeNexusAPI#fetchEnsemblTranscriptsGET
     * @param {string} geneId - An Ensembl gene ID. For example ENSG00000136999
     * @param {string} proteinId - An Ensembl protein ID. For example ENSP00000439985
     * @param {string} hugoSymbol - A Hugo Symbol For example ARF5
     */
    fetchEnsemblTranscriptsGETWithHttpInfo(parameters: {
        'geneId' ? : string,
        'proteinId' ? : string,
        'hugoSymbol' ? : string,
        $queryParameters ? : any,
            $domain ? : string
    }): Promise < request.Response > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        const errorHandlers = this.errorHandlers;
        const request = this.request;
        let path = '/ensembl/transcript';
        let body: any;
        let queryParameters: any = {};
        let headers: any = {};
        let form: any = {};
        return new Promise(function(resolve, reject) {
            headers['Accept'] = 'application/json';
            headers['Content-Type'] = 'application/json';

            if (parameters['geneId'] !== undefined) {
                queryParameters['geneId'] = parameters['geneId'];
            }

            if (parameters['proteinId'] !== undefined) {
                queryParameters['proteinId'] = parameters['proteinId'];
            }

            if (parameters['hugoSymbol'] !== undefined) {
                queryParameters['hugoSymbol'] = parameters['hugoSymbol'];
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
     * Retrieves Ensembl Transcripts by protein ID, and gene ID. Retrieves all transcripts in case no query parameter provided
     * @method
     * @name GenomeNexusAPI#fetchEnsemblTranscriptsGET
     * @param {string} geneId - An Ensembl gene ID. For example ENSG00000136999
     * @param {string} proteinId - An Ensembl protein ID. For example ENSP00000439985
     * @param {string} hugoSymbol - A Hugo Symbol For example ARF5
     */
    fetchEnsemblTranscriptsGET(parameters: {
            'geneId' ? : string,
            'proteinId' ? : string,
            'hugoSymbol' ? : string,
            $queryParameters ? : any,
                $domain ? : string
        }): Promise < Array < EnsemblTranscript >
        > {
            return this.fetchEnsemblTranscriptsGETWithHttpInfo(parameters).then(function(response: request.Response) {
                return response.body;
            });
        };
    fetchEnsemblTranscriptsByEnsemblFilterPOSTURL(parameters: {
        'ensemblFilter': EnsemblFilter,
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/ensembl/transcript';

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
     * Retrieves Ensembl Transcripts by Ensembl transcript IDs, hugo Symbols, protein IDs, or gene IDs
     * @method
     * @name GenomeNexusAPI#fetchEnsemblTranscriptsByEnsemblFilterPOST
     * @param {} ensemblFilter - List of Ensembl transcript IDs. For example ["ENST00000361390", "ENST00000361453", "ENST00000361624"]<br>OR<br>List of Hugo Symbols. For example ["TP53", "PIK3CA", "BRCA1"]<br>OR<br>List of Ensembl protein IDs. For example ["ENSP00000439985", "ENSP00000478460", "ENSP00000346196"]<br>OR<br>List of Ensembl gene IDs. For example ["ENSG00000136999", "ENSG00000272398", "ENSG00000198695"]
     */
    fetchEnsemblTranscriptsByEnsemblFilterPOSTWithHttpInfo(parameters: {
        'ensemblFilter': EnsemblFilter,
        $queryParameters ? : any,
        $domain ? : string
    }): Promise < request.Response > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        const errorHandlers = this.errorHandlers;
        const request = this.request;
        let path = '/ensembl/transcript';
        let body: any;
        let queryParameters: any = {};
        let headers: any = {};
        let form: any = {};
        return new Promise(function(resolve, reject) {
            headers['Accept'] = 'application/json';
            headers['Content-Type'] = 'application/json';

            if (parameters['ensemblFilter'] !== undefined) {
                body = parameters['ensemblFilter'];
            }

            if (parameters['ensemblFilter'] === undefined) {
                reject(new Error('Missing required  parameter: ensemblFilter'));
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
     * Retrieves Ensembl Transcripts by Ensembl transcript IDs, hugo Symbols, protein IDs, or gene IDs
     * @method
     * @name GenomeNexusAPI#fetchEnsemblTranscriptsByEnsemblFilterPOST
     * @param {} ensemblFilter - List of Ensembl transcript IDs. For example ["ENST00000361390", "ENST00000361453", "ENST00000361624"]<br>OR<br>List of Hugo Symbols. For example ["TP53", "PIK3CA", "BRCA1"]<br>OR<br>List of Ensembl protein IDs. For example ["ENSP00000439985", "ENSP00000478460", "ENSP00000346196"]<br>OR<br>List of Ensembl gene IDs. For example ["ENSG00000136999", "ENSG00000272398", "ENSG00000198695"]
     */
    fetchEnsemblTranscriptsByEnsemblFilterPOST(parameters: {
            'ensemblFilter': EnsemblFilter,
            $queryParameters ? : any,
            $domain ? : string
        }): Promise < Array < EnsemblTranscript >
        > {
            return this.fetchEnsemblTranscriptsByEnsemblFilterPOSTWithHttpInfo(parameters).then(function(response: request.Response) {
                return response.body;
            });
        };
    fetchEnsemblTranscriptByTranscriptIdGETURL(parameters: {
        'transcriptId': string,
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/ensembl/transcript/{transcriptId}';

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
     * Retrieves the transcript by an Ensembl transcript ID
     * @method
     * @name GenomeNexusAPI#fetchEnsemblTranscriptByTranscriptIdGET
     * @param {string} transcriptId - An Ensembl transcript ID. For example ENST00000361390
     */
    fetchEnsemblTranscriptByTranscriptIdGETWithHttpInfo(parameters: {
        'transcriptId': string,
        $queryParameters ? : any,
        $domain ? : string
    }): Promise < request.Response > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        const errorHandlers = this.errorHandlers;
        const request = this.request;
        let path = '/ensembl/transcript/{transcriptId}';
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
     * Retrieves the transcript by an Ensembl transcript ID
     * @method
     * @name GenomeNexusAPI#fetchEnsemblTranscriptByTranscriptIdGET
     * @param {string} transcriptId - An Ensembl transcript ID. For example ENST00000361390
     */
    fetchEnsemblTranscriptByTranscriptIdGET(parameters: {
        'transcriptId': string,
        $queryParameters ? : any,
        $domain ? : string
    }): Promise < EnsemblTranscript > {
        return this.fetchEnsemblTranscriptByTranscriptIdGETWithHttpInfo(parameters).then(function(response: request.Response) {
            return response.body;
        });
    };
    fetchGeneXrefsGETURL(parameters: {
        'accession': string,
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/ensembl/xrefs';
        if (parameters['accession'] !== undefined) {
            queryParameters['accession'] = parameters['accession'];
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
     * Perform lookups of Ensembl identifiers and retrieve their external references in other databases
     * @method
     * @name GenomeNexusAPI#fetchGeneXrefsGET
     * @param {string} accession - Ensembl gene accession. For example ENSG00000169083
     */
    fetchGeneXrefsGETWithHttpInfo(parameters: {
        'accession': string,
        $queryParameters ? : any,
        $domain ? : string
    }): Promise < request.Response > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        const errorHandlers = this.errorHandlers;
        const request = this.request;
        let path = '/ensembl/xrefs';
        let body: any;
        let queryParameters: any = {};
        let headers: any = {};
        let form: any = {};
        return new Promise(function(resolve, reject) {
            headers['Accept'] = 'application/json';
            headers['Content-Type'] = 'application/json';

            if (parameters['accession'] !== undefined) {
                queryParameters['accession'] = parameters['accession'];
            }

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
     * @name GenomeNexusAPI#fetchGeneXrefsGET
     * @param {string} accession - Ensembl gene accession. For example ENSG00000169083
     */
    fetchGeneXrefsGET(parameters: {
            'accession': string,
            $queryParameters ? : any,
            $domain ? : string
        }): Promise < Array < GeneXref >
        > {
            return this.fetchGeneXrefsGETWithHttpInfo(parameters).then(function(response: request.Response) {
                return response.body;
            });
        };
    fetchPdbHeaderPOSTURL(parameters: {
        'pdbIds': Array < string > ,
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/pdb/header';

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
     * Retrieves PDB header info by a PDB id
     * @method
     * @name GenomeNexusAPI#fetchPdbHeaderPOST
     * @param {} pdbIds - List of pdb ids, for example ["1a37","1a4o"]
     */
    fetchPdbHeaderPOSTWithHttpInfo(parameters: {
        'pdbIds': Array < string > ,
        $queryParameters ? : any,
        $domain ? : string
    }): Promise < request.Response > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        const errorHandlers = this.errorHandlers;
        const request = this.request;
        let path = '/pdb/header';
        let body: any;
        let queryParameters: any = {};
        let headers: any = {};
        let form: any = {};
        return new Promise(function(resolve, reject) {
            headers['Accept'] = 'application/json';
            headers['Content-Type'] = 'application/json';

            if (parameters['pdbIds'] !== undefined) {
                body = parameters['pdbIds'];
            }

            if (parameters['pdbIds'] === undefined) {
                reject(new Error('Missing required  parameter: pdbIds'));
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
     * Retrieves PDB header info by a PDB id
     * @method
     * @name GenomeNexusAPI#fetchPdbHeaderPOST
     * @param {} pdbIds - List of pdb ids, for example ["1a37","1a4o"]
     */
    fetchPdbHeaderPOST(parameters: {
            'pdbIds': Array < string > ,
            $queryParameters ? : any,
            $domain ? : string
        }): Promise < Array < PdbHeader >
        > {
            return this.fetchPdbHeaderPOSTWithHttpInfo(parameters).then(function(response: request.Response) {
                return response.body;
            });
        };
    fetchPdbHeaderGETURL(parameters: {
        'pdbId': string,
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/pdb/header/{pdbId}';

        path = path.replace('{pdbId}', parameters['pdbId'] + '');

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
     * Retrieves PDB header info by a PDB id
     * @method
     * @name GenomeNexusAPI#fetchPdbHeaderGET
     * @param {string} pdbId - PDB id, for example 1a37
     */
    fetchPdbHeaderGETWithHttpInfo(parameters: {
        'pdbId': string,
        $queryParameters ? : any,
        $domain ? : string
    }): Promise < request.Response > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        const errorHandlers = this.errorHandlers;
        const request = this.request;
        let path = '/pdb/header/{pdbId}';
        let body: any;
        let queryParameters: any = {};
        let headers: any = {};
        let form: any = {};
        return new Promise(function(resolve, reject) {
            headers['Accept'] = 'application/json';
            headers['Content-Type'] = 'application/json';

            path = path.replace('{pdbId}', parameters['pdbId'] + '');

            if (parameters['pdbId'] === undefined) {
                reject(new Error('Missing required  parameter: pdbId'));
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
     * Retrieves PDB header info by a PDB id
     * @method
     * @name GenomeNexusAPI#fetchPdbHeaderGET
     * @param {string} pdbId - PDB id, for example 1a37
     */
    fetchPdbHeaderGET(parameters: {
        'pdbId': string,
        $queryParameters ? : any,
        $domain ? : string
    }): Promise < PdbHeader > {
        return this.fetchPdbHeaderGETWithHttpInfo(parameters).then(function(response: request.Response) {
            return response.body;
        });
    };
    fetchPfamDomainsByPfamAccessionPOSTURL(parameters: {
        'pfamAccessions': Array < string > ,
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/pfam/domain';

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
     * Retrieves PFAM domains by PFAM domain accession IDs
     * @method
     * @name GenomeNexusAPI#fetchPfamDomainsByPfamAccessionPOST
     * @param {} pfamAccessions - List of PFAM domain accession IDs. For example ["PF02827","PF00093","PF15276"]
     */
    fetchPfamDomainsByPfamAccessionPOSTWithHttpInfo(parameters: {
        'pfamAccessions': Array < string > ,
        $queryParameters ? : any,
        $domain ? : string
    }): Promise < request.Response > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        const errorHandlers = this.errorHandlers;
        const request = this.request;
        let path = '/pfam/domain';
        let body: any;
        let queryParameters: any = {};
        let headers: any = {};
        let form: any = {};
        return new Promise(function(resolve, reject) {
            headers['Accept'] = 'application/json';
            headers['Content-Type'] = 'application/json';

            if (parameters['pfamAccessions'] !== undefined) {
                body = parameters['pfamAccessions'];
            }

            if (parameters['pfamAccessions'] === undefined) {
                reject(new Error('Missing required  parameter: pfamAccessions'));
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
     * Retrieves PFAM domains by PFAM domain accession IDs
     * @method
     * @name GenomeNexusAPI#fetchPfamDomainsByPfamAccessionPOST
     * @param {} pfamAccessions - List of PFAM domain accession IDs. For example ["PF02827","PF00093","PF15276"]
     */
    fetchPfamDomainsByPfamAccessionPOST(parameters: {
            'pfamAccessions': Array < string > ,
            $queryParameters ? : any,
            $domain ? : string
        }): Promise < Array < PfamDomain >
        > {
            return this.fetchPfamDomainsByPfamAccessionPOSTWithHttpInfo(parameters).then(function(response: request.Response) {
                return response.body;
            });
        };
    fetchPfamDomainsByAccessionGETURL(parameters: {
        'pfamAccession': string,
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/pfam/domain/{pfamAccession}';

        path = path.replace('{pfamAccession}', parameters['pfamAccession'] + '');

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
     * Retrieves a PFAM domain by a PFAM domain ID
     * @method
     * @name GenomeNexusAPI#fetchPfamDomainsByAccessionGET
     * @param {string} pfamAccession - A PFAM domain accession ID. For example PF02827
     */
    fetchPfamDomainsByAccessionGETWithHttpInfo(parameters: {
        'pfamAccession': string,
        $queryParameters ? : any,
        $domain ? : string
    }): Promise < request.Response > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        const errorHandlers = this.errorHandlers;
        const request = this.request;
        let path = '/pfam/domain/{pfamAccession}';
        let body: any;
        let queryParameters: any = {};
        let headers: any = {};
        let form: any = {};
        return new Promise(function(resolve, reject) {
            headers['Accept'] = 'application/json';
            headers['Content-Type'] = 'application/json';

            path = path.replace('{pfamAccession}', parameters['pfamAccession'] + '');

            if (parameters['pfamAccession'] === undefined) {
                reject(new Error('Missing required  parameter: pfamAccession'));
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
     * Retrieves a PFAM domain by a PFAM domain ID
     * @method
     * @name GenomeNexusAPI#fetchPfamDomainsByAccessionGET
     * @param {string} pfamAccession - A PFAM domain accession ID. For example PF02827
     */
    fetchPfamDomainsByAccessionGET(parameters: {
        'pfamAccession': string,
        $queryParameters ? : any,
        $domain ? : string
    }): Promise < PfamDomain > {
        return this.fetchPfamDomainsByAccessionGETWithHttpInfo(parameters).then(function(response: request.Response) {
            return response.body;
        });
    };
    fetchPostTranslationalModificationsGETURL(parameters: {
        'ensemblTranscriptId' ? : string,
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/ptm/experimental';
        if (parameters['ensemblTranscriptId'] !== undefined) {
            queryParameters['ensemblTranscriptId'] = parameters['ensemblTranscriptId'];
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
     * Retrieves PTM entries by Ensembl Transcript ID
     * @method
     * @name GenomeNexusAPI#fetchPostTranslationalModificationsGET
     * @param {string} ensemblTranscriptId - Ensembl Transcript ID. For example ENST00000646891
     */
    fetchPostTranslationalModificationsGETWithHttpInfo(parameters: {
        'ensemblTranscriptId' ? : string,
        $queryParameters ? : any,
            $domain ? : string
    }): Promise < request.Response > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        const errorHandlers = this.errorHandlers;
        const request = this.request;
        let path = '/ptm/experimental';
        let body: any;
        let queryParameters: any = {};
        let headers: any = {};
        let form: any = {};
        return new Promise(function(resolve, reject) {
            headers['Accept'] = 'application/json';
            headers['Content-Type'] = 'application/json';

            if (parameters['ensemblTranscriptId'] !== undefined) {
                queryParameters['ensemblTranscriptId'] = parameters['ensemblTranscriptId'];
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
     * Retrieves PTM entries by Ensembl Transcript ID
     * @method
     * @name GenomeNexusAPI#fetchPostTranslationalModificationsGET
     * @param {string} ensemblTranscriptId - Ensembl Transcript ID. For example ENST00000646891
     */
    fetchPostTranslationalModificationsGET(parameters: {
            'ensemblTranscriptId' ? : string,
            $queryParameters ? : any,
                $domain ? : string
        }): Promise < Array < PostTranslationalModification >
        > {
            return this.fetchPostTranslationalModificationsGETWithHttpInfo(parameters).then(function(response: request.Response) {
                return response.body;
            });
        };
    fetchPostTranslationalModificationsByPtmFilterPOSTURL(parameters: {
        'ptmFilter': PtmFilter,
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/ptm/experimental';

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
     * Retrieves PTM entries by Ensembl Transcript IDs
     * @method
     * @name GenomeNexusAPI#fetchPostTranslationalModificationsByPtmFilterPOST
     * @param {} ptmFilter - List of Ensembl transcript IDs. For example ["ENST00000420316", "ENST00000646891", "ENST00000371953"]
     */
    fetchPostTranslationalModificationsByPtmFilterPOSTWithHttpInfo(parameters: {
        'ptmFilter': PtmFilter,
        $queryParameters ? : any,
        $domain ? : string
    }): Promise < request.Response > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        const errorHandlers = this.errorHandlers;
        const request = this.request;
        let path = '/ptm/experimental';
        let body: any;
        let queryParameters: any = {};
        let headers: any = {};
        let form: any = {};
        return new Promise(function(resolve, reject) {
            headers['Accept'] = 'application/json';
            headers['Content-Type'] = 'application/json';

            if (parameters['ptmFilter'] !== undefined) {
                body = parameters['ptmFilter'];
            }

            if (parameters['ptmFilter'] === undefined) {
                reject(new Error('Missing required  parameter: ptmFilter'));
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
     * Retrieves PTM entries by Ensembl Transcript IDs
     * @method
     * @name GenomeNexusAPI#fetchPostTranslationalModificationsByPtmFilterPOST
     * @param {} ptmFilter - List of Ensembl transcript IDs. For example ["ENST00000420316", "ENST00000646891", "ENST00000371953"]
     */
    fetchPostTranslationalModificationsByPtmFilterPOST(parameters: {
            'ptmFilter': PtmFilter,
            $queryParameters ? : any,
            $domain ? : string
        }): Promise < Array < PostTranslationalModification >
        > {
            return this.fetchPostTranslationalModificationsByPtmFilterPOSTWithHttpInfo(parameters).then(function(response: request.Response) {
                return response.body;
            });
        };
    fetchVersionGETURL(parameters: {
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/version';

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
     * Retrieve Genome Nexus Version
     * @method
     * @name GenomeNexusAPI#fetchVersionGET
     */
    fetchVersionGETWithHttpInfo(parameters: {
        $queryParameters ? : any,
            $domain ? : string
    }): Promise < request.Response > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        const errorHandlers = this.errorHandlers;
        const request = this.request;
        let path = '/version';
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
     * Retrieve Genome Nexus Version
     * @method
     * @name GenomeNexusAPI#fetchVersionGET
     */
    fetchVersionGET(parameters: {
        $queryParameters ? : any,
            $domain ? : string
    }): Promise < AggregateSourceInfo > {
        return this.fetchVersionGETWithHttpInfo(parameters).then(function(response: request.Response) {
            return response.body;
        });
    };
}