import { CustomDriverNumericGeneMolecularData } from 'shared/model/CustomDriverNumericGeneMolecularData';

export interface AnnotatedNumericGeneMolecularData
    extends CustomDriverNumericGeneMolecularData {
    hugoGeneSymbol: string;
    oncoKbOncogenic: string;
    putativeDriver: boolean;
}
