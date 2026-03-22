import * as React from 'react';
import _ from 'lodash';
import { ICivicVariantSummary } from 'cbioportal-utils';

import civicTextLogo from '../../images/civic_text_logo.png';
import './civicCard.scss';

export interface ICivicCardProps {
    title: string;
    geneName: string;
    geneDescription: string;
    geneUrl: string;
    variants: { [name: string]: ICivicVariantSummary };
}

export default class CivicCard extends React.Component<ICivicCardProps, {}> {
    /**
     * Generate variants
     * @param variantMap
     * @returns {JSX.Element[]}
     */
    public generateVariants(variantMap: {
        [name: string]: ICivicVariantSummary;
    }) {
        const list: JSX.Element[] = [];

        if (_.isEmpty(variantMap)) {
            list.push(this.variantItem('_naVariant_'));
        } else {
            for (let name in variantMap) {
                let variant = variantMap[name];
                let entryTypes = Object.entries(variant.evidenceCounts)
                    .filter(([key, value]) => value !== 0)
                    .map(([key, value]) => `${key.slice(0, -5)}: ${value}`) // Remove "Count" substring from key
                    .join(', ');
                list.push(
                    this.variantItem(
                        name,
                        variant.url,
                        variant.name,
                        entryTypes,
                        variant.description
                    )
                );
            }
        }

        return list;
    }

    /**
     * Get variant item
     * @param url
     * @param name
     * @param entryTypes
     * @param description
     * @returns {any}
     */
    public variantItem(
        key: string,
        url?: string,
        name?: string,
        entryTypes?: string,
        description?: string
    ) {
        let result;

        if (url || name || entryTypes || description) {
            result = (
                <div key={key} className="civic-card-variant">
                    <div className="civic-card-variant-header">
                        <span className="civic-card-variant-name">
                            <a href={url} target="_blank">
                                {name}
                            </a>
                        </span>
                        <span className="civic-card-variant-entry-types">
                            {' '}
                            Entries: {entryTypes}
                        </span>
                    </div>
                    <div className="civic-card-variant-description summary">
                        {description}
                    </div>
                </div>
            );
        } else {
            result = (
                <div key={key} className="civic-card-variant">
                    <div className="civic-card-variant-description summary">
                        Information about the oncogenic activity of this
                        alteration is not yet available in CIViC.
                    </div>
                </div>
            );
        }

        return result;
    }

    /**
     * Render civic card component
     * @returns {any}
     */
    public render() {
        return (
            <div className="civic-card">
                <span>
                    <div className="col s12 tip-header">{this.props.title}</div>
                    <div className="col s12 civic-card-content">
                        <div className="col s12 civic-card-gene">
                            <p>
                                <span className="civic-card-gene-name">
                                    <a
                                        href={this.props.geneUrl}
                                        target="_blank"
                                    >
                                        <b>{this.props.geneName}</b>
                                    </a>
                                </span>{' '}
                                - {this.props.geneDescription}
                            </p>
                        </div>
                        <div className="col s12">
                            <ul>
                                {this.generateVariants(this.props.variants)}
                            </ul>
                        </div>

                        <div className="item disclaimer">
                            <span>
                                Disclaimer: This resource is intended for purely
                                research purposes. It should not be used for
                                emergencies or medical or professional advice.
                            </span>
                        </div>
                    </div>
                </span>

                <div className="item footer">
                    <a href={this.props.geneUrl} target="_blank">
                        <img
                            src={civicTextLogo}
                            className="civic-logo"
                            alt="CIViC"
                        />
                    </a>
                </div>
            </div>
        );
    }
}
