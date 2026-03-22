import _ from 'lodash';
import $ from 'jquery';
import {
    observable,
    computed,
    reaction,
    action,
    makeObservable,
    IReactionDisposer,
} from 'mobx';
import {
    default as StructureVisualizer,
    ProteinScheme,
    MutationColor,
    SideChain,
    IStructureVisualizerProps,
    IResidueSpec,
} from './StructureVisualizer';
import {
    IResidueHelper,
    IResidueSelector,
    generateResiduePosToSelectorMap,
    findUpdatedResidues,
} from './PdbResidueUtils';

import $3Dmol from '3dmol';

// ideally these types should be defined in 3Dmol.js lib.
// manually adding complete style and selector models is quite complicated,
// so adding partial definition for now...

export type AtomSelectionSpec = any;

export type StyleSpec = {
    color?: string;
    colors?: string[];
    opacity?: number;
};
export type LineStyleSpec = StyleSpec;
export type CrossStyleSpec = StyleSpec;
export type StickStyleSpec = StyleSpec;
export type SphereStyleSpec = StyleSpec;
export type CartoonStyleSpec = StyleSpec;

export type AtomStyleSpec = {
    line?: LineStyleSpec;
    cross?: CrossStyleSpec;
    stick?: StickStyleSpec;
    sphere?: SphereStyleSpec;
    cartoon?: CartoonStyleSpec;
};

interface IStructureVisualizerState {
    pdbId: string;
    chainId: string;
    residues: IResidueSpec[];
}

export default class StructureVisualizer3D extends StructureVisualizer {
    private _3dMolDiv: HTMLDivElement | undefined;
    private _3dMolViewer: any;
    private _3dMol: any;

    @observable private props: IStructureVisualizerProps;
    @observable private _prevProps: IStructureVisualizerProps;

    @observable private state: IStructureVisualizerState;
    @observable private _prevState: IStructureVisualizerState;

    private _loadingPdb: boolean = false;

    public static get PROTEIN_SCHEME_PRESETS(): {
        [scheme: number]: AtomStyleSpec;
    } {
        const presets: { [scheme: number]: any } = {};

        presets[ProteinScheme.CARTOON] = { cartoon: {} };
        presets[ProteinScheme.TRACE] = { cartoon: { style: 'trace' } };
        presets[ProteinScheme.SPACE_FILLING] = { sphere: { scale: 0.6 } };
        presets[ProteinScheme.BALL_AND_STICK] = {
            stick: {},
            sphere: { scale: 0.25 },
        };
        presets[ProteinScheme.RIBBON] = { cartoon: { style: 'ribbon' } };

        return presets;
    }

    public static get ALL_PROTEINS(): string[] {
        const proteins = [
            'asp',
            'glu',
            'arg',
            'lys',
            'his',
            'asn',
            'thr',
            'cys',
            'gln',
            'tyr',
            'ser',
            'gly',
            'ala',
            'leu',
            'val',
            'ile',
            'met',
            'trp',
            'phe',
            'pro',
        ];

        const upperCaseProteins = proteins.map((protein: string) =>
            protein.toUpperCase()
        );

        return proteins.concat(upperCaseProteins);
    }

    constructor(
        div: HTMLDivElement,
        props?: IStructureVisualizerProps,
        _3dMol?: any
    ) {
        super();
        this._3dMol = _3dMol || $3Dmol;
        this._3dMolDiv = div;

        // init props
        this.props = {
            ...StructureVisualizer.defaultProps,
            ...props,
        };

        // init state
        this.state = {
            pdbId: '',
            chainId: '',
            residues: [],
        };

        this._prevState = {
            pdbId: '',
            chainId: '',
            residues: [],
        };

        this.updateViewer = this.updateViewer.bind(this);
        makeObservable(this);

        this.stateChangeReaction = reaction(
            () => this.state,
            (state: IStructureVisualizerState) => {
                this.onStateChange(state);
            }
        );
    }

    @action setState(newState: IStructureVisualizerState) {
        this._prevState = { ...this.state };
        this.state = { ...this.state, ...newState };
    }

