import { DefaultTooltip } from 'cbioportal-frontend-commons';
import { observer } from 'mobx-react';
import * as React from 'react';
import { GnomadFrequency, HotspotAnnotation } from 'react-mutation-mapper';

import { MyVariantInfo, VariantAnnotation } from 'genome-nexus-ts-api-client';
import featureTableStyle from '../featureTable/FeatureTable.module.scss';
import {
    extractGenomicLocation,
    genomicLocationString,
    IHotspotIndex,
    is3dHotspot,
    isLinearClusterHotspot,
    Mutation,
} from 'cbioportal-utils';
import { computed, makeObservable } from 'mobx';
import MskImpact from './MskImpact';

interface IGenralPopulationPrevalenceProps {
    myVariantInfo?: MyVariantInfo;
    chromosome: string | null;
    mutation: Mutation;
    variantAnnotation?: VariantAnnotation;
}

interface IVcf {
    chrom: string;
    ref: string;
    alt: string;
    pos: number;
}

@observer
class GenralPopulationPrevalence extends React.Component<
    IGenralPopulationPrevalenceProps
> {
    constructor(props: IGenralPopulationPrevalenceProps) {
        super(props);
        makeObservable(this);
    }

    @computed get indexedHotspots() {
        const indexHotspot: IHotspotIndex = {};
        const genomicLocation = extractGenomicLocation(this.props.mutation);
        if (
            genomicLocation &&
            this.props.variantAnnotation?.hotspots?.annotation?.[0]
        ) {
            const aggregatedHotspots = {
                genomicLocation: genomicLocation,
                hotspots: this.props.variantAnnotation.hotspots.annotation[0],
            };
            indexHotspot[
                genomicLocationString(genomicLocation)
            ] = aggregatedHotspots;
        }
        return indexHotspot;
    }

    public gnomad(
        myVariantInfo: MyVariantInfo | undefined,
        chromosome: string | null
    ) {
        // generate gnomad url
        let gnomadUrl = 'https://gnomad.broadinstitute.org/';
        if (myVariantInfo && myVariantInfo.vcf && chromosome) {
            const vcfVariant: IVcf = {
                chrom: chromosome,
                ref: myVariantInfo.vcf.ref,
                alt: myVariantInfo.vcf.alt,
                pos: Number(myVariantInfo.vcf.position),
            };
            gnomadUrl = `https://gnomad.broadinstitute.org/variant/${vcfVariant.chrom}-${vcfVariant.pos}-${vcfVariant.ref}-${vcfVariant.alt}`;
        }

        if (
            this.props.myVariantInfo &&
            (this.props.myVariantInfo.gnomadExome ||
                this.props.myVariantInfo.gnomadGenome)
        ) {
            return (
                <div className={featureTableStyle['feature-table-layout']}>
                    <div className={featureTableStyle['data-source']}>
                        {this.gnomadTooltip(gnomadUrl)}
                    </div>
                    <div className={featureTableStyle['data-with-link']}>
                        <a
                            href={gnomadUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            <GnomadFrequency
                                myVariantInfo={this.props.myVariantInfo}
                            />
                        </a>
                    </div>
                </div>
            );
        } else {
            return (
                <div className={featureTableStyle['feature-table-layout']}>
                    <div className={featureTableStyle['data-source']}>
                        {this.gnomadTooltip(gnomadUrl)}
                    </div>
                    <div className={featureTableStyle['data-with-link']}>
                        <a
                            href={gnomadUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            N/A
                        </a>
                    </div>
                </div>
            );
        }
    }

    public gnomadTooltip(gnomadUrl: string) {
        return (
            <DefaultTooltip
                placement="top"
                overlay={
                    <span>
                        <a
                            href={gnomadUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            gnomAD
                        </a>
                        &nbsp;population allele frequencies. Overall population
                        <br />
                        allele frequency is shown. Hover over a frequency to see
                        <br />
                        the frequency for each specific population.
                    </span>
                }
            >
                <a href={gnomadUrl} target="_blank" rel="noopener noreferrer">
                    gnomAD&nbsp;
                    <i className="fas fa-external-link-alt" />
                </a>
            </DefaultTooltip>
        );
    }

    public dbsnp(myVariantInfo: MyVariantInfo | undefined) {
        const dbsnpUrl =
            myVariantInfo && myVariantInfo.dbsnp && myVariantInfo.dbsnp.rsid
                ? `https://www.ncbi.nlm.nih.gov/snp/${myVariantInfo.dbsnp.rsid}`
                : 'https://www.ncbi.nlm.nih.gov/snp/';
        if (
            this.props.myVariantInfo &&
            this.props.myVariantInfo.dbsnp &&
            this.props.myVariantInfo.dbsnp.rsid
        ) {
            return (
                <div className={featureTableStyle['feature-table-layout']}>
                    <div className={featureTableStyle['data-source']}>
                        {this.dbsnpToolTip(dbsnpUrl)}
                    </div>
                    <div className={featureTableStyle['data-with-link']}>
                        <a
                            href={dbsnpUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            {this.props.myVariantInfo.dbsnp.rsid}
                        </a>
                    </div>
                </div>
            );
        } else {
            return (
                <div className={featureTableStyle['feature-table-layout']}>
                    <div className={featureTableStyle['data-source']}>
                        {this.dbsnpToolTip(dbsnpUrl)}
                    </div>
                    <div className={featureTableStyle['data-with-link']}>
                        <a
                            href={dbsnpUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            N/A
                        </a>
                    </div>
                </div>
            );
        }
    }

    public dbsnpToolTip(dbsnpUrl: string) {
        return (
            <DefaultTooltip
                placement="top"
                overlay={
                    <span>
                        The Single Nucleotide Polymorphism Database (
                        <a
                            href={dbsnpUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            dbSNP
                        </a>
                        )<br />
                        is a free public archive for genetic variation within
                        and
                        <br />
                        across different species.
                    </span>
                }
            >
                <a href={dbsnpUrl} target="_blank" rel="noopener noreferrer">
                    dbSNP&nbsp;
                    <i className="fas fa-external-link-alt" />
                </a>
            </DefaultTooltip>
        );
    }

    private hotspotToolTip() {
        return (
            <DefaultTooltip
                placement="top"
                overlay={
                    <span>
                        <a
                            href={'https://www.cancerhotspots.org/#/home'}
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            CancerHotspots.org
                        </a>{' '}
                        is a resource of recurrent mutational hotspots in tumor
                        <br />
                        samples of various cancer types.
                    </span>
                }
            >
                <a
                    href={'https://www.cancerhotspots.org/#/home'}
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    CancerHotspots.org
                </a>
            </DefaultTooltip>
        );
    }

    private hotspotData() {
        const isCancerHotspot = isLinearClusterHotspot(
            this.props.mutation,
            this.indexedHotspots
        );
        const is3DCancerHotspot = is3dHotspot(
            this.props.mutation,
            this.indexedHotspots
        );
        if (isCancerHotspot || is3DCancerHotspot) {
            return (
                <HotspotAnnotation
                    isHotspot={isCancerHotspot}
                    is3dHotspot={is3DCancerHotspot}
                    status={'complete'}
                />
            );
        } else {
            return 'N/A';
        }
    }

    private hotspot() {
        return (
            <div className={featureTableStyle['feature-table-layout']}>
                <div className={featureTableStyle['data-source']}>
                    {this.hotspotToolTip()}
                </div>
                <div className={featureTableStyle['logo-image']}>
                    {this.hotspotData()}
                </div>
            </div>
        );
    }

    public render() {
        return (
            <div>
                {this.gnomad(this.props.myVariantInfo, this.props.chromosome)}
                {this.dbsnp(this.props.myVariantInfo)}
                {this.hotspot()}
                <MskImpact
                    signalAnnotation={
                        this.props.variantAnnotation?.signalAnnotation
                    }
                />
            </div>
        );
    }
}

export default GenralPopulationPrevalence;
