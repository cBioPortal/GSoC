// set missing globals to make 'import $3Dmol' work
import $ from 'jquery';
(global as any).$ = $;
(global as any).URL.createObjectURL = jest.fn();

import { assert } from 'chai';
import sinon from 'sinon';
import _ from 'lodash';
import {
    ProteinScheme,
    ProteinColor,
    MutationColor,
    SideChain,
    IStructureVisualizerProps,
    IResidueSpec,
} from './StructureVisualizer';
import {
    default as StructureVisualizer3D,
    AtomSelectionSpec,
    AtomStyleSpec,
} from './StructureVisualizer3D';

describe('StructureVisualizer3D', () => {
    const fakeDiv = {} as HTMLDivElement;

    let $3Dmol: any;
    let viewer: any;
    let props: IStructureVisualizerProps;
    let residues: IResidueSpec[];

    function initVis() {
        const visualizer = new StructureVisualizer3D(fakeDiv, props, $3Dmol);

        // pdb id does not really matter, we don't load any structure during test
        visualizer.init('3pxe', 'B', residues, viewer);

        return visualizer;
    }

    function updateVis(visualizer: StructureVisualizer3D) {
        visualizer.updateViewer('B', residues, props);
    }

    beforeEach(() => {
        $3Dmol = {
            download: sinon.stub().yields(), // download has a callback...
            elementColors: {
                defaultColors: ['R', 'G', 'B'],
                rasmol: ['R', 'A', 'S'],
            },
        };

        // stub the functions of the viewer
        viewer = {
            setBackgroundColor: sinon.stub(),
            setStyle: () => {},
            clear: sinon.stub(),
            render: sinon.stub(),
        };

        // reset to defaults
        props = {
            pdbUri: 'https://files.rcsb.org/view/',
            proteinScheme: ProteinScheme.CARTOON,
            displayBoundMolecules: true,
            backgroundColor: '#FFFFFF',
            baseColor: '#DDDDDD',
            structureColors: {
                alphaHelix: '#FFA500',
                betaSheet: '#0000FF',
                loop: '#EEEEEE',
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

        residues = [
            {
                positionRange: {
                    start: {
                        position: 122,
                    },
                    end: {
                        position: 122,
                    },
                },
                color: '#AAA666',
                highlighted: true,
            },
            {
                positionRange: {
                    start: {
                        position: 1710,
                    },
                    end: {
                        position: 1710,
                    },
                },
                color: '#FF0000',
            },
            {
                positionRange: {
                    start: {
                        position: 1835,
                    },
                    end: {
                        position: 1835,
                    },
                },
                color: '#00FFFF',
            },
            {
                positionRange: {
                    start: {
                        position: 1815,
                    },
                    end: {
                        position: 1815,
                    },
                },
                color: '#00FF00',
                highlighted: true,
            },
        ];
    });

    it('properly initializes the 3D visualizer', () => {
        initVis();
        assert.isTrue(
            viewer.setBackgroundColor.calledWith('0xFFFFFF'),
            'Background color should be set to 0xFFFFFF'
        );

        assert.isTrue(
            $3Dmol.download.calledWith(
                'pdb:3PXE',
                viewer,
                sinon.match({ pdbUri: props.pdbUri })
            ),
            'Structure download should be requested for pdb:3PXE from https://files.rcsb.org/view/'
        );

        assert.isTrue(
            viewer.clear.calledOnce,
            'Clear should only be called once per init'
        );

        assert.isTrue(
            viewer.render.calledOnce,
            'Render should only be called once per init'
        );
    });

    it('sets chain color and the opacity properly', () => {
        let chainColor = 'N/A';
        let chainOpacity = -1;

        sinon
            .stub(viewer, 'setStyle')
            .callsFake((selector: AtomSelectionSpec, style: AtomStyleSpec) => {
                if (selector && _.isEqual(selector, { chain: 'B' })) {
                    if (style.cartoon && style.cartoon.color) {
                        chainColor = style.cartoon.color;
                    }

                    if (style.cartoon && style.cartoon.opacity) {
                        chainOpacity = style.cartoon.opacity;
                    }
                }
            });

        initVis();
        assert.equal(
            chainColor,
            '0x888888',
            'Chain color should be set to 0x888888'
        );
        assert.equal(chainOpacity, 1, 'Chain opacity should be set to 1');
    });

    it('sets the base structure color and the opacity properly', () => {
        let baseColor = 'N/A';
        let baseOpacity = -1;

        sinon
            .stub(viewer, 'setStyle')
            .callsFake((selector: AtomSelectionSpec, style: AtomStyleSpec) => {
                if (selector && _.isEqual(selector, {})) {
                    if (style.cartoon && style.cartoon.color) {
                        baseColor = style.cartoon.color;
                    }

                    if (style.cartoon && style.cartoon.opacity) {
                        baseOpacity = style.cartoon.opacity;
                    }
                }
            });

        initVis();
        assert.equal(
            baseColor,
            '0xDDDDDD',
            'Base color should be set to 0xDDDDDD'
        );
        assert.equal(baseOpacity, 5 / 10, 'Base opacity should be set to 0.5');
    });

    it('applies correct protein style wrt the corresponding prop', () => {
        viewer.setStyle = sinon.stub();

        props.proteinScheme = ProteinScheme.TRACE;
        const visualizer = initVis();
        assert.isTrue(
            viewer.setStyle.calledWithMatch({}, { cartoon: { style: 'trace' } })
        );

        props.proteinScheme = ProteinScheme.SPACE_FILLING;
        updateVis(visualizer);
        assert.isTrue(
            viewer.setStyle.calledWithMatch({}, { sphere: { scale: 0.6 } })
        );

        props.proteinScheme = ProteinScheme.CARTOON;
        updateVis(visualizer);
        assert.isTrue(viewer.setStyle.calledWithMatch({}, { cartoon: {} }));
    });

    it('does not display bound molecules when the corresponding prop is set to false', () => {
        viewer.setStyle = sinon.stub();

        props.displayBoundMolecules = false;
        initVis();

        assert.isTrue(
            viewer.setStyle.calledWithMatch({
                resn: [
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
                    'ASP',
                    'GLU',
                    'ARG',
                    'LYS',
                    'HIS',
                    'ASN',
                    'THR',
                    'CYS',
                    'GLN',
                    'TYR',
                    'SER',
                    'GLY',
                    'ALA',
                    'LEU',
                    'VAL',
                    'ILE',
                    'MET',
                    'TRP',
                    'PHE',
                    'PRO',
                ],
                invert: true,
            })
        );
    });

    it('applies correct protein colors wrt the corresponding prop', () => {
        let structureToColor: { [selector: string]: string };
        let defaultColors: string[] = [];
        let isColoredWithSpectrum = false;

        sinon
            .stub(viewer, 'setStyle')
            .callsFake((selector: AtomSelectionSpec, style: AtomStyleSpec) => {
                if (selector.ss && style.cartoon && style.cartoon.color) {
                    structureToColor[selector.ss] = style.cartoon.color;
                }

                if (
                    _.isEqual(selector, { chain: 'B' }) &&
                    style.sphere &&
                    style.sphere.colors
                ) {
                    defaultColors = style.sphere.colors;
                }

                if (
                    selector.chain &&
                    selector.chain === 'B' &&
                    style.cartoon &&
                    style.cartoon.color &&
                    style.cartoon.color === 'spectrum'
                ) {
                    isColoredWithSpectrum = true;
                }
            });

        structureToColor = {};
        props.proteinScheme = ProteinScheme.TRACE;
        props.proteinColor = ProteinColor.SECONDARY_STRUCTURE;
        const visualizer = initVis();

        assert.equal(
            structureToColor['h'],
            '0xFFA500',
            'Alpha helices should be colored with 0xFFA500 when SECONDARY_STRUCTURE is selected'
        );
        assert.equal(
            structureToColor['s'],
            '0x0000FF',
            'Beta sheets should be colored with 0x0000FF when SECONDARY_STRUCTURE is selected'
        );

        structureToColor = {};
        props.proteinScheme = ProteinScheme.CARTOON;
        props.proteinColor = ProteinColor.NC_RAINBOW;
        updateVis(visualizer);

        assert.isTrue(
            isColoredWithSpectrum,
            'Chain B should be colored with rainbow spectrum when NC_RAINBOW is selected'
        );

        structureToColor = {};
        props.proteinScheme = ProteinScheme.SPACE_FILLING;
        props.proteinColor = ProteinColor.ATOM_TYPE;
        updateVis(visualizer);

        assert.deepEqual(
            defaultColors,
            ['R', 'G', 'B'],
            'Chain B should be colored with default element colors when ATOM_TYPE is selected'
        );
    });

    it.skip('colors residues with correct colors', () => {
        let residueToColor: { [residue: number]: string } = {};

        sinon.stub(
            viewer,
            'setStyle',
            (selector: AtomSelectionSpec, style: AtomStyleSpec) => {
                if (selector.resi && style.cartoon && style.cartoon.color) {
                    residueToColor[selector.resi] = style.cartoon.color;
                }
            }
        );

        props.mutationColor = MutationColor.MUTATION_TYPE;
        const visualizer = initVis();

        assert.equal(
            residueToColor[122],
            '0xFFDD00',
            'Residue 122 should be colored with highlight color (0xFFDD00) when MUTATION_TYPE selected'
        );
        assert.equal(
            residueToColor[1710],
            '0xFF0000',
            'Residue 1710 should be colored with 0xFF0000 when MUTATION_TYPE selected'
        );
        assert.equal(
            residueToColor[1815],
            '0xFFDD00',
            'Residue 1815 should be colored with highlight color (0xFFDD00) when MUTATION_TYPE selected'
        );
        assert.equal(
            residueToColor[1835],
            '0x00FFFF',
            'Residue 1835 should be colored with 0x00FFFF when MUTATION_TYPE selected'
        );

        residueToColor = {};
        props.mutationColor = MutationColor.UNIFORM;
        updateVis(visualizer);

        assert.equal(
            residueToColor[122],
            '0xFFDD00',
            'Residue 122 should be colored with highlight color (0xFFDD00) when UNIFORM selected'
        );
        assert.equal(
            residueToColor[1710],
            '0x8A2BE2',
            'Residue 1710 should be colored with uniform color (0x8A2BE2) when UNIFORM selected'
        );
        assert.equal(
            residueToColor[1815],
            '0xFFDD00',
            'Residue 1815 should be colored with highlight color (0xFFDD00) when UNIFORM selected'
        );
        assert.equal(
            residueToColor[1835],
            '0x8A2BE2',
            'Residue 1835 should be colored with uniform color (0x8A2BE2) when UNIFORM selected'
        );

        residueToColor = {};
        props.mutationColor = MutationColor.NONE;
        updateVis(visualizer);

        assert.equal(
            residueToColor[122],
            '0xFFDD00',
            'Residue 122 should be colored with highlight color (0xFFDD00) when NONE selected'
        );
        assert.equal(
            residueToColor[1710],
            '0x888888',
            'Residue 1710 should be colored with chain color when NONE selected'
        );
        assert.equal(
            residueToColor[1815],
            '0xFFDD00',
            'Residue 1815 should be colored with highlight color (0xFFDD00) when NONE selected'
        );
        assert.equal(
            residueToColor[1835],
            '0x888888',
            'Residue 1835 should be colored with chain color when NONE selected'
        );
    });

    it.skip('styles and colors side chain atoms wrt the corresponding props', () => {
        let residueToStickColor: { [residue: number]: string };
        let residueToSphereColor: { [residue: number]: string };

        sinon.stub(
            viewer,
            'setStyle',
            (selector: AtomSelectionSpec, style: AtomStyleSpec) => {
                if (
                    selector.resi &&
                    style.sphere &&
                    style.sphere.color &&
                    style.stick &&
                    style.stick.color
                ) {
                    residueToStickColor[selector.resi] = style.stick.color;
                    residueToSphereColor[selector.resi] = style.sphere.color;
                }
            }
        );

        // only selected residues should have side chain style with selection color if sideChain is set to SELECTED

        residueToStickColor = {};
        residueToSphereColor = {};
        props.sideChain = SideChain.SELECTED;
        props.mutationColor = MutationColor.MUTATION_TYPE;
        const visualizer = initVis();

        assert.equal(
            residueToStickColor[122],
            '0xFFDD00',
            'Residue 122 side chain sticks should be colored with highlight color (0xFFDD00) when SELECTED active'
        );
        assert.equal(
            residueToSphereColor[122],
            '0xFFDD00',
            'Residue 122 side chain spheres should be colored with highlight color (0xFFDD00) when SELECTED active'
        );

        assert.equal(
            residueToStickColor[1710],
            undefined,
            'Residue 1710 side chain sticks should not be selected or colored when SELECTED active'
        );
        assert.equal(
            residueToSphereColor[1710],
            undefined,
            'Residue 1710 side chain spheres should not be selected or colored when SELECTED active'
        );

        assert.equal(
            residueToStickColor[1815],
            '0xFFDD00',
            'Residue 1815 side chain sticks should be colored with highlight color (0xFFDD00) when SELECTED active'
        );
        assert.equal(
            residueToSphereColor[1815],
            '0xFFDD00',
            'Residue 1815 side chain spheres should be colored with highlight color (0xFFDD00) when SELECTED active'
        );

        assert.equal(
            residueToStickColor[1835],
            undefined,
            'Residue 1835 side chain sticks should not be selected or colored when SELECTED active'
        );
        assert.equal(
            residueToSphereColor[1835],
            undefined,
            'Residue 1835 side chain spheres should not be selected or colored when SELECTED active'
        );

        // all residues should have side chain style with corresponding color if sideChain is set to ALL

        residueToStickColor = {};
        residueToSphereColor = {};
        props.sideChain = SideChain.ALL;
        props.mutationColor = MutationColor.MUTATION_TYPE;
        updateVis(visualizer);

        assert.equal(
            residueToStickColor[122],
            '0xFFDD00',
            'Residue 122 side chain sticks should be colored with highlight color (0xFFDD00) when ALL active'
        );
        assert.equal(
            residueToSphereColor[122],
            '0xFFDD00',
            'Residue 122 side chain spheres should be colored with highlight color (0xFFDD00) when ALL active'
        );

        assert.equal(
            residueToStickColor[1710],
            '0xFF0000',
            'Residue 1710 side chain sticks should should be colored with 0xFF0000 when ALL active'
        );
        assert.equal(
            residueToSphereColor[1710],
            '0xFF0000',
            'Residue 1710 side chain spheres should be colored with 0xFF0000 when ALL active'
        );

        assert.equal(
            residueToStickColor[1815],
            '0xFFDD00',
            'Residue 1815 side chain sticks should be colored with highlight color (0xFFDD00) when ALL active'
        );
        assert.equal(
            residueToSphereColor[1815],
            '0xFFDD00',
            'Residue 1815 side chain spheres should be colored with highlight color (0xFFDD00) when ALL active'
        );

        assert.equal(
            residueToStickColor[1835],
            '0x00FFFF',
            'Residue 1835 side chain sticks should be colored with 0x00FFFF when ALL active'
        );
        assert.equal(
            residueToSphereColor[1835],
            '0x00FFFF',
            'Residue 1835 side chain spheres should be colored with 0x00FFFF when ALL active'
        );

        residueToStickColor = {};
        residueToSphereColor = {};
        props.sideChain = SideChain.ALL;
        props.mutationColor = MutationColor.UNIFORM;
        updateVis(visualizer);

        assert.equal(
            residueToStickColor[1710],
            '0x8A2BE2',
            'Residue 1710 side chain sticks should be colored with uniform color (0x8A2BE2) when ALL & UNIFORM active'
        );
        assert.equal(
            residueToSphereColor[1710],
            '0x8A2BE2',
            'Residue 1710 side chain spheres should be colored with uniform color (0x8A2BE2) when ALL & UNIFORM active'
        );

        assert.equal(
            residueToStickColor[1835],
            '0x8A2BE2',
            'Residue 1835 side chain sticks should be colored with uniform color (0x8A2BE2) when ALL & UNIFORM active'
        );
        assert.equal(
            residueToSphereColor[1835],
            '0x8A2BE2',
            'Residue 1835 side chain spheres should be colored with uniform color (0x8A2BE2) when ALL & UNIFORM active'
        );

        // none of the residues should have side chain style or color if sideChain is set to NONE

        residueToStickColor = {};
        residueToSphereColor = {};
        props.sideChain = SideChain.NONE;
        props.mutationColor = MutationColor.MUTATION_TYPE;
        updateVis(visualizer);

        assert.equal(
            residueToStickColor[122],
            undefined,
            'Residue 122 side chain sticks should not be selected or colored when NONE active'
        );
        assert.equal(
            residueToSphereColor[122],
            undefined,
            'Residue 122 side chain spheres should not be selected or colored when NONE active'
        );

        assert.equal(
            residueToStickColor[1710],
            undefined,
            'Residue 1710 side chain sticks should not be selected or colored when NONE active'
        );
        assert.equal(
            residueToSphereColor[1710],
            undefined,
            'Residue 1710 side chain spheres should not be selected or colored when NONE active'
        );

        assert.equal(
            residueToStickColor[1815],
            undefined,
            'Residue 1815 side chain sticks should not be selected or colored when NONE active'
        );
        assert.equal(
            residueToSphereColor[1815],
            undefined,
            'Residue 1815 side chain spheres should not be selected or colored when NONE active'
        );

        assert.equal(
            residueToStickColor[1835],
            undefined,
            'Residue 1835 side chain sticks should not be selected or colored when NONE active'
        );
        assert.equal(
            residueToSphereColor[1835],
            undefined,
            'Residue 1835 side chain spheres should not be selected or colored when NONE active'
        );
    });
});
