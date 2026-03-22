import * as React from 'react';
import { ClinicalData } from 'cbioportal-ts-api-client';

export type IClinicalAttributesInlineProps = {
    clinicalData?: ClinicalData;
    cancerStudyId: string;
};

//export default class ClinicalAttributesInline extends React.Component<IClinicalAttributesInlineProps, {}> {
//    public render() {
//        switch (this.props.status) {
//            case 'fetching':
//                return <div><Spinner spinnerName='three-bounce' /></div>;
//
//            case 'complete':
//                return this.draw();
//
//            case 'error':
//                return <div>There was an error.</div>;
//
//            default:
//                return <div />;
//        }
//    }
//}

type IClinicalAttributeProps = {
    key: string;
    value: string;
};

// class ClinicalAttribute extends React.Component<IClinicalAttributeProps, {}> {
//     public render() {
//         return <span className={`clinical-attribute`} attrId={key} attrValue={value} study={cancerStudyId}>{value}</span>;
//     }
// }
