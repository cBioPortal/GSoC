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
import ResultsViewStructuralVariantTable from './ResultsViewStructuralVariantTable';
import { observer } from 'mobx-react';
import { ResultsViewStructuralVariantMapperStore } from './ResultsViewStructuralVariantMapperStore';
import LoadingIndicator from '../../../shared/components/loadingIndicator/LoadingIndicator';
import { action, computed, makeObservable, observable } from 'mobx';
import {
    getOncoKbIconStyleFromLocalStorage,
    saveOncoKbIconStyleToLocalStorage,
} from 'shared/lib/AnnotationColumnUtils';
import { MakeMobxView } from 'shared/components/MobxView';
import ErrorMessage from 'shared/components/ErrorMessage';

export interface IFusionMapperProps {
    store: ResultsViewStructuralVariantMapperStore;
}

@observer
export default class ResultsViewStructuralVariantMapper extends React.Component<
    IFusionMapperProps,
    {}
> {
    @observable mergeFusionTableOncoKbIcons;

    constructor(props: IFusionMapperProps) {
        super(props);
        makeObservable(this);

        this.mergeFusionTableOncoKbIcons = getOncoKbIconStyleFromLocalStorage().mergeIcons;
    }

    @action.bound
    handleOncoKbIconToggle(mergeIcons: boolean) {
        this.mergeFusionTableOncoKbIcons = mergeIcons;
        saveOncoKbIconStyleToLocalStorage({ mergeIcons });
    }

    @computed get itemsLabelPlural(): string {
        const count = this.props.store.dataStore
            .duplicateStructuralVariantCountInMultipleSamples;
        const structuralVariantsLabel =
            count === 1 ? 'structural variant' : 'structural variants';

        const multipleStructuralVariantInfo =
            count > 0
                ? `: includes ${count} duplicate ${structuralVariantsLabel} in patients with multiple samples`
                : '';

        return `Structural Variants${multipleStructuralVariantInfo}`;
    }

    tableUI = MakeMobxView({
        await: () => [
            this.props.store.studyIdToStudy,
            this.props.store.molecularProfileIdToMolecularProfile,
        ],

        render: () => {
            return (
                <>
                    <ResultsViewStructuralVariantTable
                        dataStore={this.props.store.dataStore}
                        itemsLabelPlural={this.itemsLabelPlural}
                        studyIdToStudy={this.props.store.studyIdToStudy.result}
                        molecularProfileIdToMolecularProfile={
                            this.props.store
                                .molecularProfileIdToMolecularProfile.result
                        }
                        transcriptToExons={this.props.store.transcriptToExons}
                        uniqueSampleKeyToTumorType={
                            this.props.store.uniqueSampleKeyToTumorType
                        }
                        structuralVariantOncoKbData={
                            this.props.store.structuralVariantOncoKbData
                        }
                        oncoKbCancerGenes={this.props.store.oncoKbCancerGenes}
                        usingPublicOncoKbInstance={
                            this.props.store.usingPublicOncoKbInstance
                        }
                        mergeOncoKbIcons={this.mergeFusionTableOncoKbIcons}
                        onOncoKbIconToggle={this.handleOncoKbIconToggle}
                    />
                </>
            );
        },

        renderPending: () => (
            <LoadingIndicator center={true} isLoading={true} size={'big'} />
        ),
        renderError: () => <ErrorMessage />,
    });

    public render() {
        return this.tableUI.component;
    }
}
