import * as React from 'react';
import _ from 'lodash';
import { PdbHeader } from 'genome-nexus-ts-api-client';
import PdbHeaderCache from 'shared/cache/PdbHeaderCache';
import { IPdbChain } from 'shared/model/Pdb';

export default class OrganismColumnFormatter {
    public static getOrganism(pdbHeader: PdbHeader, chainId: string): string {
        // source: https://github.com/cBioPortal/mutation-mapper/blob/1475afb5a42c18a3859f45741c68908b34d08692/src/js/util/PdbDataUtil.js#L206

        let organism = 'NA';

        _.find(pdbHeader.compound, (mol: any) => {
            if (
                _.indexOf(mol.chain, chainId.toLowerCase()) != -1 &&
                (pdbHeader.source as any)[mol.mol_id] != null
            ) {
                // chain is associated with this mol,
                // get the organism info from the source
                organism =
                    (pdbHeader.source as any)[mol.mol_id].organism_scientific ||
                    organism;

                return mol;
            }
        });

        return organism;
    }

    public static getOrganismFromCache(
        cache: PdbHeaderCache | undefined,
        chain: IPdbChain
    ): string {
        if (!cache) {
            return '';
        }
        const cacheData = cache.get(chain.pdbId);
        if (cacheData && cacheData.data) {
            return OrganismColumnFormatter.getOrganism(
                cacheData.data,
                chain.chain
            );
        } else {
            return '';
        }
    }
}
