import Tooltip from 'rc-tooltip';
import { getNCBIlink } from '../lib/urls';
import * as React from 'react';

import { ReferenceList } from './ReferenceList';

import mainStyles from './main.module.scss';
import { parseOncoKBAbstractReference } from '../util/OncoKbUtils';

export default class RefComponent extends React.Component<{
    content: string;
    componentType: 'tooltip' | 'linkout';
}> {
    render() {
        const defaultRefComponent = <span>{this.props.content}</span>;

        const parts = this.props.content.split(/pmid|nct|abstract/i);

        if (parts.length < 2) {
            return defaultRefComponent;
        }

        const ids = parts[1].match(/[0-9]+/g);
        let prefix: string | undefined;
        let linkComponent: JSX.Element | undefined;
        let link: string | undefined;
        let linkText: string | undefined;

        const parsedAbstract = parseOncoKBAbstractReference(this.props.content);
        if (!!parsedAbstract) {
            linkText = parsedAbstract.abstractTitle;
            link = parsedAbstract.abstractLink;
            prefix = 'Abstract: ';
        } else {
            if (!ids) {
                return defaultRefComponent;
            }

            if (this.props.content.toLowerCase().includes('pmid')) {
                prefix = 'PMID: ';
            } else if (this.props.content.toLowerCase().includes('nct')) {
                prefix = 'NCT';
            } else {
                return defaultRefComponent;
            }

            linkText = ids.join(', ');
            link = getNCBIlink(`/pubmed/${ids.join(',')}`);
        }

        if (prefix) {
            linkComponent = (
                <a target="_blank" rel="noopener noreferrer" href={link}>
                    {`${prefix}${linkText}`}
                </a>
            );
        }

        if (this.props.componentType === 'tooltip') {
            const pmids = !!parsedAbstract
                ? []
                : ids!.map((id: string) => parseInt(id, 10));
            const abstracts = !!parsedAbstract
                ? [{ abstract: linkText, link }]
                : [];
            const tooltipContent = () => (
                <div className={mainStyles['tooltip-refs']}>
                    <ReferenceList pmids={pmids} abstracts={abstracts} />
                </div>
            );

            return (
                <span key={this.props.content}>
                    {parts[0]}
                    <Tooltip
                        overlay={tooltipContent}
                        placement="right"
                        trigger={['hover', 'focus']}
                        destroyTooltipOnHide={true}
                    >
                        <i className="fa fa-book" style={{ color: 'black' }} />
                    </Tooltip>
                    {`)`}
                </span>
            );
        } else if (linkComponent) {
            return (
                <span key={this.props.content}>
                    {parts[0]}
                    {linkComponent}
                    {`)`}
                </span>
            );
        } else {
            return <span>{this.props.content}</span>;
        }
    }
}
