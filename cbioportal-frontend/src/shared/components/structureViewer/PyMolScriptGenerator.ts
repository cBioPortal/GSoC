import _ from 'lodash';
import {
    default as StructureVisualizer,
    ProteinScheme,
    IResidueSpec,
    IStructureVisualizerProps,
    MutationColor,
    SideChain,
} from './StructureVisualizer';

export default class PyMolScriptGenerator extends StructureVisualizer {
    protected _script: string[] = [];

    public static get PROTEIN_SCHEME_PRESETS(): { [scheme: number]: string } {
        const presets: { [scheme: number]: string } = {};

        presets[ProteinScheme.CARTOON] = 'hide everything; show cartoon;';
        presets[ProteinScheme.SPACE_FILLING] = 'hide everything; show spheres;';
        presets[ProteinScheme.BALL_AND_STICK] =
            'hide everything; show spheres; show sticks; alter all, vdw=0.50';
        presets[ProteinScheme.RIBBON] = 'hide everything; show ribbon;';
        // there is no "trace" in PyMOL, ribbon is the most similar one
        presets[ProteinScheme.TRACE] = presets[ProteinScheme.RIBBON];

        return presets;
    }

    public generateScript(
        pdbId: string,
        chainId: string,
        residues: IResidueSpec[],
        props: IStructureVisualizerProps
    ): string {
        this._script = [];

        this.reinitialize();
        this.bgColor(
            props.backgroundColor ||
                StructureVisualizer.defaultProps.backgroundColor
        );
        this.loadPdb(pdbId);
        this.updateVisualStyle(residues, chainId, props);
        this.selectNone();

        return this._script.join('\n');
    }

    protected reinitialize() {
        this._script.push('reinitialize;');
    }

    protected bgColor(color: string) {
        this._script.push(`bg_color ${this.formatColor(color)};`);
    }

    protected loadPdb(pdbId: string) {
        this._script.push(`fetch ${pdbId}, async=0;`);
    }

    protected setScheme(scheme: ProteinScheme) {
        this._script.push(PyMolScriptGenerator.PROTEIN_SCHEME_PRESETS[scheme]);
    }

    protected setColor(color: string) {
        this._script.push(`color ${this.formatColor(color)}, sele;`);
    }

    protected selectChain(chainId: string) {
        this._script.push(`select chain ${chainId};`);
    }

    protected selectAlphaHelix(chainId: string) {
        this._script.push(`select (chain ${chainId}) and (ss h);`);
    }

    protected selectBetaSheet(chainId: string) {
        this._script.push(`select (chain ${chainId}) and (ss s);`);
    }

    protected selectResidues(residueCodes: string[], chainId: string) {
        this._script.push(
            `select (resi ${residueCodes.join(',')}) and (chain ${chainId});`
        );
    }

    protected selectSideChains(residueCodes: string[], chainId: string) {
        this._script.push(
            `select ((resi ${residueCodes.join(
                ','
            )}) and (chain ${chainId}) and (not name c+n+o));`
        );
    }

    protected setTransparency(transparency: number) {
        // TODO cartoon_transparency doesn't work for chain or residue selections
        // see issue:  http://sourceforge.net/p/pymol/bugs/129/
        this._script.push(`set transparency, ${transparency / 10}, sele;`);
        this._script.push(
            `set cartoon_transparency, ${transparency / 10}, sele;`
        );
        this._script.push(
            `set sphere_transparency, ${transparency / 10}, sele;`
        );
        this._script.push(
            `set stick_transparency, ${transparency / 10}, sele;`
        );
    }

    protected enableBallAndStick() {
        this._script.push(
            'show spheres, sele; show sticks, sele; alter sele, vdw=0.50;'
        );
    }

    protected disableBallAndStick() {
        this._script.push('hide spheres, sele; hide sticks, sele;');
    }

    protected rainbowColor() {
        return this._script.push('spectrum count, rainbow_rev, sele;');
    }

    protected cpkColor() {
        this._script.push('util.cbaw sele;');
    }

    protected hideBoundMolecules() {
        const proteins =
            'asp+glu+arg+lys+his+asn+thr+cys+gln+tyr+ser+gly+ala+leu+val+ile+met+trp+phe+pro';

        // restrict to protein only
        this._script.push(`hide everything, not resn ${proteins};`);
    }

    protected formatColor(color: string) {
        // this is for PyMol compatibility
        // (colors should start with an "0x" instead of "#")
        return color.replace('#', '0x');
    }

    protected selectAll() {
        this._script.push('select all;');
    }

    protected selectNone() {
        this._script.push('select none;');
    }

    protected updateResidueStyle(
        residues: IResidueSpec[],
        chainId: string,
        props: IStructureVisualizerProps
    ) {
        const defaultProps = StructureVisualizer.defaultProps;
        const highlightColor =
            props.highlightColor || defaultProps.highlightColor;

        // group residues by color
        const grouped: { [color: string]: IResidueSpec[] } = _.groupBy(
            residues,
            (residue: IResidueSpec) => {
                if (residue.highlighted) {
                    return highlightColor;
                } else {
                    return residue.color;
                }
            }
        );

        // process residues
        _.each(_.keys(grouped), (color: string) => {
            const positions = grouped[color].map((residue: IResidueSpec) => {
                return residue.positionRange;
            });

            const resCodes = this.convertPositionsToResCode(positions);

            // use the highlight color if highlighted (always color highlighted residues)
            if (grouped[color][0].highlighted) {
                this.selectResidues(resCodes, chainId);
                this.setColor(
                    props.highlightColor || defaultProps.highlightColor
                );
            }
            // use the provided color
            else if (props.mutationColor === MutationColor.MUTATION_TYPE) {
                this.selectResidues(resCodes, chainId);
                this.setColor(color);
            }
            // use a uniform color
            else if (props.mutationColor === MutationColor.UNIFORM) {
                this.selectResidues(resCodes, chainId);
                this.setColor(
                    props.uniformMutationColor ||
                        defaultProps.uniformMutationColor
                );
            }
            // else: NONE (no need to color)

            const displaySideChain =
                props.sideChain === SideChain.ALL ||
                (grouped[color][0].highlighted === true &&
                    props.sideChain === SideChain.SELECTED);

            // show/hide side chains
            this.updateSideChains(chainId, resCodes, displaySideChain, props);
        });
    }

    public updateSideChains(
        chainId: string,
        rescodes: string[],
        displaySideChain: boolean,
        props: IStructureVisualizerProps
    ) {
        // display side chain (no effect for space-filling)
        if (
            displaySideChain &&
            !(props.proteinScheme === ProteinScheme.SPACE_FILLING)
        ) {
            // select the corresponding side chain and also the CA atom on the backbone
            this.selectSideChains(rescodes, chainId);

            // display the side chain with ball&stick style
            this.enableBallAndStick();
        }
    }
}
