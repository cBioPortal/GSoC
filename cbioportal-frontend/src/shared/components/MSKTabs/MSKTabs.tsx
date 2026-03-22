import * as React from 'react';
import _ from 'lodash';
import classnames from 'classnames';
import './styles.scss';
import autobind from 'autobind-decorator';
import LoadingIndicator from '../loadingIndicator/LoadingIndicator';
import {
    action,
    autorun,
    IReactionDisposer,
    makeObservable,
    observable,
} from 'mobx';
import { ReactChild } from 'react';
import { observer } from 'mobx-react';
import MemoizedHandlerFactory from '../../lib/MemoizedHandlerFactory';
import URL from 'url';
import { DefaultTooltip, getBrowserWindow } from 'cbioportal-frontend-commons';

export interface IMSKTabProps {
    inactive?: boolean;
    id: string;
    linkText?: string | JSX.Element;
    linkTooltip?: string | JSX.Element;
    activeId?: string;
    className?: string;
    hide?: boolean | (() => boolean);
    datum?: any;
    anchorStyle?: { [k: string]: string | number | boolean };
    anchorClassName?: string;
    unmountOnHide?: boolean;
    onTabDidMount?: (tab: HTMLDivElement) => void;
    onTabUnmount?: (tab: HTMLDivElement) => void;
    onClickClose?: (tabId: string) => void;
    pending?: boolean;
    linkOverride?: JSX.Element;
}

@observer
export class DeferredRender extends React.Component<
    { className: string; loadingState?: JSX.Element },
    {}
> {
    @observable renderedOnce = false;

    constructor(props: any) {
        super(props);
        makeObservable(this);
    }

    render() {
        if (!this.renderedOnce) {
            setTimeout(() => (this.renderedOnce = true));
        }

        return (
            <div className={this.props.className}>
                {this.renderedOnce && this.props.children}
                {!this.renderedOnce && (this.props.loadingState || null)}
            </div>
        );
    }
}

export class MSKTab extends React.Component<IMSKTabProps, {}> {
    public div: HTMLDivElement;

    componentDidMount() {
        if (this.props.onTabDidMount) {
            this.props.onTabDidMount(this.div);
        }
    }

    componentWillUnmount() {
        if (this.props.onTabUnmount) {
            this.props.onTabUnmount(this.div);
        }
    }

    @autobind
    assignRef(div: HTMLDivElement) {
        this.div = div;
    }

    render() {
        return (
            <div
                ref={(div: HTMLDivElement) => (this.div = div)}
                className={classnames(
                    {
                        'msk-tab': true,
                        hiddenByPosition: !!this.props.inactive,
                    },
                    this.props.className
                )}
            >
                {this.props.children}
            </div>
        );
    }
}

interface IMSKTabsProps {
    className?: string;
    id?: string;
    activeTabId?: string;
    onTabClick?: (tabId: string, datum: any) => void;
    getPaginationWidth?: () => number;
    // only used when pagination is true to style arrows
    arrowStyle?: { [k: string]: string | number | boolean };
    tabButtonStyle?: string;
    unmountOnHide?: boolean;
    loadingComponent?: JSX.Element;
    contentWindowExtra?: JSX.Element;
    hrefRoot?: string;
    onMount?: () => void;
    defaultTabId?: string | Boolean;
}

@observer
export class MSKTabs extends React.Component<IMSKTabsProps> {
    @observable currentPage: number = 1;
    @observable pageBreaks: string[] = [];

    private shownTabs: string[] = [];
    private navTabsRef: HTMLUListElement;
    private tabRefs: { id: string; element: HTMLLIElement }[] = [];
    private tabIdToNavTabWidth: { [tabId: string]: number } = {};
    private needToRecomputeNavTabWidths = true;
    private widthReaction: IReactionDisposer;

    public static defaultProps: Partial<IMSKTabsProps> = {
        unmountOnHide: true,
        loadingComponent: (
            <LoadingIndicator isLoading={true} center={true} size={'big'} />
        ),
    };

