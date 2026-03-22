import * as React from 'react';
import { If, Then, Else } from 'react-if';

const ONCOKB_URL = 'https://oncokb.org';

export function getOncoKBReferenceInfo(
    hugoGeneSymbol: string,
    isCancerGene: boolean,
    oncokbAnnotated: boolean,
    isOncogene: boolean,
    isTumorSuppressorGene: boolean
): JSX.Element | undefined {
    if (isCancerGene) {
        let content = '';

        if (isOncogene || isTumorSuppressorGene) {
            content = ' as a ';
            let subContent = [];
            if (isOncogene) {
                subContent.push('oncogene');
            }
            if (isTumorSuppressorGene) {
                subContent.push('tumor suppressor gene');
            }
            content = `${content} ${subContent.join(' and ')}`;
        }
        return (
            <span>
                <If condition={oncokbAnnotated}>
                    <Then>
                        <a
                            href={`${ONCOKB_URL}/gene/${hugoGeneSymbol}`}
                            target="_blank"
                        >
                            {hugoGeneSymbol}
                        </a>
                    </Then>
                    <Else>
                        <span>{hugoGeneSymbol}</span>
                    </Else>
                </If>
                <span> is included in the </span>
                {getOncoKBCancerGeneListLinkout()}
                {(isOncogene || isTumorSuppressorGene) && (
                    <span>{content}</span>
                )}
                .
            </span>
        );
    }
    return undefined;
}

export function getOncoKBCancerGeneListLinkout() {
    return (
        <a href={`${ONCOKB_URL}/cancerGenes`} target="_blank">
            OncoKB™ Cancer Gene List
        </a>
    );
}
