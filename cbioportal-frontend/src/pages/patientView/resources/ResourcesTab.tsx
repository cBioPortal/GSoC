import * as React from 'react';
import { observer } from 'mobx-react';
import FeatureTitle from '../../../shared/components/featureTitle/FeatureTitle';
import SampleResourcesTable from '../../../shared/components/resources/SampleResourcesTable';
import SampleManager from '../SampleManager';
import { PatientViewPageStore } from '../clinicalInformation/PatientViewPageStore';
import { remoteData } from 'cbioportal-frontend-commons';
import { ResourcesTableRowData } from '../../../shared/components/resources/ResourcesTableUtils';
import { MakeMobxView } from '../../../shared/components/MobxView';
import _ from 'lodash';
import { ResourceData } from 'cbioportal-ts-api-client';
import ResourceTable from 'shared/components/resources/ResourceTable';

export interface IResourcesTabProps {
    sampleManager: SampleManager | null;
    store: PatientViewPageStore;
    openResource: (resource: ResourceData) => void;
}

export const RESOURCES_TAB_NAME = 'Files & Links';

@observer
export default class ResourcesTab extends React.Component<
    IResourcesTabProps,
    {}
> {
    readonly sampleRows = remoteData<ResourcesTableRowData[]>({
        await: () => [
            this.props.store.samples,
            this.props.store.sampleResourceData,
        ],
        invoke: () => {
            const data = this.props.store.sampleResourceData.result!;
            const rows = [];
            for (const sample of this.props.store.samples.result!) {
                const resources = data[sample.sampleId];
                if (resources && resources.length) {
                    rows.push({ sample, resources });
                }
            }
            return Promise.resolve(rows);
        },
    });

    readonly sampleResources = MakeMobxView({
        await: () => [this.sampleRows],
        render: () => {
            if (
                this.props.sampleManager &&
                this.sampleRows.result!.length > 0
            ) {
                return (
                    <div className="resourcesSection">
                        <h4 className="blackHeader">Sample Resources</h4>
                        <SampleResourcesTable
                            data={this.sampleRows.result!}
                            sampleManager={this.props.sampleManager!}
                            isTabOpen={this.props.store.isResourceTabOpen}
                            openResource={this.props.openResource}
                        />
                    </div>
                );
            } else {
                return null;
            }
        },
    });

    readonly patientResources = MakeMobxView({
        await: () => [this.props.store.patientResourceData],
        render: () => {
            if (this.props.store.patientResourceData.result!.length > 0) {
                return (
                    <div className="resourcesSection">
                        <h4 className="blackHeader">
                            Patient Resources for {this.props.store.patientId}
                        </h4>
                        <ResourceTable
                            resources={
                                this.props.store.patientResourceData.result!
                            }
                            isTabOpen={this.props.store.isResourceTabOpen}
                            openResource={this.props.openResource}
                        />
                    </div>
                );
            } else {
                return null;
            }
        },
    });

    readonly studyResources = MakeMobxView({
        await: () => [
            this.props.store.studyResourceData,
            this.props.store.studies,
        ],
        render: () => {
            if (this.props.store.studyResourceData.result!.length > 0) {
                return (
                    <div className="resourcesSection">
                        <h4 className="blackHeader">
                            Study Resources for{' '}
                            {this.props.store.studies.result![0].name}
                        </h4>
                        <ResourceTable
                            resources={
                                this.props.store.studyResourceData.result!
                            }
                            isTabOpen={this.props.store.isResourceTabOpen}
                            openResource={this.props.openResource}
                        />
                    </div>
                );
            } else {
                return null;
            }
        },
    });

    readonly showNoResource = MakeMobxView({
        await: () => [this.props.store.resourceIdToResourceData],
        render: () => {
            const shouldShowNoResource = () => {
                if (this.props.store.resourceIdToResourceData.isComplete) {
                    return !_.some(
                        this.props.store.resourceIdToResourceData.result,
                        data => data.length > 0
                    );
                }
                return true;
            };

            if (shouldShowNoResource()) {
                return (
                    <div className="resourcesSection">
                        <h4 className="blackHeader">
                            Resources for {this.props.store.patientId}
                        </h4>
                        <ResourceTable
                            resources={
                                this.props.store.studyResourceData.result!
                            }
                            isTabOpen={this.props.store.isResourceTabOpen}
                            openResource={this.props.openResource}
                        />
                    </div>
                );
            } else {
                return null;
            }
        },
    });

    render() {
        return (
            <div className="resourcesTab">
                <FeatureTitle
                    title={RESOURCES_TAB_NAME}
                    isLoading={
                        this.sampleResources.isPending ||
                        this.patientResources.isPending ||
                        this.studyResources.isPending
                    }
                    className={'pull-left'}
                />
                <br />
                <br />
                <div>
                    {this.patientResources.component}
                    {this.sampleResources.component}
                    {this.studyResources.component}
                    {this.showNoResource.component}
                </div>
            </div>
        );
    }
}
