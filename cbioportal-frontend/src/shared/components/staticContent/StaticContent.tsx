import * as React from 'react';
import $ from 'jquery';
import { observer } from 'mobx-react';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize from 'rehype-sanitize';
import remarkGfm from 'remark-gfm';
import { getServerConfig } from 'config/config';
import { remoteData } from 'cbioportal-frontend-commons';
import LoadingIndicator from '../loadingIndicator/LoadingIndicator';
import { getDocsUrl } from '../../api/urls';
import './gfm.css';

function isMarkDown(url: string) {
    return (
        !getServerConfig().skin_documentation_markdown === false &&
        /\.md$/.test(url)
    );
}

function Heading(props: any) {
    const text = props.children
        .filter((s: any) => typeof s === 'string')
        .join(' ');

    const slug = text
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z-]/g, '');

    return React.createElement(`h${props.level}`, { id: slug }, props.children);
}

function setImageRoot(path: string) {
    return `${getServerConfig().skin_documentation_baseurl}/${path}`;
}

function Anchor(props: any) {
    const _href = /^#/.test(props.href) ? props.href.toLowerCase() : props.href;
    console.log(_href);
    return (
        <a className={'monkey'} href={_href}>
            {props.children}
        </a>
    );
}

@observer
export default class StaticContent extends React.Component<
    { sourceUrl: string; title?: string; renderers?: { [k: string]: any } },
    {}
> {
    private get url() {
        return getDocsUrl(
            this.props.sourceUrl!,
            getServerConfig().skin_documentation_baseurl!
        );
    }

    readonly source = remoteData<string>(async () => {
        return await $.get(this.url);
    });

    private content(content: string, url: string) {
        if (isMarkDown(url)) {
            return (
                <ReactMarkdown
                    components={{
                        h1: Heading,
                        h2: Heading,
                        h3: Heading,
                        h4: Heading,
                        h5: Heading,
                        a: Anchor,
                    }}
                    className={'markdown-body'}
                    children={this.source.result!}
                    rehypePlugins={[rehypeRaw, rehypeSanitize, remarkGfm]}
                />
            );
        } else {
            return <div dangerouslySetInnerHTML={{ __html: content }} />;
        }
    }

    public render() {
        return (
            <div>
                {this.props.title && <h1>{this.props.title}</h1>}

                <LoadingIndicator
                    isLoading={this.source.isPending}
                    size={'big'}
                    center={true}
                />

                {this.source.isComplete &&
                    this.content(this.source.result!, this.url)}
            </div>
        );
    }
}
