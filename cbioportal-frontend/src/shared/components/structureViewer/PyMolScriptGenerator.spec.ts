import PyMolScriptGenerator from './PyMolScriptGenerator';
import { assert } from 'chai';
import sinon from 'sinon';
import {
    IStructureVisualizerProps,
    IResidueSpec,
    ProteinScheme,
    ProteinColor,
    MutationColor,
    SideChain,
} from './StructureVisualizer';

describe('PyMolScriptGenerator', () => {
    let props: IStructureVisualizerProps;
    let residues: IResidueSpec[];

    beforeEach(() => {
        // reset to defaults
        props = {
            pdbUri: 'https://files.rcsb.org/view/',
            proteinScheme: ProteinScheme.CARTOON,
            displayBoundMolecules: true,
            backgroundColor: '#EFEFEF',
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

    it('properly generates the initializer script', () => {
        const scriptGenerator = new PyMolScriptGenerator();

        // can't stub private methods so need to cast to any
        const reinitStub = sinon.stub(scriptGenerator as any, 'reinitialize');
        const bgColorStub = sinon.stub(scriptGenerator as any, 'bgColor');
        const loadPdbStub = sinon.stub(scriptGenerator as any, 'loadPdb');

        scriptGenerator.generateScript('3pxe', 'B', residues, props);

        assert.isTrue(
            reinitStub.calledOnce,
            'Reinitialize should be called only once'
        );

        assert.isTrue(
            bgColorStub.calledWithExactly('#EFEFEF'),
            'background color should be set to #EFEFEF'
        );

        assert.isTrue(
            loadPdbStub.calledWithExactly('3pxe'),
            'PDB structure for 3pxe should be loaded'
        );
    });

    it('sets color and the opacity properly for the base structure and the chain', () => {
        const scriptGenerator = new PyMolScriptGenerator();

        const setTransparencyStub = sinon.stub(
            scriptGenerator as any,
            'setTransparency'
        );
        const setColorStub = sinon.stub(scriptGenerator as any, 'setColor');

        scriptGenerator.generateScript('3pxe', 'B', residues, props);

        assert.isTrue(
            setColorStub.withArgs('#888888').calledOnce,
            'chain color should be to set #888888 only once'
        );

        assert.isTrue(
            setTransparencyStub.withArgs(0).calledOnce,
            'chain transparency should be to set to 0'
        );

        assert.isTrue(
            setColorStub.withArgs('#DDDDDD').calledOnce,
            'base color should be to set #DDDDDD only once'
        );

        assert.isTrue(
            setTransparencyStub.withArgs(5).calledOnce,
            'base transparency should be to set to 5/10'
        );
    });

    it('applies correct protein style wrt the corresponding prop', () => {
        const scriptGenerator = new PyMolScriptGenerator();
        let script: string = '';

        props.proteinScheme = ProteinScheme.TRACE;
        script = scriptGenerator.generateScript('3pxe', 'B', residues, props);
        assert.notEqual(script.indexOf('hide everything; show ribbon;'), -1);

        props.proteinScheme = ProteinScheme.SPACE_FILLING;
        script = scriptGenerator.generateScript('3pxe', 'B', residues, props);
        assert.notEqual(script.indexOf('hide everything; show spheres;'), -1);

        props.proteinScheme = ProteinScheme.CARTOON;
        script = scriptGenerator.generateScript('3pxe', 'B', residues, props);
        assert.notEqual(script.indexOf('hide everything; show cartoon;'), -1);
    });

    it('does not display bound molecules when the corresponding prop is set to false', () => {
        const scriptGenerator = new PyMolScriptGenerator();

        props.displayBoundMolecules = false;
        const script = scriptGenerator.generateScript(
            '3pxe',
            'B',
            residues,
            props
        );

        assert.notEqual(
            script.indexOf(
                'hide everything, not resn asp+glu+arg+lys+his+asn+thr+cys+gln+tyr+ser+gly+ala+leu+val+ile+met+trp+phe+pro;'
            ),
            -1
        );
    });

    it('applies correct protein colors wrt the corresponding prop', () => {
        const scriptGenerator = new PyMolScriptGenerator();
        const setColorStub = sinon.stub(scriptGenerator as any, 'setColor');
        let script: string = '';

        props.proteinScheme = ProteinScheme.TRACE;
        props.proteinColor = ProteinColor.SECONDARY_STRUCTURE;
        script = scriptGenerator.generateScript('3pxe', 'B', residues, props);

        assert.notEqual(script.indexOf('select (chain B) and (ss h);'), -1);
        assert.isTrue(
            setColorStub.withArgs('#FFA500').calledOnce,
            'Alpha helices should be colored with 0xFFA500 when SECONDARY_STRUCTURE is selected'
        );
        assert.notEqual(script.indexOf('select (chain B) and (ss s);'), -1);
        assert.isTrue(
            setColorStub.withArgs('#0000FF').calledOnce,
            'Beta sheets should be colored with 0x0000FF when SECONDARY_STRUCTURE is selected'
        );

        props.proteinScheme = ProteinScheme.CARTOON;
        props.proteinColor = ProteinColor.NC_RAINBOW;
        script = scriptGenerator.generateScript('3pxe', 'B', residues, props);

        assert.notEqual(
            script.indexOf('spectrum count, rainbow_rev, sele;'),
            -1,
            'Chain should be colored with rainbow spectrum when NC_RAINBOW is selected'
        );

        props.proteinScheme = ProteinScheme.SPACE_FILLING;
        props.proteinColor = ProteinColor.ATOM_TYPE;
        script = scriptGenerator.generateScript('3pxe', 'B', residues, props);

        assert.notEqual(
            script.indexOf('util.cbaw sele;'),
            -1,
            'Chain should be colored with default element colors when ATOM_TYPE is selected'
        );
    });

    it('colors residues with correct colors', () => {
        const scriptGenerator = new PyMolScriptGenerator();

        const setColorStub = sinon.stub(scriptGenerator as any, 'setColor');
        const selectResiduesStub = sinon.stub(
            scriptGenerator as any,
            'selectResidues'
        );
        scriptGenerator.generateScript('3pxe', 'B', residues, props);

        assert.isTrue(selectResiduesStub.calledWith(['122', '1815'], 'B'));
        assert.isTrue(
            setColorStub.calledWith('#FFDD00'),
            'Residues 122 and 1815 should be colored with highlight color (0xFFDD00) when MUTATION_TYPE selected'
        );

        assert.isTrue(selectResiduesStub.calledWith(['1710'], 'B'));
        assert.isTrue(
            setColorStub.withArgs('#FF0000').calledOnce,
            'Residue 1710 should be colored with 0xFF0000 when MUTATION_TYPE selected'
        );

        assert.isTrue(selectResiduesStub.calledWith(['1835'], 'B'));
        assert.isTrue(
            setColorStub.withArgs('#00FFFF').calledOnce,
            'Residue 1835 should be colored with 0x00FFFF when MUTATION_TYPE selected'
        );

        setColorStub.reset();
        selectResiduesStub.reset();
        props.mutationColor = MutationColor.UNIFORM;
        scriptGenerator.generateScript('3pxe', 'B', residues, props);

        assert.isTrue(selectResiduesStub.calledWith(['122', '1815'], 'B'));
        assert.isTrue(
            setColorStub.calledWith('#FFDD00'),
            'Residues 122 and 1815 should be colored with highlight color (0xFFDD00) when UNIFORM selected'
        );

        assert.isTrue(selectResiduesStub.calledWith(['1710'], 'B'));
        assert.isTrue(selectResiduesStub.calledWith(['1835'], 'B'));
        assert.isTrue(
            setColorStub.calledWith('#8A2BE2'),
            'Residues 1710 and 1835 should be colored uniform color (0x8A2BE2) when UNIFORM selected'
        );

        setColorStub.reset();
        selectResiduesStub.reset();
        props.mutationColor = MutationColor.NONE;
        scriptGenerator.generateScript('3pxe', 'B', residues, props);

        assert.isTrue(selectResiduesStub.calledWith(['122', '1815'], 'B'));
        assert.isTrue(
            setColorStub.calledWith('#FFDD00'),
            'Residues 122 and 1815 should be colored with highlight color (0xFFDD00) when NONE selected'
        );

        assert.isTrue(selectResiduesStub.withArgs(['1710'], 'B').notCalled);
        assert.isTrue(selectResiduesStub.withArgs(['1835'], 'B').notCalled);
        assert.isTrue(
            setColorStub.withArgs('#8A2BE2').notCalled,
            'Residues 1710 and 1835 should NOT be colored uniform color (0x8A2BE2) when NONE selected'
        );
        assert.isTrue(
            setColorStub.withArgs('#FF0000').notCalled,
            'Residue 1710 should NOT be colored with 0xFF0000 when NONE selected'
        );
        assert.isTrue(
            setColorStub.withArgs('#00FFFF').notCalled,
            'Residue 1835 should NOT be colored with 0x00FFFF when NONE selected'
        );
    });

    it('displays side chain atoms wrt the corresponding props', () => {
        const scriptGenerator = new PyMolScriptGenerator();

        const selectSideChainsStub = sinon.stub(
            scriptGenerator as any,
            'selectSideChains'
        );

        // only selected residues should have visible side chains if sideChain is set to SELECTED

        props.sideChain = SideChain.SELECTED;
        props.mutationColor = MutationColor.MUTATION_TYPE;
        scriptGenerator.generateScript('3pxe', 'B', residues, props);

        assert.isTrue(
            selectSideChainsStub.withArgs(['122', '1815'], 'B').calledOnce,
            'Side chains for residues 122 and 1815 should be displayed when SELECTED active'
        );
        assert.isTrue(
            selectSideChainsStub.withArgs(['1710']).notCalled,
            'Side chain for residue 1710 should NOT be displayed when SELECTED active'
        );
        assert.isTrue(
            selectSideChainsStub.withArgs(['1835']).notCalled,
            'Side chain for residue 1815 should NOT be displayed when SELECTED active'
        );

        // all residues should have visible side chains if sideChain is set to ALL

        selectSideChainsStub.reset();
        props.sideChain = SideChain.ALL;
        props.mutationColor = MutationColor.UNIFORM;
        scriptGenerator.generateScript('3pxe', 'B', residues, props);

        assert.isTrue(
            selectSideChainsStub.withArgs(['122', '1815'], 'B').calledOnce,
            'Side chains for residues 122 and 1815 should be displayed when ALL & UNIFORM active'
        );
        assert.isTrue(
            selectSideChainsStub.withArgs(['1710'], 'B').calledOnce,
            'Side chain for residue 1710 should be displayed when ALL & UNIFORM active'
        );
        assert.isTrue(
            selectSideChainsStub.withArgs(['1835'], 'B').calledOnce,
            'Side chain for residue 1815 should be displayed when ALL & UNIFORM active'
        );

        // none of the residues should have visible side chains if sideChain is set to NONE

        selectSideChainsStub.reset();
        props.sideChain = SideChain.NONE;
        props.mutationColor = MutationColor.MUTATION_TYPE;
        scriptGenerator.generateScript('3pxe', 'B', residues, props);

        assert.isTrue(
            selectSideChainsStub.withArgs(['122', '1815']).notCalled,
            'Side chains for residues 122 and 1815 should NOT be displayed when NONE active'
        );
        assert.isTrue(
            selectSideChainsStub.withArgs(['1710']).notCalled,
            'Side chain for residue 1710 should NOT be displayed when NONE active'
        );
        assert.isTrue(
            selectSideChainsStub.withArgs(['1835']).notCalled,
            'Side chain for residue 1815 should NOT be displayed when NONE active'
        );
    });
});
