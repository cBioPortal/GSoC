import * as React from 'react';
import { DefaultTooltip } from 'cbioportal-frontend-commons';
import { MolecularProfile, Mutation } from 'cbioportal-ts-api-client';

import { getSampleViewUrl } from '../../../api/urls';

export default class SampleColumnFormatter {
    public static getTextValue(data: Mutation[]): string {
        return SampleColumnFormatter.getData(data) || '';
    }

    public static getData(data: Mutation[]) {
        if (data.length > 0) {
            return data[0].sampleId;
        } else {
            return null;
        }
    }

    public static renderFunction(
        data: Mutation[],
        molecularProfileIdToMolecularProfile?: {
            [molecularProfileId: string]: MolecularProfile;
        }
    ) {
        const sampleId: string = SampleColumnFormatter.getTextValue(data);
        let content = <span>{sampleId}</span>;

        if (molecularProfileIdToMolecularProfile) {
            const profile =
                molecularProfileIdToMolecularProfile[
                    data[0].molecularProfileId
                ];
            const studyId = profile && profile.studyId;
            if (studyId) {
                content = (
                    <a
                        href={getSampleViewUrl(studyId, sampleId)}
                        target="_blank"
                    >
                        {content}
                    </a>
                );
            }
        }

        return (
            <DefaultTooltip
                overlay={() => <div style={{ maxWidth: 300 }}>{sampleId}</div>}
                placement="topLeft"
            >
                {content}
            </DefaultTooltip>
        );
    }
}
