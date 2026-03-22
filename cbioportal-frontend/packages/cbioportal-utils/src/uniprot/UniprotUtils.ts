import _ from 'lodash';
import { UniprotFeature, UniprotTopology } from '../model/Uniprot';

export const UniprotCategory = {
    PTM: 'PTM',
    TOPOLOGY: 'TOPOLOGY',
};

function getTopologyTypeName(type: string, description: string | undefined) {
    // need to conver TOPO_DOM to detailed type name(e.g. TOPO_DOM_EXTRACELLULAR), keep the same name for TRANSMEM and INTRAMEM
    if (type === 'TOPO_DOM') {
        return description
            ? _.toUpper(`${type}_${description.replace(/\s+/g, '_')}`)
            : undefined;
    } else {
        return type;
    }
}

export function convertUniprotFeatureToUniprotTopology(
    uniprotFeature: UniprotFeature
): UniprotTopology | undefined {
    const typeName = getTopologyTypeName(
        uniprotFeature.type,
        uniprotFeature.description
    );
    return typeName
        ? {
              type: typeName,
              startPosition: Number(uniprotFeature.begin),
              endPosition: Number(uniprotFeature.end),
              description: uniprotFeature.description,
              evidence: uniprotFeature.evidences,
          }
        : undefined;
}

export const UniprotTopologyTypeToTitle: { [type: string]: string } = {
    TRANSMEM: 'Transmembrane',
    INTRAMEM: 'Intramembrane',
    TOPO_DOM_CHLOROPLAST_INTERMEMBRANE: 'Chloroplast intermembrane',
    TOPO_DOM_CYTOPLASMIC: 'Cytoplasmic',
    TOPO_DOM_EXTRACELLULAR: 'Extracellular',
    TOPO_DOM_INTRAVACUOLAR: 'Intravacuolar',
    TOPO_DOM_INTRAVIRION: 'Intravirion',
    TOPO_DOM_LUMENAL: 'Lumenal',
    TOPO_DOM_LUMENAL_THYLAKOID: 'Lumenal thylakoid',
    TOPO_DOM_LUMENAL_VESICLE: 'Lumenal vesicle',
    TOPO_DOM_MITOCHONDRIAL_INTERMEMBRANE: 'Mitochondrial intermembrane',
    TOPO_DOM_MITOCHONDRIAL_MATRIX: 'Mitochondrial matrix',
    TOPO_DOM_PERIPLASMIC: 'Periplasmic',
    TOPO_DOM_PEROXISOMAL: 'Peroxisomal',
    TOPO_DOM_PEROXISOMAL_MATRIX: 'Peroxisomal matrix',
    TOPO_DOM_NUCLEAR: 'Nuclear',
    TOPO_DOM_PERINUCLEAR_SPACE: 'Perinuclear space',
    TOPO_DOM_STROMAL: 'Stromal',
    TOPO_DOM_VACUOLAR: 'Vacuolar',
    TOPO_DOM_VESICULAR: 'Vesicular',
    TOPO_DOM_VIRION_SURFACE: 'Virion surface',
    TOPO_DOM_LUMENAL_MELANOSOME: 'Lumenal melanosome',
    TOPO_DOM_MOTHER_CELL_CYTOPLASMIC: 'Mother cell cytoplasmic',
    TOPO_DOM_FORESPORE_INTERMEMBRANE_SPACE: 'Forespore intermembrane space',
    TOPO_DOM_INTRAGRANULAR: 'Intragranular',
    TOPO_DOM_IN_MEMBRANE: 'In membrane',
    TOPO_DOM_PORE_FORMING: 'Pore forming',
    TOPO_DOM_EXOPLASMIC_LOOP: 'Exoplasmic loop',
};

export const UniprotTopologyTrackToColor: { [type: string]: string } = {
    INTRAMEM: '#0096c7',
    TRANSMEM: '#8d99ae',
    TOPO_DOM_CHLOROPLAST_INTERMEMBRANE: '#a2d729',
    TOPO_DOM_CYTOPLASMIC: '#e76f51',
    TOPO_DOM_EXTRACELLULAR: '#e9c46a',
    TOPO_DOM_INTRAVACUOLAR: '#379956',
    TOPO_DOM_INTRAVIRION: '#a68a64',
    TOPO_DOM_LUMENAL: '#f4a261',
    TOPO_DOM_LUMENAL_THYLAKOID: '#e4c1f9',
    TOPO_DOM_LUMENAL_VESICLE: '#97dffc',
    TOPO_DOM_MITOCHONDRIAL_INTERMEMBRANE: '#e9d8a6',
    TOPO_DOM_MITOCHONDRIAL_MATRIX: 'vca6702',
    TOPO_DOM_PERIPLASMIC: '#90be6d',
    TOPO_DOM_PEROXISOMAL: '#b7b7a4',
    TOPO_DOM_PEROXISOMAL_MATRIX: '#ef476f',
    TOPO_DOM_NUCLEAR: '#0077b6',
    TOPO_DOM_PERINUCLEAR_SPACE: '#9b2226',
    TOPO_DOM_STROMAL: '#7a4419',
    TOPO_DOM_VACUOLAR: '#5603ad',
    TOPO_DOM_VESICULAR: '#264653',
    TOPO_DOM_VIRION_SURFACE: '#fa9500',
    TOPO_DOM_LUMENAL_MELANOSOME: '#861657',
    TOPO_DOM_MOTHER_CELL_CYTOPLASMIC: '#ffd000',
    TOPO_DOM_FORESPORE_INTERMEMBRANE_SPACE: '#4ecdc4',
    TOPO_DOM_INTRAGRANULAR: 'v560bad',
    TOPO_DOM_IN_MEMBRANE: '#c9ada7',
    TOPO_DOM_PORE_FORMING: '#4281a4',
    TOPO_DOM_EXOPLASMIC_LOOP: '#e5989b',
};
