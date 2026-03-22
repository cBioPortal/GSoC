import * as React from 'react';
import { PathologyReportPDF } from '../clinicalInformation/PatientViewPageStore';
import { If, Then, Else } from 'react-if';
import _ from 'lodash';
import IFrameLoader from '../../../shared/components/iframeLoader/IFrameLoader';
import { observer } from 'mobx-react';

export type IPathologyReportProps = {
    pdfs: PathologyReportPDF[];
    iframeHeight: number;
    iframeStyle?: { [styleProp: string]: any };
};

@observer
export default class PathologyReport extends React.Component<
    IPathologyReportProps,
    { pdfUrl: string }
> {
    pdfSelectList: any;
    pdfEmbed: any;

    constructor(props: IPathologyReportProps) {
        super(props);

        this.state = { pdfUrl: this.buildPDFUrl(props.pdfs[0].url) };

        this.handleSelection = this.handleSelection.bind(this);
    }

    buildPDFUrl(url: string): string {
        return `https://docs.google.com/viewerng/viewer?url=${encodeURIComponent(
            url
        )}&pid=explorer&efh=false&a=v&chrome=false&embedded=true`;
    }

    handleSelection() {
        this.setState({
            pdfUrl: this.buildPDFUrl(
                this.pdfSelectList.options[this.pdfSelectList.selectedIndex]
                    .value
            ),
        });
    }

    render() {
        return (
            <div>
                <If condition={this.props.pdfs.length > 1}>
                    <select
                        ref={el => (this.pdfSelectList = el)}
                        style={{ marginBottom: 15 }}
                        onChange={this.handleSelection}
                    >
                        {_.map(this.props.pdfs, (pdf: PathologyReportPDF) => (
                            <option value={pdf.url}>{pdf.name}</option>
                        ))}
                    </select>
                </If>

                <IFrameLoader
                    height={this.props.iframeHeight}
                    url={this.state.pdfUrl}
                />
            </div>
        );
    }
}
