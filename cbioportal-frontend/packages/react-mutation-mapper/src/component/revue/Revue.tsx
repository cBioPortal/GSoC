import React from 'react';
import { DefaultTooltip } from 'cbioportal-frontend-commons';
import { Vues as VUE } from 'genome-nexus-ts-api-client';
import annotationStyles from '../column/annotation.module.scss';
import revueLogo from '../../images/vue_logo.png';

export const RevueTooltipContent: React.FunctionComponent<{
    vue: VUE;
}> = props => {
    return (
        <ul>
            <li>
                Predicted Effect by{` `}
                {
                    <a
                        href="https://useast.ensembl.org/info/docs/tools/vep/index.html"
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        VEP
                    </a>
                }
                : <strong>{props.vue.defaultEffect}</strong>
            </li>
            <li>
                Revised Protein Effect by{` `}
                {
                    <a
                        href="https://cancerrevue.org"
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        reVUE
                    </a>
                }
                {` (`}
                {props.vue.references.map((reference, index) => (
                    <span key={index}>
                        <a
                            href={`https://pubmed.ncbi.nlm.nih.gov/${reference.pubmedId}/`}
                            rel="noopener noreferrer"
                            target="_blank"
                        >
                            {reference.referenceText}
                        </a>
                        {index < props.vue.references.length - 1 && ';'}
                    </span>
                ))}
                {`): `}
                <strong>{props.vue.revisedProteinEffect}</strong>
            </li>
        </ul>
    );
};

export function sortValue(vue: VUE | undefined): number {
    return 0;
}

export const RevueCell: React.FunctionComponent<{
    vue: VUE;
}> = props => {
    return (
        <DefaultTooltip
            placement="bottom"
            overlay={<RevueTooltipContent vue={props.vue} />}
        >
            <span
                className={`${annotationStyles['annotation-item']}`}
                style={{ display: 'inline-flex' }}
            >
                <img src={revueLogo} alt="reVUE logo" width={14} height={14} />
            </span>
        </DefaultTooltip>
    );
};
