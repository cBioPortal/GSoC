import { Gene, Geneset } from 'cbioportal-ts-api-client';
import { GeneticEntityType } from 'pages/resultsView/ResultsViewPageStore';

export type GeneticEntity = {
    geneticEntityName: string; // hugo gene symbol for gene, gene set name for geneset
    geneticEntityType: GeneticEntityType;
    geneticEntityId: string | number; //entrezGeneId (number) for "gene", genesetId (string) for "geneset"
    cytoband: string; //will be "" for "geneset"
    geneticEntityData: Gene | Geneset;
};
