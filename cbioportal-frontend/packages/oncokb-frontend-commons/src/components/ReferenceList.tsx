import { ArticleAbstract } from 'oncokb-ts-api-client';
import * as React from 'react';
import _ from 'lodash';

import ArticleAbstractItem from './ArticleAbstractItem';
import PmidItem from './PmidItem';

import styles from './listGroupItem.module.scss';
import request from 'superagent';

type ReferenceListProps = {
    pmids: number[];
    abstracts: ArticleAbstract[];
};

export const ReferenceList: React.FunctionComponent<ReferenceListProps> = (
    props: ReferenceListProps
) => {
    const [pmidData, setPmidData] = React.useState<{ [uid: string]: any }>({});
    const [apiCalled, setApiCalled] = React.useState(false);

    async function getPmidData(pmids: number[]) {
        let pubMedRecords;
        if (!apiCalled) {
            pmidPending = true;
            pubMedRecords = await new Promise<any>((resolve, reject) => {
                request
                    .post(
                        'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&retmode=json'
                    )
                    .type('form')
                    .send({ id: pmids.join(',') })
                    .end((err, res) => {
                        if (!err && res.ok) {
                            const result = JSON.parse(res.text)?.result || {};
                            delete result.uids;
                            resolve(result);
                        } else {
                            reject(err);
                        }
                    });
            });
        }

        return pubMedRecords;
    }

    let pmidPending = false;

    function isLoading() {
        let pmidLoaded = Object.keys(pmidData).length == props.pmids.length;
        if (pmidData && props.pmids && !pmidPending && !pmidLoaded) {
            pmidPending = true;
            if (!apiCalled) {
                const pubmedData = getPmidData(props.pmids)
                    .then(value => {
                        pmidLoaded = Object.keys(value).length >= 1;
                        setPmidData(value);
                        pmidPending = false;
                    })
                    .catch(err => {
                        pmidPending = false;
                        return false;
                    });
                setApiCalled(true);
            }
            return Object.keys(pmidData).length == 0;
        } else {
            return false;
        }
    }

    if (isLoading()) {
        return <i className="fa fa-spinner fa-pulse fa-2x" />;
    }
    const list: JSX.Element[] = [];

    if (Object.keys(pmidData).length == props.pmids.length) {
        props.pmids.forEach((uid: number) => {
            const pubmedData = pmidData![uid.toString()];
            const articleContent = pubmedData ? pubmedData : null;

            if (articleContent) {
                list.push(
                    <PmidItem
                        title={articleContent.title}
                        author={
                            _.isArray(articleContent.authors) &&
                            articleContent.authors.length > 0
                                ? articleContent.authors[0].name + ' et al.'
                                : 'Unknown'
                        }
                        source={articleContent.source}
                        date={new Date(articleContent.pubdate)
                            .getFullYear()
                            .toString()}
                        pmid={articleContent.uid}
                    />
                );
            }
        });
    }
    props.abstracts.forEach(abstract => {
        list.push(
            <ArticleAbstractItem
                abstract={abstract.abstract}
                link={abstract.link}
            />
        );
    });
    return <ul className={styles['no-style-ul']}>{list}</ul>;
};
