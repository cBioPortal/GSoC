import autobind from 'autobind-decorator';
import { getDbsnpRsId } from 'cbioportal-utils';
import { MyVariantInfo } from 'genome-nexus-ts-api-client';
import { observer } from 'mobx-react';
import * as React from 'react';

import { defaultSortMethod } from 'cbioportal-utils';
import DbsnpId from '../dbsnp/DbsnpId';
import {
    MyVariantInfoProps,
    renderMyVariantInfoContent,
} from './MyVariantInfoHelper';

export function download(myVariantInfo?: MyVariantInfo): string {
    const value = sortValue(myVariantInfo);

    return value ? value.toString() : '';
}

export function sortValue(myVariantInfo?: MyVariantInfo): string | null {
    return getDbsnpRsId(myVariantInfo);
}

export function dbsnpSortMethod(a: MyVariantInfo, b: MyVariantInfo) {
    return defaultSortMethod(sortValue(a), sortValue(b));
}

@observer
export default class Dbsnp extends React.Component<MyVariantInfoProps, {}> {
    public static defaultProps: Partial<MyVariantInfoProps> = {
        className: 'pull-right mr-1',
    };

    public render() {
        return renderMyVariantInfoContent(this.props, this.getContent);
    }

    @autobind
    public getContent(myVariantInfo: MyVariantInfo) {
        return <DbsnpId myVariantInfo={myVariantInfo} />;
    }
}
