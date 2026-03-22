import { action, observable } from 'mobx';
import React from 'react';
import {
    Modal,
    Form,
    FormControl,
    FormGroup,
    ControlLabel,
    Button,
} from 'react-bootstrap';
import { buildCBioPortalPageUrl } from 'shared/api/urls';

interface FilenameModalProps {
    show: boolean;
    fileContent: string;
    fileName: string;
    handleClose: () => void;
}

interface FilenameModalState {
    folderName: string;
    validated: boolean;
    errorMessage: string;
}

class JupyterNoteBookModal extends React.Component<
    FilenameModalProps,
    FilenameModalState
> {
    public channel: BroadcastChannel;

    constructor(props: FilenameModalProps) {
        super(props);
        this.state = {
            folderName: '',
            validated: false,
            errorMessage: '',
        };
        this.channel = new BroadcastChannel('jupyter_channel');
    }

    componentDidMount() {
        this.setState({ folderName: '' });
    }

    handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        this.setState({ folderName: event.target.value, errorMessage: '' });
    };

    @action
    handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        const { folderName } = this.state;

        if (folderName.trim() === '' || /\s/.test(folderName)) {
            this.setState({
                validated: false,
                errorMessage: 'Session name cannot be empty or contain spaces',
            });
            return;
        }

        const { fileContent, fileName } = this.props;

        const data = {
            type: 'from-cbioportal-to-jupyterlite',
            fileContent: fileContent,
            filename: `${fileName}.csv`,
            folderName: folderName,
        };

        const jupyterNotebookTool = window.open(
            'https://cbio-jupyter.netlify.app/lite/lab/index.html',
            '_blank'
        );

        if (jupyterNotebookTool) {
            const receiveMessage = (event: MessageEvent) => {
                if (event.data.type === 'jupyterlite-ready') {
                    console.log('Now sending the data...');
                    jupyterNotebookTool.postMessage(data, '*');
                    window.removeEventListener('message', receiveMessage);
                    this.props.handleClose();
                }
            };

            window.addEventListener('message', receiveMessage);
        }

        this.setState({ folderName: '', validated: false, errorMessage: '' });
        // this.props.handleClose();
    };

    render() {
        const { show, handleClose } = this.props;
        const { folderName, errorMessage } = this.state;

        return (
            <Modal show={show} onHide={handleClose}>
                <Modal.Header closeButton>
                    <Modal.Title>Enter Notebook Name</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form
                        id="jupyterform"
                        onSubmit={e =>
                            this.handleSubmit(
                                (e as unknown) as React.FormEvent<
                                    HTMLFormElement
                                >
                            )
                        }
                    >
                        <FormGroup controlId="formFolderName">
                            <ControlLabel className="py-2">
                                Notebook Name
                            </ControlLabel>
                            <FormControl
                                type="text"
                                placeholder="Enter Notebook Name"
                                value={folderName}
                                onChange={e =>
                                    this.handleChange(
                                        (e as unknown) as React.ChangeEvent<
                                            HTMLInputElement
                                        >
                                    )
                                }
                                required
                            />
                            {errorMessage && (
                                <div style={{ color: 'red' }}>
                                    {errorMessage}
                                </div>
                            )}
                        </FormGroup>
                    </Form>
                </Modal.Body>
                <Modal.Footer>
                    <Button onClick={handleClose}>Close</Button>
                    <Button type="submit" form="jupyterform">
                        Open Jupyter Notebook
                    </Button>
                </Modal.Footer>
            </Modal>
        );
    }
}

export default JupyterNoteBookModal;
