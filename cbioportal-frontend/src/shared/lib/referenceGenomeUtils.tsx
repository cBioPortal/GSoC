import React from 'react';
import { CancerStudy } from 'cbioportal-ts-api-client';
import _ from 'lodash';
import { DefaultTooltip } from 'cbioportal-frontend-commons';

export const REFERENCE_GENOME = {
    grch37: {
        NCBI: 'GRCh37',
        UCSC: 'hg19',
    },
    grch38: {
        NCBI: 'GRCh38',
        UCSC: 'hg38',
    },
    grcm38: {
        NCBI: 'GRCm38',
        UCSC: 'mm10',
    },
};

export const GENOME_ID_TO_GENOME_BUILD = {
    GRCh37: 'GRCh37',
    '37': 'GRCh37',
    hg19: 'GRCh37',
    GRCh38: 'GRCh38',
    '38': 'GRCh38',
    hg38: 'GRCh38',
    GRCm38: 'GRCm38',
    mm10: 'GRCm38',
};

export function isMixedReferenceGenome(studies: CancerStudy[]): boolean {
    const isAllStudiesGRCh37 = _.every(studies, study => {
        return isGrch37(study.referenceGenome);
    });
    const isAllStudiesGRCh38 = _.every(studies, study => {
        return isGrch38(study.referenceGenome);
    });
    const isAllStudiesGRCm38 = _.every(studies, study => {
        return isGrcm38(study.referenceGenome);
    });
    // return true if there are mixed studies
    return !(isAllStudiesGRCh37 || isAllStudiesGRCh38 || isAllStudiesGRCm38);
}

export function mixedReferenceGenomeWarning() {
    return (
        <DefaultTooltip
            placement="right"
            overlay={
                <div>
                    You are combining studies with molecular data based on both
                    GRCh37/hg19 and GRCh38/hg38. This is not fully supported
                    yet. Please double check your findings
                </div>
            }
            destroyTooltipOnHide={true}
        >
            <i
                className={'banner-icon fa fa-md fa-exclamation-triangle'}
                style={{
                    verticalAlign: 'middle !important',
                    marginLeft: 6,
                }}
            />
        </DefaultTooltip>
    );
}

export function isGrch37(genomeBuild: string) {
    return (
        REFERENCE_GENOME.grch37.NCBI.match(new RegExp(genomeBuild, 'i')) ||
        REFERENCE_GENOME.grch37.UCSC.match(new RegExp(genomeBuild, 'i'))
    );
}

export function isGrch38(genomeBuild: string) {
    return (
        REFERENCE_GENOME.grch38.NCBI.match(new RegExp(genomeBuild, 'i')) ||
        REFERENCE_GENOME.grch38.UCSC.match(new RegExp(genomeBuild, 'i'))
    );
}

export function isGrcm38(genomeBuild: string) {
    return (
        REFERENCE_GENOME.grcm38.NCBI.match(new RegExp(genomeBuild, 'i')) ||
        REFERENCE_GENOME.grcm38.UCSC.match(new RegExp(genomeBuild, 'i'))
    );
}

export function formatStudyReferenceGenome(genomeBuild: string) {
    if (isGrch37(genomeBuild)) {
        return (
            REFERENCE_GENOME.grch37.NCBI + '/' + REFERENCE_GENOME.grch37.UCSC
        );
    } else if (isGrch38(genomeBuild)) {
        return (
            REFERENCE_GENOME.grch38.NCBI + '/' + REFERENCE_GENOME.grch38.UCSC
        );
    } else if (isGrcm38(genomeBuild)) {
        return (
            REFERENCE_GENOME.grcm38.NCBI + '/' + REFERENCE_GENOME.grcm38.UCSC
        );
    }
}
