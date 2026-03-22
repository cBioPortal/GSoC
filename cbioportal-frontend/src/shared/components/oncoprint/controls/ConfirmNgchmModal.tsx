import * as React from 'react';
import { Button, Modal } from 'react-bootstrap';
import { observer } from 'mobx-react';
import { observable } from 'mobx';

//
// NG-CHM are "Next-Generation Clustered Heat Maps", a highly interactive viewer of
// even very large heat maps, as described here:
// https://bioinformatics.mdanderson.org/public-software/ngchm/
// Source code for the viewer and other tools can be found at
// https://github.com/MD-Anderson-Bioinformatics
//

@observer
export default class ConfirmNgchmModal extends React.Component<
    { show: boolean; onHide: () => void; openNgchmWindow: () => void },
    {}
> {
    render() {
        return (
            <Modal
                show={this.props.show}
                onHide={this.props.onHide}
                animation={false}
            >
                <Modal.Header closeButton>
                    <Modal.Title>
                        Open new tab to MD Anderson NG-CHM?
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <div className="oncoprint__controls__heatmap_menu mdacc-modal">
                        <p>
                            Continue will open a tab or window to a different
                            site (not cBioPortal).
                        </p>
                        <p>
                            You will be able to view this study as Next
                            Generation Clustered Heatmaps (NG-CHM) developed by
                            The University of Texas MD Anderson Cancer Center.
                        </p>
                        <em>
                            Note: NG-CHM will not be limited to your selected
                            samples and genes.
                        </em>
                    </div>
                </Modal.Body>
                <Modal.Footer>
                    <Button
                        onClick={() => {
                            this.props.openNgchmWindow();
                            this.props.onHide();
                        }}
                    >
                        Continue
                    </Button>
                    <Button onClick={this.props.onHide}>Cancel</Button>
                </Modal.Footer>
            </Modal>
        );
    }
}
