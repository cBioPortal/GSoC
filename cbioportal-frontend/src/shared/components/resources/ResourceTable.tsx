import * as React from 'react';
import { observer } from 'mobx-react';
import { getFileExtension } from './ResourcesTableUtils';
import { ResourceData } from 'cbioportal-ts-api-client';
import _ from 'lodash';
import { useLocalObservable } from 'mobx-react-lite';

export interface IResourceTableProps {
    resources: ResourceData[];
    isTabOpen: (resourceId: string) => boolean;
    openResource: (resource: ResourceData) => void;
    sampleId?: React.ReactNode;
}

function icon(resource: ResourceData) {
    let className = '';
    const fileExtension = getFileExtension(resource.url);
    switch (fileExtension) {
        case 'pdf':
            className = 'fa fa-file-pdf-o';
            break;
        case 'png':
        case 'jpeg':
        case 'jpg':
        case 'gif':
            className = 'fa fa-file-image-o';
            break;
        case 'm4a':
        case 'flac':
        case 'mp3':
        case 'mp4':
        case 'wav':
            className = 'fa fa-file-audio-o';
            break;
    }
    if (className) {
        return (
            <i
                className={`${className} fa-sm`}
                style={{ marginRight: 5, color: 'black' }}
            />
        );
    } else {
        return null;
    }
}

const ResourceTable = observer(
    ({ resources, isTabOpen, openResource, sampleId }: IResourceTableProps) => {
        const resourceTable = useLocalObservable(() => ({
            get data() {
                return _.sortBy(resources, r => r.resourceDefinition.priority);
            },
        }));

        return resourceTable.data.length === 0 ? (
            <p>There are no resources for this sample.</p>
        ) : (
            <table className="simple-table table table-striped table-border-top">
                <thead>
                    <tr>
                        {sampleId && <th>Sample ID</th>}
                        <th>Resource</th>
                        <th></th>
                        {resourceTable.data.length > 0 && <th>Description</th>}
                    </tr>
                </thead>
                <tbody>
                    {resourceTable.data.length === 0 ? (
                        <tr>
                            <td colSpan={3} style={{ textAlign: 'center' }}>
                                There are no results
                            </td>
                        </tr>
                    ) : (
                        resourceTable.data.map(resource => (
                            <tr>
                                {sampleId && <td>{sampleId}</td>}
                                <td>
                                    <a onClick={() => openResource(resource)}>
                                        {icon(resource)}
                                        {resource.resourceDefinition
                                            .displayName || resource.url}
                                    </a>
                                </td>
                                <td>
                                    <a
                                        href={resource.url}
                                        style={{ fontSize: 10 }}
                                        target={'_blank'}
                                    >
                                        <i
                                            className={`fa fa-external-link fa-sm`}
                                            style={{
                                                marginRight: 5,
                                                color: 'black',
                                            }}
                                        />
                                        Open in new window
                                    </a>
                                </td>
                                <td>
                                    {resource.resourceDefinition.description}
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        );
    }
);

export default ResourceTable;
