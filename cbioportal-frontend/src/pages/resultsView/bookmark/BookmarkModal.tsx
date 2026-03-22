import * as React from 'react';
import _ from 'lodash';
import { observer } from 'mobx-react';
import { Modal } from 'react-bootstrap';
import { makeObservable, observable } from 'mobx';
import { ShareUrls } from '../querySummary/ShareUI';
import classNames from 'classnames';
import autobind from 'autobind-decorator';
import LoadingIndicator from 'shared/components/loadingIndicator/LoadingIndicator';
var Clipboard = require('clipboard');
interface IBookmarkModalProps {
    onHide: () => void;
    urlPromise: Promise<any>;
    title: string;
    description?: string;
}

@observer
export class BookmarkModal extends React.Component<IBookmarkModalProps, {}> {
    @observable urlData: ShareUrls | undefined = undefined;

    clipboards: any[] = [];

    constructor(props: IBookmarkModalProps) {
        super(props);
        makeObservable(this);
    }

    componentDidMount() {
        // this is an $.ajax promise, not a real promise
        this.props.urlPromise.then(
            data => {
                this.urlData = data;
                setTimeout(() => {
                    this.initializeClipboards();
                }, 0);
            },
            () => {}
        );
    }

    @autobind
    showThumb(e: any) {
        e.target.className = 'fa fa-thumbs-up';
    }

    @autobind
    initializeClipboards() {
        this.clipboards.push(
            new Clipboard(this.sessionButton, {
                text: function() {
                    return this.urlData.fullUrl;
                }.bind(this),
                container: this.container,
            })
        );

        if (this.urlData && this.urlData.bitlyUrl) {
            this.clipboards.push(
                new Clipboard(this.bitlyButton, {
                    text: function() {
                        return this.urlData.bitlyUrl;
                    }.bind(this),
                    container: this.container,
                })
            );
        }
    }

    componentWillUnmount() {
        // we need to clean up clipboards
        this.clipboards.forEach((clipboard: any) => clipboard.destroy());
    }

    public sessionButton: HTMLAnchorElement;

    public bitlyButton: HTMLAnchorElement;

    public container: HTMLDivElement;

    render() {
        return (
            <Modal show={true} onHide={this.props.onHide}>
                <Modal.Header closeButton>
                    <Modal.Title>{this.props.title}</Modal.Title>
                </Modal.Header>
                <Modal.Body style={{ minHeight: 70 }}>
                    <LoadingIndicator
                        size={'big'}
                        center={true}
                        style={{ top: 32 }}
                        isLoading={!this.urlData}
                    />

                    {
                        <div
                            className={classNames({ hidden: !this.urlData })}
                            ref={(el: HTMLDivElement) => (this.container = el)}
                        >
                            <form>
                                <div className="form-group">
                                    <p>{this.props.description}</p>
                                    <div className="input-group">
                                        <input
                                            type="text"
                                            className="form-control"
                                            data-test="bookmark-url"
                                            value={
                                                this.urlData
                                                    ? this.urlData.fullUrl
                                                    : ''
                                            }
                                        />
                                        <div className="input-group-addon">
                                            <a
                                                ref={(el: HTMLAnchorElement) =>
                                                    (this.sessionButton = el)
                                                }
                                                onClick={this.showThumb}
                                            >
                                                <i className="fa fa-clipboard"></i>
                                            </a>
                                        </div>
                                    </div>
                                </div>
                                {this.urlData && this.urlData.bitlyUrl && (
                                    <div className="form-group">
                                        <label htmlFor="exampleInputAmount">
                                            Shortened URL
                                        </label>
                                        <div className="input-group">
                                            <input
                                                type="text"
                                                className="form-control"
                                                value={
                                                    this.urlData
                                                        ? this.urlData.bitlyUrl
                                                        : ''
                                                }
                                            />
                                            <div className="input-group-addon">
                                                <a
                                                    onClick={this.showThumb}
                                                    ref={(
                                                        el: HTMLAnchorElement
                                                    ) =>
                                                        (this.bitlyButton = el)
                                                    }
                                                >
                                                    <i className="fa fa-clipboard"></i>
                                                </a>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </form>
                        </div>
                    }
                </Modal.Body>
            </Modal>
        );
    }
}