    private tabClickHandlers = MemoizedHandlerFactory(
        (
            e: React.MouseEvent<any>,
            tabProps: Pick<IMSKTabProps, 'id' | 'datum'>
        ) => {
            e.preventDefault();
            this.setActiveTab(tabProps.id, tabProps.datum);
        }
    );

    constructor(props: IMSKTabsProps) {
        super(props);
        makeObservable(this);
        props.onMount && props.onMount();
    }

    private cloneTab(
        tab: React.ReactElement<IMSKTabProps>,
        inactive: boolean,
        loading?: boolean
    ): React.ReactElement<IMSKTabProps> {
        if (loading) {
            return React.cloneElement(
                tab,
                { inactive } as Partial<IMSKTabProps>,
                this.props.loadingComponent!
            );
        } else {
            return React.cloneElement(tab, { inactive } as Partial<
                IMSKTabProps
            >);
        }
    }

    setActiveTab(id: string, datum?: any) {
        this.props.onTabClick && this.props.onTabClick(id, datum);
    }

    navTabsRefHandler(ul: HTMLUListElement) {
        this.navTabsRef = ul;
    }

    tabRefHandler(id: string, li: HTMLLIElement) {
        if (id && li) {
            this.tabRefs.push({ id, element: li });
        }
    }

    @action
    nextPage() {
        this.currentPage += 1;
    }

    @action
    prevPage() {
        this.currentPage -= 1;
    }

    render() {
        if (this.props.children && React.Children.count(this.props.children)) {
            let children = this.props.children as React.ReactElement<
                IMSKTabProps
            >[];

            const toArrayedChildren: (
                | ReactChild
                | {}
            )[] = React.Children.toArray(children);

            const targetTabId = (() => {
                if (
                    this.props.activeTabId &&
                    _.some(
                        toArrayedChildren,
                        (child: React.ReactElement<IMSKTabProps>) =>
                            child.props.id === this.props.activeTabId
                    )
                ) {
                    return this.props.activeTabId;
                } else {
                    return this.props.defaultTabId === false
                        ? undefined
                        : (toArrayedChildren[0] as React.ReactElement<
                              IMSKTabProps
                          >).props.id;
                }
            })();

            let arr: React.ReactElement<IMSKTabProps>[] = [];

            // NOTE: we have to clone tab in order to manipulate
            // it's props, which are immutable for an instance of a child element
            // in this case we are to manipulate it's "inactive" prop
            arr = _.reduce(
                toArrayedChildren,
                (
                    memo: React.ReactElement<IMSKTabProps>[],
                    child: React.ReactElement<IMSKTabProps>
                ) => {
                    if (!child.props.hide) {
                        if (child.props.id === targetTabId) {
                            this.shownTabs.push(child.props.id);
                            memo.push(this.cloneTab(child, false));
                        } else if (
                            (child.props.unmountOnHide === false ||
                                (child.props.unmountOnHide === undefined &&
                                    this.props.unmountOnHide === false)) &&
                            _.includes(this.shownTabs, child.props.id)
                        ) {
                            // if we're NOT unmounting it and the tab has been shown and it's not loading, include it
                            memo.push(this.cloneTab(child, true));
                        }
                    }
                    return memo;
                },
                []
            );

            return (
                <div
                    id={this.props.id ? this.props.id : ''}
                    className={classnames(
                        'msk-tabs',
                        'posRelative',
                        this.props.className
                    )}
                >
                    {this.navTabs(children, targetTabId)}
                    <DeferredRender
                        className="tab-content"
                        loadingState={
                            <LoadingIndicator
                                isLoading={true}
                                center={true}
                                size={'big'}
                            />
                        }
                    >
                        {this.props.contentWindowExtra}
                        {arr}
                    </DeferredRender>
                </div>
            );
        } else {
            return null;
        }
    }

