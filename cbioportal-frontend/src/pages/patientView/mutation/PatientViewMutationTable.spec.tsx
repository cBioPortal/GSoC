import React from 'react';
import { mount, ReactWrapper } from 'enzyme';
import { assert } from 'chai';
import { default as PatientViewMutationTable } from './PatientViewMutationTable';
import { MutationTableColumnType } from 'shared/components/mutationTable/MutationTable';
import { GeneFilterOption } from './GeneFilterMenu';
import { USE_DEFAULT_PUBLIC_INSTANCE_FOR_ONCOKB } from 'react-mutation-mapper';

function hasColumn(
    tableWrapper: ReactWrapper<any, any>,
    columnName: string
): boolean {
    const columns: string[] = [];
    tableWrapper.find('th span').map((span: ReactWrapper<any, any>) => {
        columns.push(span.text());
    });
    return columns.indexOf(columnName) > -1;
}

function getTable(
    samples: string[],
    mrnaId?: string,
    cnaId?: string
): ReactWrapper<any, any> {
    return mount(
        <PatientViewMutationTable
            sampleManager={null}
            sampleIds={samples}
            sampleToGenePanelId={{}}
            genePanelIdToEntrezGeneIds={{}}
            mrnaExprRankMolecularProfileId={mrnaId}
            usingPublicOncoKbInstance={USE_DEFAULT_PUBLIC_INSTANCE_FOR_ONCOKB}
            discreteCNAMolecularProfileId={cnaId}
            currentGeneFilter={GeneFilterOption.ANY_SAMPLE}
            columns={[
                MutationTableColumnType.GENE,
                MutationTableColumnType.MRNA_EXPR,
                MutationTableColumnType.SAMPLES,
                MutationTableColumnType.COPY_NUM,
            ]}
            data={[]}
            generateGenomeNexusHgvsgUrl={(s: string) => s}
            existsSomeMutationWithAscnProperty={{}}
        />
    );
}

describe('PatientViewMutationTable', () => {
    it('hides mrna expr column if no expression profile is available, or theres more than one sample', () => {
        assert(
            !hasColumn(getTable(['sampleA']), 'mRNA Expr.'),
            'No expression profile'
        );

        assert(
            !hasColumn(
                getTable(['sampleA', 'sampleB'], 'mrnaId'),
                'mRNA Expr.'
            ),
            'More than one sample'
        );

        assert(
            !hasColumn(getTable(['sampleA', 'sampleB']), 'mRNA Expr.'),
            'No expression profile and more than one sample'
        ); //
    });

    it('shows mrna expr column if theres an expression profile and exactly one sample', () => {
        assert(hasColumn(getTable(['sampleA'], '["sampleA"]'), 'mRNA Expr.'));
    });

    it('should have Samples column resizable', () => {
        const aTable = getTable(['sampleA', 'sampleB']);
        const res = aTable.find('.columnResizer');
        assert.equal(res.length, 2);
    });

    it("hides copy number column if there's more than one sample", () => {
        assert.isFalse(
            hasColumn(
                getTable(['sampleA', 'sampleB'], undefined, 'cnaId'),
                'Copy #'
            )
        );
    });

    it('hides the samples column if theres less than two samples', () => {
        assert(
            !hasColumn(getTable([]), 'Samples'),
            'Hides with no samples (this shouldnt happen though)'
        );
        assert(
            !hasColumn(getTable(['sampleA']), 'Samples'),
            'Hides with one sample'
        );
    });

    it('shows the samples column if theres more than one sample', () => {
        assert(hasColumn(getTable(['sampleA', 'sampleB']), 'Samples'));
    });

    it('hides the copy number column if theres no discrete cna profile', () => {
        assert(!hasColumn(getTable(['sampleA']), 'Copy #'));
    });

    /*it("shows the copy number column if theres a discrete cna profile", ()=>{
        assert(hasColumn(getTable(["sampleA"], undefined, "cnaId"), "Copy #"));
    });*/
});
