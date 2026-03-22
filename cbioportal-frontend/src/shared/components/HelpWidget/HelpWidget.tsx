import * as React from 'react';
import styles from './styles.module.scss';
import ReactMarkdown from 'react-markdown';
import { getServerConfig } from 'config/config';
import classNames from 'classnames';

import { isWebdriver } from 'cbioportal-frontend-commons';
import { serializeEvent } from 'shared/lib/tracking';

interface IHelpWidgetProps {
    path: string;
}

function parseConfiguration(markdown: string) {
    const items = markdown.trim().split(/URLMATCH:/);

    const parsed = items.reduce((ret: any[], s) => {
        if (s.length) {
            let regexp = s.match(/[^\n]*/)![0];

            regexp = regexp.replace(/\//, '/?');

            ret.push({
                regexp,
                markdown: s.substr(s.indexOf('\n')),
            });
        }
        return ret;
    }, []);

    return parsed;
}

export const HelpWidget: React.FunctionComponent<IHelpWidgetProps> = function({
    path,
}: IHelpWidgetProps) {
    if (isWebdriver()) {
        return null;
    }

    if (!getServerConfig().skin_show_study_help_button) {
        return <></>;
    }

    const confs = parseConfiguration(markdown);

    const conf = confs.find(c => {
        return new RegExp(c.regexp).test(path);
    });

    if (!conf) return <></>;

    const md = conf.markdown.trim();

    let el: JSX.Element;

    el = (
        <>
            <ReactMarkdown linkTarget={'_blank'}>{md}</ReactMarkdown>{' '}
            <i className={'fa fa-book'} />
        </>
    );

    return (
        <div
            data-event={serializeEvent({
                action: 'featureSpecificHelpClick',
                label: conf.regexp,
                category: 'linkout',
            })}
            className={classNames('helpWidget', styles['widget-wrapper'])}
        >
            {el}
        </div>
    );
};

const markdown = `
URLMATCH:results/mutations
[Mutations Tab Help](https://docs.cbioportal.org/user-guide/by-page/#mutations) 

URLMATCH:results/oncoprint
[Oncoprint Help](https://docs.cbioportal.org/user-guide/by-page/#oncoprint)

URLMATCH:results/cancerTypesSummary
[Cancer Type Summary Help](https://docs.cbioportal.org/user-guide/by-page/#cancer-types-summary)

URLMATCH:results/mutualExclusivity
[Mutual Exclusivity Help](https://docs.cbioportal.org/user-guide/by-page/#mutual-exclusivity)

URLMATCH:results/plots
[Plots Help](https://docs.cbioportal.org/user-guide/by-page/#plots)

URLMATCH:results/coexpression
[Coexpression Help](https://docs.cbioportal.org/user-guide/by-page/#co-expression)

URLMATCH:results/comparison
[Comparison/Survival Help](https://docs.cbioportal.org/user-guide/by-page/#comparisonsurvival)

URLMATCH:results/cnSegments
[CN Segments Help](https://docs.cbioportal.org/user-guide/by-page/#cn-segments)

URLMATCH:results/pathways
[Pathways Help](https://docs.cbioportal.org/user-guide/by-page/#pathways)

URLMATCH:results/download
[Download Help](https://docs.cbioportal.org/user-guide/by-page/#downloads)

URLMATCH:comparison/.*
[Group Comparison Help](https://docs.cbioportal.org/user-guide/by-page/#group-comparison)

URLMATCH:study/.*
[Study Page Help](https://docs.cbioportal.org/user-guide/by-page/#study-view)

URLMATCH:patient/.*
[Patient Page Help](https://docs.cbioportal.org/user-guide/by-page/#patient-view)

`;
