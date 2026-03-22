/**
 * Copyright (c) 2018 The Hyve B.V.
 * This code is licensed under the GNU Affero General Public License (AGPL),
 * version 3, or (at your option) any later version.
 *
 * This file is part of cBioPortal.
 *
 * cBioPortal is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 **/

import * as React from 'react';
import { observer } from 'mobx-react';
import { ResultsViewPageStore } from '../ResultsViewPageStore';
import { action, computed } from 'mobx';
import { MSKTab, MSKTabs } from 'shared/components/MSKTabs/MSKTabs';
import LoadingIndicator from '../../../shared/components/loadingIndicator/LoadingIndicator';
import ResultsViewStructuralVariantMapper from './ResultsViewStructuralVariantMapper';
import autobind from 'autobind-decorator';
import ResultsViewURLWrapper from 'pages/resultsView/ResultsViewURLWrapper';

export interface IFusionPageProps {
    store: ResultsViewPageStore;
    urlWrapper: ResultsViewURLWrapper;
}

@autobind
@observer
export default class StructuralVariants extends React.Component<
    IFusionPageProps,
    {}
> {
    @computed get generateTabs(): JSX.Element[] {
        const tabs: JSX.Element[] = [];
        const { structuralVariantMapperStores } = this.props.store;

        for (const gene of this.props.store.hugoGeneSymbols!) {
            const fusionMapperStore =
                structuralVariantMapperStores.result[gene];

            if (fusionMapperStore) {
                tabs.push(
                    <MSKTab key={gene} id={gene} linkText={gene}>
                        <div className="alert alert-info">
                            This is an experimental feature. The structural
                            variant gene and event info annotations might not
                            always be correct. If you are interested in
                            improving SV annotation and visualization together,
                            please reach out on cbioportal@googlegroups.com
                        </div>
                        <ResultsViewStructuralVariantMapper
                            store={fusionMapperStore}
                        />
                    </MSKTab>
                );
            }
        }

        return tabs;
    }

    @action
    public setSelectedGeneSymbol(hugoGeneSymbol: string) {
        this.props.urlWrapper.updateURL({
            mutations_gene: hugoGeneSymbol,
        });
    }

    @autobind
    protected handleTabChange(id: string) {
        this.setSelectedGeneSymbol(id);
    }

    @computed get selectedGeneSymbol() {
        return this.props.urlWrapper.query.mutations_gene &&
            this.props.store.hugoGeneSymbols.includes(
                this.props.urlWrapper.query.mutations_gene
            )
            ? this.props.urlWrapper.query.mutations_gene
            : this.props.store.hugoGeneSymbols[0];
    }

    render() {
        const activeTabId = this.selectedGeneSymbol;

        return (
            <div data-test="fusionsTabDiv">
                {this.props.store.structuralVariantMapperStores.isPending && (
                    <LoadingIndicator
                        center={true}
                        isLoading={true}
                        size={'big'}
                    />
                )}
                {this.props.store.structuralVariantMapperStores.isComplete && (
                    <MSKTabs
                        id="fusionsPageTabs"
                        activeTabId={activeTabId}
                        onTabClick={(id: string) => this.handleTabChange(id)}
                        className="pillTabs resultsPageFusionsGeneTabs"
                        arrowStyle={{ 'line-height': 0.8 }}
                        tabButtonStyle="pills"
                        unmountOnHide={true}
                    >
                        {this.generateTabs}
                    </MSKTabs>
                )}
            </div>
        );
    }
}