    // we need to update the view for each state change action
    private stateChangeReaction: IReactionDisposer;

    private onStateChange(state: IStructureVisualizerState) {
        // do not update or render if pdb is still loading,
        // pdb load callback will take care of the update once the load ends
        if (this._prevState && !this._loadingPdb) {
            this.updateVisualStyle(state.residues, state.chainId, this.props);
            this._3dMolViewer.render();
        }
    }

    @action
    protected setProps(newProps: IStructureVisualizerProps) {
        this._prevProps = this.props;
        this.props = newProps;
    }

    public init(
        pdbId: string,
        chainId: string,
        residues: IResidueSpec[] = this.state.residues,
        viewer?: any
    ) {
        if (viewer) {
            this._3dMolViewer = viewer;
        } else if (this._3dMolDiv) {
            this._3dMolViewer = this._3dMol.createViewer($(this._3dMolDiv), {
                defaultcolors: this._3dMol.elementColors.rasmol,
            });
        }

        if (this._3dMolViewer) {
            const backgroundColor = this.formatColor(
                this.props.backgroundColor ||
                    StructureVisualizer.defaultProps.backgroundColor
            );
            this._3dMolViewer.setBackgroundColor(backgroundColor);
            this.loadPdb(pdbId, chainId, residues);
        }
    }

    public loadPdb(
        pdbId: string,
        chainId: string,
        residues: IResidueSpec[] = this.state.residues,
        props: IStructureVisualizerProps = this.props
    ) {
        const options = {
            doAssembly: true,
            pdbUri: props.pdbUri,
            // multiMode: true,
            // frames: true
        };

        // update load state (mark as loading)
        this._loadingPdb = true;

        // update state
        this.setState({
            pdbId,
            chainId,
            residues,
        } as IStructureVisualizerState);

        if (this._3dMolViewer) {
            // clear previous content
            this._3dMolViewer.clear();

            // TODO handle download error
            // init download
            this._3dMol.download(
                `pdb:${pdbId.toUpperCase()}`,
                this._3dMolViewer,
                options,
                () => {
                    // update load state (mark as finished)
                    this._loadingPdb = false;
                    // use the global state instead of the local variables,
                    // since the state might be updated before the pdb download ends
                    this.onStateChange(this.state);
                }
            );
        } else {
            // update load state (mark as finished)
            this._loadingPdb = false;
        }
    }

    public updateViewer(
        chainId: string,
        residues: IResidueSpec[] = this.state.residues,
        props: IStructureVisualizerProps = this.props
    ) {
        // update global references
        this.setProps(props);
        this.setState({
            chainId,
            residues,
        } as IStructureVisualizerState);
    }

    public resize() {
        if (this._3dMolViewer) {
            this._3dMolViewer.resize();
        }
    }

    protected selectAll() {
        return {};
    }

    protected selectChain(chainId: string) {
        return { chain: chainId };
    }

    protected setScheme(scheme: ProteinScheme, selector?: AtomSelectionSpec) {
        const style = StructureVisualizer3D.PROTEIN_SCHEME_PRESETS[scheme];
        this.applyStyleForSelector(selector, style);

        return style;
    }

    protected setColor(
        color: string,
        selector?: AtomSelectionSpec,
        style?: AtomStyleSpec
    ) {
        const visColor = this.formatColor(color);

        if (style) {
            // update current style with color information
            _.each(style, (spec: StyleSpec) => {
                spec.color = visColor;
            });

            this.applyStyleForSelector(selector, style);
        }
    }

    protected formatColor(color: string) {
        // this is for 3Dmol.js compatibility
        // (colors should start with an "0x" instead of "#")
        return color.replace('#', '0x');
    }

    protected setTransparency(
        transparency: number,
        selector?: AtomSelectionSpec,
        style?: AtomStyleSpec
    ) {
        if (style) {
            this.addTransparencyToStyle(transparency, style);
            this.applyStyleForSelector(selector, style);
        }
    }

