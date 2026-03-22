import * as React from 'react';
import styles from './styles/styles.module.scss';
import { observer } from 'mobx-react';
import FontAwesome from 'react-fontawesome';
import { GeneReplacement, QueryStoreComponent, Focus } from './QueryStore';

@observer
export default class GenesetsValidator extends QueryStoreComponent<{}, {}> {
    render() {
        if (this.store.genesetIdsQuery.error) {
            return (
                <div className={styles.GeneSymbolValidator}>
                    <span className={styles.errorMessage}>
                        {`Cannot validate gene sets because of invalid OQL. ${
                            this.store.genesetQueryErrorDisplayStatus ===
                            Focus.Focused
                                ? "Please click 'Submit' to see location of error."
                                : this.store.genesetIdsQuery.error.message
                        }`}
                    </span>
                </div>
            );
        }

        if (!this.store.genesetIdsQuery.query.length) {
            return null;
        }

        if (this.store.genesets.isError) {
            return (
                <div className={styles.GeneSymbolValidator}>
                    <span className={styles.pendingMessage}>
                        Unable to validate gene sets.
                    </span>
                </div>
            );
        }

        if (
            this.store.genesets.isPending &&
            this.store.genesets.result.invalid.length === 0
        ) {
            return (
                <div className={styles.GeneSymbolValidator}>
                    <span className={styles.pendingMessage}>
                        Validating gene sets...
                    </span>
                </div>
            );
        }

        if (this.store.genesets.result.invalid.length) {
            return (
                <div className={styles.GeneSymbolValidator}>
                    <div
                        className={styles.invalidBubble}
                        title="Please edit the gene sets."
                    >
                        <FontAwesome
                            className={styles.icon}
                            name="exclamation-circle"
                        />
                        <span>Invalid gene sets.</span>
                    </div>

                    {this.store.genesets.result.invalid.map(
                        this.renderSuggestion,
                        this
                    )}
                </div>
            );
        }

        return (
            <div className={styles.GeneSymbolValidator}>
                <div
                    className={styles.validBubble}
                    title="You can now submit the list."
                >
                    <FontAwesome className={styles.icon} name="check-circle" />
                    <span>All gene sets are valid.</span>
                </div>
            </div>
        );
    }

    renderSuggestion(name: string, key: number) {
        const title =
            'Could not find gene set. Click to remove it from the gene list.';
        const onClick = () => this.store.replaceGeneset(name, '');
        return (
            <div
                key={key}
                className={styles.suggestionBubble}
                title={title}
                onClick={onClick}
            >
                <FontAwesome className={styles.icon} name="times-circle" />
                <span className={styles.noChoiceLabel}>{name}</span>
            </div>
        );
    }
}
