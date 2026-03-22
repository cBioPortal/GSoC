import * as React from 'react';
import {
    calcProteinChangeSortValue,
    getVariantAnnotation,
    isGermlineMutationStatus,
    RemoteData,
} from 'cbioportal-utils';
import { Mutation } from 'cbioportal-ts-api-client';
import { TruncatedText } from 'cbioportal-frontend-commons';
import MutationStatusColumnFormatter from './MutationStatusColumnFormatter';
import styles from './proteinChange.module.scss';
import { VariantAnnotation } from 'genome-nexus-ts-api-client';
import { RevueCell } from 'react-mutation-mapper';
import { getServerConfig } from 'config/config';
import _ from 'lodash';

export default class ProteinChangeColumnFormatter {
    public static getSortValue(d: Mutation[]): number | null {
        return calcProteinChangeSortValue(
            ProteinChangeColumnFormatter.getTextValue(d)
        );
    }

    public static getTextValue(data: Mutation[]): string {
        let textValue: string = '';
        const dataValue = ProteinChangeColumnFormatter.getData(data);

        if (dataValue) {
            textValue = dataValue.toString();
        }

        return textValue;
    }

    public static getFilterValue(
        data: Mutation[],
        filterString: string,
        filterStringUpper: string
    ): boolean {
        let filterValue = ProteinChangeColumnFormatter.getDisplayValue(data);
        const mutationStatus:
            | string
            | null = MutationStatusColumnFormatter.getData(data);

        if (
            mutationStatus &&
            mutationStatus.toLowerCase().includes('germline')
        ) {
            filterValue = `${filterValue}${mutationStatus}`;
        }

        return filterValue.toUpperCase().indexOf(filterStringUpper) > -1;
    }

    public static getDisplayValue(data: Mutation[]): string {
        // same as text value
        return ProteinChangeColumnFormatter.getTextValue(data);
    }

    public static getData(data: Mutation[]) {
        if (data.length > 0) {
            return data[0].proteinChange;
        } else {
            return null;
        }
    }

    public static renderWithMutationStatus(
        mutations: Mutation[],
        indexedVariantAnnotations?: RemoteData<
            { [genomicLocation: string]: VariantAnnotation } | undefined
        >
    ) {
        // use text as display value
        const text: string = ProteinChangeColumnFormatter.getDisplayValue(
            mutations
        );

        const vue =
            indexedVariantAnnotations?.isComplete &&
            indexedVariantAnnotations?.result &&
            !_.isEmpty(mutations)
                ? getVariantAnnotation(
                      mutations[0],
                      indexedVariantAnnotations.result
                  )?.annotation_summary?.vues
                : undefined;

        const isGermlineMutation = isGermlineMutationStatus(
            MutationStatusColumnFormatter.getData(mutations)
        );

        let content = (
            <TruncatedText
                text={text}
                tooltip={<span>{text}</span>}
                className={styles.proteinChange}
                maxLength={40}
            />
        );

        content = (
            <span className={styles.proteinChangeCell}>
                {content}
                {isGermlineMutation && ( // add a germline indicator next to protein change if it is a germline mutation!
                    <span className={styles.germline}>Germline</span>
                )}
                {getServerConfig().show_revue && vue && (
                    <span className={styles.revueIcon}>
                        <RevueCell vue={vue} />
                    </span>
                )}
            </span>
        );

        return content;
    }
}
