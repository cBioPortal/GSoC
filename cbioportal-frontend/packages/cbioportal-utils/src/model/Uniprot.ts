// Temporary model for Uniprot data
// Ideally we should be generating these from Genome Nexus API

export interface UniprotFeatureList {
    accession: string; // "P04637"
    entryName: string; // "P53_HUMAN"
    sequence: string; // "MEEPQSDPSVEPPLSQETFSDLWKLLPENNVLSPLPSQAMDDLMLSPDDIEQWFTEDPGPDEAPRMPEAAPPVAPAPAAPTPAAPAPAPSWPLSSSVPSQKTYQGSYGFRLGFLHSGTAKSVTCTYSPALNKMFCQLAKTCPVQLWVDSTPPPGTRVRAMAIYKQSQHMTEVVRRCPHHERCSDSDGLAPPQHLIRVEGNLRVEYLDDRNTFRHSVVVPYEPPEVGSDCTTIHYNYMCNSSCMGGMNRRPILTIITLEDSSGNLLGRNSFEVRVCACPGRDRRTEEENLRKKGEPHHELPPGSTKRALPNNTSSSPQPKKKPLDGEYFTLQIRGRERFEMFRELNEALELKDAQAGKEPGGSRAHSSHLKSKKGQSTSRHKKLMFKTEGPDSD"
    sequenceChecksum: string; // "AD5C149FD8106131",
    taxid: number; // 9606
    features: UniprotFeature[];
}

export interface UniprotFeatureEvidence {
    code: string; // "ECO:0000269"
    source?: {
        name: string; // "PubMed",
        id: string; // "18022393"
        url: string; // "http://www.ncbi.nlm.nih.gov/pubmed/18022393",
        alternativeUrl?: string; // "https://europepmc.org/abstract/MED/18022393"
    };
}

export interface UniprotFeature {
    type: string; // "MOD_RES"
    category: string; // "PTM"
    description?: string; // "Phosphoserine; by HIPK4"
    begin: string; // "9"
    end: string; // "9"
    molecule?: string;
    evidences?: UniprotFeatureEvidence[];
}

export interface UniprotTopology {
    type: string; // TOPO_DOM
    startPosition: number; // 25
    endPosition: number; // 645
    description?: string; // Extracellular
    evidence?: UniprotFeatureEvidence[]; // ECO:0000255
}
