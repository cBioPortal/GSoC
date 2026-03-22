import * as React from 'react';

export default class OncoKBSuggestAnnotationLinkout extends React.Component<{
    gene: string;
}> {
    render() {
        return (
            <div>
                <span>The gene is listed under </span>
                <a href="https://www.oncokb.org/cancerGenes" target="_blank">
                    OncoKB Cancer Gene List
                </a>
                <span> but hasn't been curated yet. Please feel free to </span>
                <a
                    target="_blank"
                    href={`mailto:contact@oncokb.org?subject=Annotation suggestion for ${this.props.gene}&&body=Thank you for using OncoKB™.%0APlease provide the following information for ${this.props.gene} curation:%0A%0AEvidence:%0APMIDs:%0AAbstracts:`}
                    title="suggest to annotate this gene"
                >
                    suggest the team annotate the gene
                </a>
                .
            </div>
        );
    }
}