    protected addTransparencyToStyle(transparency: number, style: any) {
        _.each(style, (spec: StyleSpec, key: string) => {
            // TODO sphere opacity is not supported by 3Dmol.js so excluding sphere style for now
            if (key !== 'sphere') {
                spec.opacity = (10 - transparency) / 10;
            }
        });
    }

    protected rainbowColor(
        selector?: AtomSelectionSpec,
        style?: AtomStyleSpec
    ) {
        this.setColor('spectrum', selector, style);
    }

    protected cpkColor(selector?: AtomSelectionSpec, style?: AtomStyleSpec) {
        if (style) {
            _.each(style, (spec: StyleSpec) => {
                // remove previous single color (if any)
                delete spec.color;

                // add default color scheme
                spec.colors = this._3dMol.elementColors.defaultColors;
            });

            this.applyStyleForSelector(selector, style);
        }
    }

    protected selectAlphaHelix(chainId: string) {
        return { chain: chainId, ss: 'h' };
    }

    protected selectBetaSheet(chainId: string) {
        return { chain: chainId, ss: 's' };
    }

    protected hideBoundMolecules() {
        // since there is no built-in "restrict protein" command,
        // we need to select all non-protein structure...
        const selector = {
            resn: StructureVisualizer3D.ALL_PROTEINS,
            invert: true,
        };

        const style = { sphere: { hidden: true } };

        this._3dMolViewer.setStyle(selector, style);
    }

    protected enableBallAndStick(
        color?: string,
        selector?: AtomSelectionSpec,
        style?: AtomStyleSpec
    ) {
        // extend current style with ball and stick
        const bnsStyle = {
            ...style,
            ...StructureVisualizer3D.PROTEIN_SCHEME_PRESETS[
                ProteinScheme.BALL_AND_STICK
            ],
        };

        // use the color if provided
        if (color) {
            const visColor = this.formatColor(color);

            if (!bnsStyle.sphere) {
                bnsStyle.sphere = {};
            }

            bnsStyle.sphere.color = visColor;

            if (!bnsStyle.stick) {
                bnsStyle.stick = {};
            }

            bnsStyle.stick.color = visColor;
        }

        // update style of the selection
        this._3dMolViewer.setStyle(selector, bnsStyle);
    }

    protected updateResidueStyle(
        residues: IResidueSpec[],
        chainId: string,
        props: IStructureVisualizerProps = this.props,
        style?: AtomStyleSpec
    ) {
        const defaultProps = StructureVisualizer.defaultProps;

        if (!style) {
            style =
                StructureVisualizer3D.PROTEIN_SCHEME_PRESETS[
                    props.proteinScheme
                ];
            // need to add transparency to the style, otherwise we got weird visualization
            this.addTransparencyToStyle(
                props.chainTranslucency || defaultProps.chainTranslucency,
                style
            );
        }

        let residueHelpers: IResidueHelper[] = this.residuesToUpdate;

        residueHelpers.forEach((residueHelper: IResidueHelper) => {
            let residue = residueHelper.residue;
            let selector = this.selectResidue(residueHelper.selector, chainId);
            let color: string | undefined;

            // use the highlight color if highlighted (always color highlighted residues)
            if (residue.highlighted) {
                color =
                    this.props.highlightColor || defaultProps.highlightColor;
            }
            // use the provided color
            else if (props.mutationColor === MutationColor.MUTATION_TYPE) {
                color = residue.color;
            }
            // use a uniform color
            else if (props.mutationColor === MutationColor.UNIFORM) {
                // color with a uniform mutation color
                color =
                    props.uniformMutationColor ||
                    defaultProps.uniformMutationColor;
            }
            // NONE: color with chain color
            else {
                color = props.chainColor || defaultProps.chainColor;
            }

            this.setColor(color, selector, style);

            const displaySideChain =
                props.sideChain === SideChain.ALL ||
                (residue.highlighted === true &&
                    props.sideChain === SideChain.SELECTED);

            // show side chains
            if (displaySideChain) {
                this.updateSideChain(
                    chainId,
                    residueHelper.selector,
                    props.proteinScheme,
                    color,
                    style
                );
            }
        });
    }

