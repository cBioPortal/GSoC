import { GenomeNexusAPI } from 'genome-nexus-ts-api-client';
import { OncoKbAPI } from 'oncokb-ts-api-client';

export const DEFAULT_GENOME_NEXUS_DOMAIN = 'https://www.genomenexus.org/';
const genomeNexusInternalClient = new GenomeNexusAPI(
    DEFAULT_GENOME_NEXUS_DOMAIN
);

export function getGenomeNexusClient() {
    return genomeNexusInternalClient;
}

// TODO This is not a good way
export const DEFAULT_ONCOKB_DOMAIN =
    'https://www.cbioportal.org/proxy/A8F74CD7851BDEE8DCD2E86AB4E2A711';
const oncokbClient = new OncoKbAPI(DEFAULT_ONCOKB_DOMAIN);

export function getOncokbClient() {
    return oncokbClient;
}
