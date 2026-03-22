import * as React from 'react';
import RefComponent from './RefComponent';

type SummaryWithRefsProps = {
    content: string | undefined;
    type: 'tooltip' | 'linkout';
};

export default class SummaryWithRefs extends React.Component<
    SummaryWithRefsProps
> {
    render() {
        if (!this.props.content) {
            return <span />;
        }

        const content: Array<JSX.Element> = [];

        // example delimiters:
        //     (PMID: 11900253)
        //     (PMID: 11753428, 16007150, 21467160)
        //     (cBioPortal, MSKCC, May 2015, PMID: 24718888)
        //     (NCT1234567)
        //     (Abstract: Fakih et al. Abstract# 3003, ASCO 2019. https://meetinglibrary.asco.org/record/12411/Abstract)
        const regex = /(\(.*?[PMID|NCT|Abstract].*?\))/i;

        // split the string with delimiters included
        const parts = this.props.content.split(regex);

        parts.forEach((part: string) => {
            // if delimiter convert to a JSX component
            if (part.match(regex)) {
                content.push(
                    <RefComponent
                        componentType={this.props.type}
                        content={part}
                    />
                );
            } else {
                content.push(<span>{part}</span>);
            }
        });

        return <span>{content}</span>;
    }
}
