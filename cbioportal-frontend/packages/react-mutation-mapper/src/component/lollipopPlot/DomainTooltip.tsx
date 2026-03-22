import { PfamDomain, PfamDomainRange } from 'genome-nexus-ts-api-client';
import { observer } from 'mobx-react';
import * as React from 'react';

import { MobxCache } from 'cbioportal-utils';

export interface IDomainTooltipProps {
    mutationAlignerCache?: MobxCache<string>;
    range: PfamDomainRange;
    domain: PfamDomain | undefined;
    pfamDomainId: string;
}

interface IMutationAlignerLinkProps {
    mutationAlignerCache?: MobxCache<string>;
    pfamAccession: string;
}

const MutationAlignerLink = observer((props: IMutationAlignerLinkProps) => {
    function getMutationAlignerCacheData(pfamAccession: string) {
        return props.mutationAlignerCache && props.mutationAlignerCache.cache
            ? props.mutationAlignerCache.cache[pfamAccession]
            : null;
    }

    if (props.mutationAlignerCache) {
        props.mutationAlignerCache.get(props.pfamAccession);
    }

    const mutationAlignerCacheData = getMutationAlignerCacheData(
        props.pfamAccession
    );

    return mutationAlignerCacheData &&
        mutationAlignerCacheData.status === 'complete' &&
        mutationAlignerCacheData.data ? (
        <a href={mutationAlignerCacheData.data} target="_blank">
            Mutation Aligner
        </a>
    ) : null;
});

const DomainTooltip = (props: IDomainTooltipProps) => {
    const { range, domain, pfamDomainId } = props;

    const pfamAccession = domain ? domain.pfamAccession : pfamDomainId;

    // if no domain info, then just display the accession
    const domainInfo = domain
        ? `${domain.name}: ${domain.description}`
        : pfamAccession;

    return (
        <div style={{ maxWidth: 200 }}>
            <div>
                {domainInfo} ({range.pfamDomainStart} - {range.pfamDomainEnd})
            </div>
            <div>
                <a
                    style={{ marginRight: '5px' }}
                    href={`http://pfam.xfam.org/family/${pfamAccession}`}
                    target="_blank"
                >
                    PFAM
                </a>
                <MutationAlignerLink
                    mutationAlignerCache={props.mutationAlignerCache}
                    pfamAccession={pfamAccession}
                />
            </div>
        </div>
    );
};

export default DomainTooltip;
