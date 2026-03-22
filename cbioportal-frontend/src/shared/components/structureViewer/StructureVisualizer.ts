import { IPdbPositionRange } from 'shared/model/Pdb';
import { convertPdbPosToResCode } from './PdbResidueUtils';

export interface IResidueSpec {
    positionRange: IPdbPositionRange;
    color: string;
    highlighted?: boolean;
}

export enum ProteinScheme {
    CARTOON,
    SPACE_FILLING,
    TRACE,
    BALL_AND_STICK,
    RIBBON,
}

// UNIFORM: single color, effective for all schemes
// SECONDARY_STRUCTURE: not effective for space-filling scheme
// ATOM_TYPE: effective only for space-filling scheme
// NC_RAINBOW: not effective for space-filling scheme
export enum ProteinColor {
    UNIFORM,
    SECONDARY_STRUCTURE,
    NC_RAINBOW,
    ATOM_TYPE,
}

// SELECTED: display side chain for only selected mutations
// ALL: display side chain for all mapped mutations
// NONE: do not display side chain atoms
export enum SideChain {
    ALL,
    SELECTED,
    NONE,
}

// MUTATION_TYPE: use mutation colors for type
// UNIFORM: use a single color
// NONE: do not color (use default atom colors)
export enum MutationColor {
    UNIFORM,
    MUTATION_TYPE,
    NONE,
}

export interface IStructureVisualizerProps {
    proteinScheme: ProteinScheme;
    proteinColor: ProteinColor;
    sideChain: SideChain;
    mutationColor: MutationColor;
    // when set to false, restricts to protein only (hide other atoms)
    displayBoundMolecules: boolean;
    // PDB database URI
    pdbUri?: string;
    // base color of the whole structure
    baseColor?: string;
    // background color
    backgroundColor?: string;
    // colors for special structures
    // structure color takes effect only when corresponding flag is set
    structureColors?: {
        alphaHelix: string;
        betaSheet: string;
        loop: string;
    };
    // translucency (opacity) of the whole structure
    baseTranslucency?: number;
    // color of the selected chain
    chainColor?: string;
    // translucency (opacity) of the selected chain
    chainTranslucency?: number;
    // uniform color of the mutated residues
    uniformMutationColor?: string;
    // color of the user-selected mutations
    highlightColor?: string;
}

abstract class StructureVisualizer {
    public static defaultProps = {
        pdbUri: 'https://files.rcsb.org/view/',
        proteinScheme: ProteinScheme.CARTOON,
        displayBoundMolecules: true,
        backgroundColor: '#FFFFFF',
        baseColor: '#DDDDDD',
        structureColors: {
            alphaHelix: '#FFA500',
            betaSheet: '#0000FF',
            loop: '#DDDDDD',
        },
        baseTranslucency: 5,
        chainColor: '#888888',
        chainTranslucency: 0,
        proteinColor: ProteinColor.UNIFORM,
        mutationColor: MutationColor.MUTATION_TYPE,
        uniformMutationColor: '#8A2BE2',
        highlightColor: '#FFDD00',
        sideChain: SideChain.SELECTED,
    };

    // abstract methods
    protected abstract selectAll(): any;
    protected abstract setScheme(scheme: ProteinScheme, selector?: any): any;
    protected abstract setColor(
        color: string,
        selector?: any,
        style?: any
    ): any;
    protected abstract setTransparency(
        transparency: number,
        selector?: any,
        style?: any
    ): any;
    protected abstract selectChain(chainId: string): any;
    protected abstract cpkColor(selector?: any, style?: any): any;
    protected abstract selectAlphaHelix(chainId: string): any;
    protected abstract selectBetaSheet(chainId: string): any;
    protected abstract rainbowColor(selector?: any, style?: any): any;
    protected abstract hideBoundMolecules(): any;
    protected abstract updateResidueStyle(
        residues: IResidueSpec[],
        chainId: string,
        props: IStructureVisualizerProps,
        style?: any
    ): any;

    /**
     * Updates the visual style (scheme, coloring, selection, etc.)
     */
    public updateVisualStyle(
        residues: IResidueSpec[],
        chainId: string,
        props: IStructureVisualizerProps
    ) {
        let style = this.updateScheme(props);
        this.updateBaseVisualStyle(style, props);
        this.updateChainVisualStyle(chainId, style, props);
        this.updateResidueStyle(residues, chainId, props, style);
        this.updateBoundMolecules(props);
    }

    protected updateScheme(props: IStructureVisualizerProps) {
        // select everything
        let selector = this.selectAll();

        // show selected style view
        return this.setScheme(props.proteinScheme, selector);
    }

    protected updateBaseVisualStyle(
        style: any,
        props: IStructureVisualizerProps
    ) {
        const defaultProps = StructureVisualizer.defaultProps;

        // do the initial (uniform) coloring

        let selector = this.selectAll();

        // set base structure color
        this.setColor(
            props.baseColor || defaultProps.baseColor,
            selector,
            style
        );

        // set base color
        this.setTransparency(
            props.baseTranslucency || defaultProps.baseTranslucency,
            selector,
            style
        );
    }

    protected updateChainVisualStyle(
        chainId: string,
        style: any,
        props: IStructureVisualizerProps
    ) {
        const defaultProps = StructureVisualizer.defaultProps;

        let selector = this.selectChain(chainId);

        this.setColor(
            props.chainColor || defaultProps.chainColor,
            selector,
            style
        ); // set chain color
        this.setTransparency(
            props.chainTranslucency || defaultProps.chainTranslucency,
            selector,
            style
        );

        // additional coloring for the selected chain

        if (props.proteinColor === ProteinColor.ATOM_TYPE) {
            selector = this.selectChain(chainId);
            this.cpkColor(selector, style);
        } else if (props.proteinColor === ProteinColor.SECONDARY_STRUCTURE) {
            // color secondary structure (for the selected chain)
            selector = this.selectAlphaHelix(chainId); // select alpha helices
            this.setColor(
                (props.structureColors || defaultProps.structureColors)
                    .alphaHelix,
                selector,
                style
            );
            selector = this.selectBetaSheet(chainId); // select beta sheets
            this.setColor(
                (props.structureColors || defaultProps.structureColors)
                    .betaSheet,
                selector,
                style
            );
        } else if (props.proteinColor === ProteinColor.NC_RAINBOW) {
            // color the chain by rainbow coloring scheme (gradient coloring)
            selector = this.selectChain(chainId);
            this.rainbowColor(selector, style);
        }
    }

    protected updateBoundMolecules(props: IStructureVisualizerProps) {
        if (!props.displayBoundMolecules) {
            this.hideBoundMolecules();
        }
    }

    protected convertPositionsToResCode(positions: IPdbPositionRange[]) {
        let residueCodes: string[] = [];

        // convert positions to script positions
        positions.forEach((range: IPdbPositionRange) => {
            residueCodes = residueCodes.concat(convertPdbPosToResCode(range));
        });

        return residueCodes;
    }
}

export default StructureVisualizer;