    protected navTabs(
        children: React.ReactElement<IMSKTabProps>[],
        effectiveActiveTab: string | undefined
    ) {
        // restart the tab refs before each tab rendering
        this.tabRefs = [];

        // if pagination is disabled, pages.length and pagesCount will be always 1
        const pages = this.tabPages(children, effectiveActiveTab);
        const pageCount = this.pageBreaks.length + 1;

        const prev =
            this.currentPage > 1 ? (
                <li key="prevPage" style={{ cursor: 'pointer' }}>
                    <a onClick={this.prevPage.bind(this)}>
                        <i
                            className="fa fa-chevron-left"
                            style={this.props.arrowStyle}
                        />
                    </a>
                </li>
            ) : null;

        const next =
            this.currentPage < pageCount ? (
                <li key="nextPage" style={{ cursor: 'pointer' }}>
                    <a onClick={this.nextPage.bind(this)}>
                        <i
                            className="fa fa-chevron-right"
                            style={this.props.arrowStyle}
                        />
                    </a>
                </li>
            ) : null;

        const navButtonStyle: string = this.props.tabButtonStyle || 'tabs';

        const isPending = React.Children.toArray(this.props.children).some(
            (c: any) => c.props.pending
        );

        return (
            <ul
                ref={this.navTabsRefHandler.bind(this)}
                className={classnames('nav', `nav-${navButtonStyle}`)}
            >
                {prev}
                {pages[this.currentPage - 1]}
                <li>
                    <LoadingIndicator
                        isLoading={isPending}
                        style={{ position: 'absolute', top: 10, minWidth: 50 }}
                        small={true}
                    />
                </li>
                {next}
            </ul>
        );
    }

    private getTabHref(tabId: string) {
        if (this.props.hrefRoot) {
            return URL.format({
                pathname: `${this.props.hrefRoot}/${tabId}`,
                search: getBrowserWindow().location.search,
                hash: getBrowserWindow().location.hash,
            });
        } else {
            // will disable without losing styles
            return undefined;
        }
    }

    protected tabPages(
        children: React.ReactElement<IMSKTabProps>[],
        effectiveActiveTab: string | undefined
    ): JSX.Element[][] {
        const pages: JSX.Element[][] = [[]];
        let currentPage = 1;

        React.Children.forEach(
            children,
            (tab: React.ReactElement<IMSKTabProps>) => {
                // tab could be null/undefined here if getTab() happens to return null
                // instead of using hide prop
                if (!tab) return;

                const isActive = effectiveActiveTab === tab.props.id;

                // if we are not currently ROUTED to tab
                // then hide it as indicated
                // if we ARE ROUTED to it, we want to ignore
                if (!isActive) {
                    if (tab.props.hide) {
                        return;
                    }
                    if (tab.props.pending) {
                        return;
                    }
                }

                let activeClass =
                    effectiveActiveTab === tab.props.id ? 'active' : '';

                // find out if we need to add another page
                if (
                    this.props.getPaginationWidth &&
                    this.pageBreaks.length > 0 &&
                    this.pageBreaks[currentPage - 1] === tab.props.id
                ) {
                    currentPage++;
                    pages[currentPage - 1] = [];
                }

                let closeButton: JSX.Element | null = null;
                if (tab.props.onClickClose) {
                    const onClickClose = tab.props.onClickClose;
                    closeButton = (
                        <div
                            className="closeButton"
                            onClick={e => {
                                e.stopPropagation();
                                onClickClose(tab.props.id);
                            }}
                        >
                            <i className="fa fa-md fa-times-circle" />
                        </div>
                    );
                }

                const href = this.getTabHref(tab.props.id);

                pages[currentPage - 1].push(
                    <li
                        key={tab.props.id}
                        style={{ cursor: 'pointer' }}
                        ref={this.tabRefHandler.bind(this, tab.props.id)}
                        className={activeClass}
                    >
                        {' '}
                        {tab.props.linkOverride || (
                            <DefaultTooltip
                                overlay={tab.props.linkTooltip}
                                mouseEnterDelay={0}
                                placement="top"
                                visible={
                                    tab.props.linkTooltip ? undefined : false
                                }
                            >
                                <a
                                    className={classnames(
                                        'tabAnchor',
                                        `tabAnchor_${tab.props.id}`,
                                        tab.props.anchorClassName
                                    )}
                                    onClick={this.tabClickHandlers(tab.props)}
                                    href={href}
                                    style={tab.props.anchorStyle}
                                >
                                    {tab.props.linkText}
                                    {closeButton}
                                </a>
                            </DefaultTooltip>
                        )}
                    </li>
                );
            }
        );

        return pages;
    }

