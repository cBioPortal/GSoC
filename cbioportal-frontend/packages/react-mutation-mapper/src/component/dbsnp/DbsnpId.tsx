import { DefaultTooltip } from 'cbioportal-frontend-commons';
import { getDbsnpRsId } from 'cbioportal-utils';
import { MyVariantInfo } from 'genome-nexus-ts-api-client';
import { observer } from 'mobx-react';
import * as React from 'react';

export type DbsnpIdProps = {
    myVariantInfo?: MyVariantInfo;
};

@observer
export default class DbsnpId extends React.Component<DbsnpIdProps, {}> {
    public render() {
        const rsId = getDbsnpRsId(this.props.myVariantInfo);

        if (rsId == null) {
            return (
                <DefaultTooltip
                    placement="topRight"
                    overlay={<span>Variant has no dbSNP data.</span>}
                >
                    <span
                        style={{
                            height: '100%',
                            width: '100%',
                            display: 'block',
                            overflow: 'hidden',
                        }}
                    >
                        &nbsp;
                    </span>
                </DefaultTooltip>
            );
        } else {
            let dbsnpLink = 'https://www.ncbi.nlm.nih.gov/snp/' + rsId;
            return (
                <DefaultTooltip
                    placement="top"
                    overlay={
                        <span>Click to see variant on dbSNP website.</span>
                    }
                >
                    <span style={{ textAlign: 'right', float: 'right' }}>
                        <a href={dbsnpLink} target="_blank">
                            {rsId}
                        </a>
                    </span>
                </DefaultTooltip>
            );
        }
    }
}
