import * as React from 'react';
import { observer } from 'mobx-react';
import FeatureTitle from '../../../shared/components/featureTitle/FeatureTitle';
import { MakeMobxView } from '../../../shared/components/MobxView';
import _ from 'lodash';
import { StudyViewPageStore } from '../StudyViewPageStore';
import { ResourceData } from 'cbioportal-ts-api-client';
import ResourceTable from 'shared/components/resources/ResourceTable';

import { FilesAndLinks } from './FilesAndLinks';

export interface IResourcesTabProps {
    store: StudyViewPageStore;
    openResource: (resource: ResourceData) => void;
}

export const RESOURCES_TAB_NAME = 'Files & Links';

@observer
export default class ResourcesTab extends React.Component<
    IResourcesTabProps,
    {}
> {
    readonly studyResources = MakeMobxView({
        await: () => [
            this.props.store.studyResourceData,
            this.props.store.queriedPhysicalStudies,
        ],
        render: () => {
            if (this.props.store.studyResourceData.result!.length > 0) {
                return (
                    <div className="resourcesSection">
                        <h4 className="blackHeader">
                            Study Resources for{' '}
                            {
                                this.props.store.queriedPhysicalStudies
                                    .result![0].name
                            }
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
            <div>
                <div className="resourcesTab" style={{ display: 'none' }}>
                    <FeatureTitle
                        title={RESOURCES_TAB_NAME}
                        isLoading={this.studyResources.isPending}
                        className={'pull-left'}
                    />
                    <br />
                    <br />
                    <div>{this.studyResources.component}</div>
                </div>
                <div className="resourcesTab">
                    <div className="resourcesSection">
                        <h4 className="blackHeader">
                            Patient and Sample Resources
                        </h4>
                        <FilesAndLinks store={this.props.store}></FilesAndLinks>
                    </div>
                </div>
            </div>
        );
    }
}