    static getVisibleTabIds(tabs: MSKTab[]) {
        return React.Children.map(tabs, tab =>
            tab && !tab.props.hide ? tab.props.id : null
        ).filter(x => x !== null);
    }

    componentWillReceiveProps(nextProps: Readonly<IMSKTabsProps>): void {
        if (
            !_.isEqual(
                MSKTabs.getVisibleTabIds((nextProps as any).children),
                MSKTabs.getVisibleTabIds((this.props as any).children)
            )
        ) {
            // visible tabs have changed -> need to recompute nav tab widths, which will also initiate repagination
            this.needToRecomputeNavTabWidths = true;
        }
    }

    componentDidMount() {
        this.computeNavTabWidths();
        this.needToRecomputeNavTabWidths = false;

        this.widthReaction = autorun(() => {
            if (this.props.getPaginationWidth) {
                this.props.getPaginationWidth(); // react to changes in pagination width
                this.initPaging();
            }
        });
    }

    componentWillUnmount() {
        this.widthReaction();
    }

    componentDidUpdate() {
        // recompute pagination and paginate to current tab
        if (this.needToRecomputeNavTabWidths) {
            this.computeNavTabWidths();
            this.needToRecomputeNavTabWidths = false;
            this.initPaging();
        }
    }

    computeNavTabWidths() {
        //this.tabIdToNavTabWidth = {};
        _.each(this.tabRefs, ref => {
            this.tabIdToNavTabWidth[ref.id] = ref.element.offsetWidth;
        });
        (window as any).test = this.tabIdToNavTabWidth;
    }

    @action.bound
    initPaging() {
        if (this.props.getPaginationWidth) {
            // find page breaks: depends on width of the container
            this.pageBreaks = this.findPageBreaks();

            // find current page: depends on active tab id
            this.currentPage = this.findCurrentPage(this.pageBreaks);
        }
    }

    findCurrentPage(pageBreaks: string[]) {
        let currentPage = 1;
        let found = false;

        if (this.props.activeTabId && pageBreaks.length > 0) {
            _.each(this.tabRefs, ref => {
                // we reached a page break before reaching the active tab id.
                // increment current page
                if (ref.id === pageBreaks[currentPage - 1]) {
                    currentPage++;
                }

                // we reached the active tab id within current page.
                // break the each loop, and return current page.
                if (ref.id === this.props.activeTabId) {
                    found = true;
                    return false;
                }
            });
        }

        // in case active tab id is not valid, default to first page
        return found ? currentPage : 1;
    }

    findPageBreaks() {
        const pageBreaks: string[] = [];

        if (this.needToRecomputeNavTabWidths) {
            return []; // no page breaks if we still need to recompute widths - need to render them all at once to get width
        }

        const containerWidth =
            (this.props.getPaginationWidth &&
                this.props.getPaginationWidth()) ||
            0;

        // do not attempt paging if container width is zero
        if (containerWidth > 0) {
            let width = 0;

            React.Children.forEach(
                this.props.children,
                (tab: MSKTab | null, index: number) => {
                    if (!tab || !(tab.props.id in this.tabIdToNavTabWidth)) {
                        // skip a null child or a tab that hasnt been rendered yet
                        return;
                    }
                    width += this.tabIdToNavTabWidth[tab.props.id];

                    if (index === 0) {
                        // page break not allowed at first tab
                        return;
                    }

                    const padding = 50;
                    // add a page break, and reset the width for the next page
                    if (width > containerWidth - padding) {
                        pageBreaks.push(tab.props.id);
                        width = this.tabIdToNavTabWidth[tab.props.id];
                    }
                }
            );
        }

        return pageBreaks;
    }
}
