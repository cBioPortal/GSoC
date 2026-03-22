import * as React from 'react';
import { ThreeBounce } from 'better-react-spinkit';
import LoadingIndicator from '../loadingIndicator/LoadingIndicator';
import { observer } from 'mobx-react';
import { makeObservable, observable } from 'mobx';
import autobind from 'autobind-decorator';
import FontAwesome from 'react-fontawesome';

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1500;
const LOAD_CHECK_DELAY_MS = 1000;

interface FrameLoaderProps {
    url: string;
    className?: string;
    iframeId?: string;
    height?: number | string;
    width?: number | string;
}
@observer
export default class IFrameLoader extends React.Component<
    FrameLoaderProps,
    {}
> {
    public static defaultProps = {
        width: '',
    };

    @observable iframeLoaded = false;

    private retryCount: number = 0;
    private checkTimer: ReturnType<typeof setTimeout> | null = null;
    private retryTimer: ReturnType<typeof setTimeout> | null = null;
    private iframeRef = React.createRef<HTMLIFrameElement>();

    constructor(props: FrameLoaderProps) {
        super(props);
        makeObservable(this);
    }

    componentDidMount() {
        this.scheduleLoadCheck();
    }

    componentDidUpdate(prevProps: FrameLoaderProps) {
        if (prevProps.url !== this.props.url) {
            this.retryCount = 0;
            this.iframeLoaded = false;
            this.clearTimers();
            this.scheduleLoadCheck();
        }
    }

    componentWillUnmount() {
        this.clearTimers();
    }

    private clearTimers() {
        if (this.checkTimer !== null) {
            clearTimeout(this.checkTimer);
            this.checkTimer = null;
        }
        if (this.retryTimer !== null) {
            clearTimeout(this.retryTimer);
            this.retryTimer = null;
        }
    }

    private scheduleLoadCheck() {
        this.checkTimer = setTimeout(() => {
            this.checkIframeContent();
        }, LOAD_CHECK_DELAY_MS);
    }

    private checkIframeContent() {
        const iframe = this.iframeRef.current;
        if (!iframe) return;

        try {
            // If accessible and about:blank, the iframe got a 204 (no content)
            const href = iframe.contentWindow?.document.location.href;
            if (href === 'about:blank' && this.retryCount < MAX_RETRIES) {
                this.retryCount++;
                this.retryTimer = setTimeout(() => {
                    if (this.iframeRef.current) {
                        this.iframeRef.current.src = this.props.url;
                        this.scheduleLoadCheck();
                    }
                }, RETRY_DELAY_MS);
            } else {
                this.iframeLoaded = true;
            }
        } catch (e) {
            // SecurityError means cross-origin content loaded — success
            this.iframeLoaded = true;
        }
    }

    @autobind
    private onLoad() {
        // Clear the check timer since onLoad fired — content loaded
        if (this.checkTimer !== null) {
            clearTimeout(this.checkTimer);
            this.checkTimer = null;
        }
        this.iframeLoaded = true;
    }

    //NOTE: we need zindex to be higher than that of global loader
    render() {
        return (
            <div
                style={{
                    position: 'relative',
                    width: this.props.width,
                    marginTop: 5,
                }}
            >
                <LoadingIndicator
                    center={true}
                    size={'big'}
                    isLoading={!this.iframeLoaded}
                />
                <a
                    href={this.props.url}
                    target="_blank"
                    style={{
                        position: 'absolute',
                        fontSize: 12,
                        right: 0,
                        top: -18,
                    }}
                >
                    Open in new window <FontAwesome name="external-link" />
                </a>
                <iframe
                    ref={this.iframeRef}
                    id={this.props.iframeId || ''}
                    className={this.props.className || ''}
                    style={{
                        width: '100%',
                        position: 'relative',
                        zIndex: 100,
                        height: this.props.height,
                        border: 'none',
                        marginTop: 5,
                    }}
                    src={this.props.url}
                    onLoad={this.onLoad}
                    allowFullScreen={true}
                ></iframe>
            </div>
        );
    }
}