    protected updateScheme(props: IStructureVisualizerProps) {
        if (!this.needToUpdateResiduesOnly) {
            return super.updateScheme(props);
        } else {
            return undefined;
        }
    }

    protected updateBaseVisualStyle(
        style: any,
        props: IStructureVisualizerProps
    ) {
        if (!this.needToUpdateResiduesOnly) {
            super.updateBaseVisualStyle(style, props);
        }
    }

    protected updateChainVisualStyle(
        chainId: string,
        style: any,
        props: IStructureVisualizerProps
    ) {
        if (!this.needToUpdateResiduesOnly) {
            super.updateChainVisualStyle(chainId, style, props);
        }
    }

    @computed get residuesToUpdate(): IResidueHelper[] {
        if (this.needToUpdateResiduesOnly) {
            return findUpdatedResidues(
                this.currentResidueToPositionMap,
                this.prevResidueToPositionMap
            );
        } else {
            // update all the residues
            return _.flatten(_.values(this.currentResidueToPositionMap));
        }
    }

    /**
     * We need to update only residues if:
     *    - Pdb id not updated
     *    - Chain id not updated
     *    - Visual properties not updated
     *    - Number of residues and residue positions remain the same
     */
    @computed get needToUpdateResiduesOnly(): boolean {
        return (
            this._prevState.pdbId === this.state.pdbId &&
            this._prevState.chainId === this.state.chainId &&
            this.visualPropsUnchanged &&
            this.residuePositionsUnchanged
        );
    }

    @computed get residuePositionsUnchanged(): boolean {
        return _.isEqual(
            _.keys(this.currentResidueToPositionMap).sort(),
            _.keys(this.prevResidueToPositionMap).sort()
        );
    }

    @computed get currentResidueToPositionMap(): {
        [residue: number]: IResidueHelper[];
    } {
        return generateResiduePosToSelectorMap(this.state.residues);
    }

    @computed get prevResidueToPositionMap(): {
        [residue: number]: IResidueHelper[];
    } {
        return generateResiduePosToSelectorMap(this._prevState.residues);
    }

    @computed get visualPropsUnchanged(): boolean {
        return _.isEqual(
            _.omit(this.props, ['pdbId', 'chainId', 'residues']),
            _.omit(this._prevProps, ['pdbId', 'chainId', 'residues'])
        );
    }

    /**
     * Updates the visual style (scheme, coloring, selection, etc.)
     */
    @action
    public updateVisualStyle(
        residues: IResidueSpec[],
        chainId: string,
        props: IStructureVisualizerProps = this.props
    ) {
        super.updateVisualStyle(residues, chainId, props);
    }

    protected selectResidues(residueCodes: string[], chainId: string) {
        return {
            rescode: residueCodes,
            chain: chainId,
        };
    }

    protected selectResidue(
        residueSelector: IResidueSelector,
        chainId: string
    ) {
        return {
            chain: chainId,
            ...residueSelector,
        };
    }

    protected selectSideChains(
        residueSelector: IResidueSelector,
        chainId: string
    ) {
        // we are not able to select side chain atoms...
        // return {
        //     ...,
        //     atom: ["CA"]
        // };

        // so we are selecting all the atoms at given positions
        return this.selectResidue(residueSelector, chainId);
    }

    /**
     * Show/hide the side chain for the given residues.
     * Residue codes can be in the form of "666" or "666:C", both are fine.
     */
    protected updateSideChain(
        chainId: string,
        residueSelector: IResidueSelector,
        proteinScheme: ProteinScheme,
        color?: string,
        style?: AtomStyleSpec
    ) {
        // display side chain (no effect for space-filling)
        if (!(proteinScheme === ProteinScheme.SPACE_FILLING)) {
            // select the corresponding side chain and also the CA atom on the backbone
            const selector = this.selectSideChains(residueSelector, chainId);

            // display the side chain with ball&stick style
            this.enableBallAndStick(color, selector, style);
        }
    }

    protected applyStyleForSelector(
        selector: AtomSelectionSpec,
        style: AtomStyleSpec
    ) {
        this._3dMolViewer.setStyle(selector, style);
    }
}
