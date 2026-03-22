import { DefaultTooltip } from 'cbioportal-frontend-commons';
import { generateHgvsgByMutation, Mutation } from 'cbioportal-utils';
import { observer } from 'mobx-react';
import * as React from 'react';

import { defaultSortMethod } from 'cbioportal-utils';

import hgvsgStyles from './hgvsg.module.scss';

type HgvsgProps = {
    mutation: Mutation;
    constructHref?: (hgvsg: string) => string;
    constructLink?: (
        hgvsg: string,
        content: JSX.Element,
        href?: string
    ) => JSX.Element;
    mainContent?: (hgvsg?: string) => JSX.Element;
    tooltipContent?: (hgvsg?: string) => JSX.Element;
    disableTooltip?: boolean;
};

export function hgvsgSortMethod(a: string, b: string) {
    return defaultSortMethod(a, b);
}

@observer
export default class Hgvsg extends React.Component<HgvsgProps, {}> {
    public static defaultProps: Partial<HgvsgProps> = {
        constructLink: (hgvsg: string, content: JSX.Element, href?: string) => (
            <a
                href={href || `https:/www.genomenexus.org/variant/${hgvsg}`}
                target="_blank"
                rel="noopener noreferrer"
            >
                {content}
            </a>
        ),
        mainContent: (hgvsg?: string) => (
            <>
                {hgvsg}&nbsp;
                <i className="fa fa-external-link" />
            </>
        ),
        tooltipContent: () => (
            <>
                Genome Nexus
                <div className={hgvsgStyles['genome-nexus-logo']} />
            </>
        ),
    };

    get hgvsg() {
        return generateHgvsgByMutation(this.props.mutation);
    }

    public render() {
        const constructLink = this.props.constructLink!;
        const mainContent = this.props.mainContent!;
        const tooltipContent = this.props.tooltipContent!;

        if (!this.hgvsg) {
            return <span />;
        } else {
            const href = this.props.constructHref
                ? this.props.constructHref(this.hgvsg)
                : undefined;

            const content = (
                <span className={hgvsgStyles['hgvsg-data']}>
                    {constructLink(this.hgvsg, mainContent(this.hgvsg), href)}
                </span>
            );

            return this.props.disableTooltip ? (
                content
            ) : (
                <DefaultTooltip
                    placement="topLeft"
                    overlay={
                        <div>
                            {this.hgvsg}
                            <br />
                            Click to see this variant on &nbsp;
                            {constructLink(
                                this.hgvsg,
                                tooltipContent(this.hgvsg)
                            )}
                        </div>
                    }
                >
                    {content}
                </DefaultTooltip>
            );
        }
    }
}
