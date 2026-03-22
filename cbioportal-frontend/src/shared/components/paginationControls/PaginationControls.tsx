import * as React from 'react';
import { Button, ButtonGroup, FormGroup, FormControl } from 'react-bootstrap';
import styles from './paginationControls.module.scss';
import { If, Then, Else } from 'react-if';
import { observer } from 'mobx-react';
import classNames from 'classnames';
import { EditableSpan } from 'cbioportal-frontend-commons';

export const SHOW_ALL_PAGE_SIZE = -1;

export const MAX_DIGITS = 6;

export interface IPaginationControlsProps {
    currentPage?: number;
    totalItems?: number;
    itemsPerPage?: number;
    itemsPerPageOptions?: number[]; // sorted ascending
    showAllOption?: boolean;
    showMoreButton?: boolean;
    textBeforeButtons?: string;
    textBetweenButtons?: string | JSX.Element;
    firstButtonContent?: string | JSX.Element;
    previousButtonContent?: string | JSX.Element;
    nextButtonContent?: string | JSX.Element;
    lastButtonContent?: string | JSX.Element;
    showFirstPage?: boolean;
    showLastPage?: boolean;
    showItemsPerPageSelector?: boolean;
    onChangeItemsPerPage?: (itemsPerPage: number) => void;
    onFirstPageClick?: () => void;
    onPreviousPageClick?: () => void;
    onNextPageClick?: () => void;
    onLastPageClick?: () => void;
    onChangeCurrentPage?: (newPage: number) => void;
    className?: string;
    style?: { [k: string]: string | number };
    firstPageDisabled?: boolean;
    previousPageDisabled?: boolean;
    nextPageDisabled?: boolean;
    lastPageDisabled?: boolean;
    pageNumberEditable?: boolean;
    groupButtons?: boolean;
    hidePaginationIfOnePage?: boolean;
    bsStyle?: 'default' | 'primary' | 'success' | 'info' | 'warning';
    isResultLimitedAtMaxPage?: boolean;
}

@observer
export class PaginationControls extends React.Component<
    IPaginationControlsProps,
    {}
> {
    public static defaultProps = {
        itemsPerPage: SHOW_ALL_PAGE_SIZE,
        itemsPerPageOptions: [10, 25, 50, 100],
        showAllOption: true,
        textBeforeButtons: '',
        textBetweenButtons: 'text btwn buttons',
        firstButtonContent: <i className="fa fa-angle-double-left" />,
        previousButtonContent: <i className="fa fa-angle-left" />,
        nextButtonContent: <i className="fa fa-angle-right" />,
        lastButtonContent: <i className="fa fa-angle-double-right" />,
        showItemsPerPageSelector: true,
        showFirstPage: false,
        showLastPage: false,
        className: '',
        style: {},
        previousPageDisabled: false,
        nextPageDisabled: false,
        pageNumberEditable: false,
        showMoreButton: true,
        groupButtons: true,
        hidePaginationIfOnePage: true,
        bsStyle: 'default',
    };

    constructor(props: IPaginationControlsProps) {
        super(props);
        this.handleChangeItemsPerPage = this.handleChangeItemsPerPage.bind(
            this
        );
        this.resetItemsPerPage = this.resetItemsPerPage.bind(this);
        this.jumpToPage = this.jumpToPage.bind(this);
        this.handleShowMore = this.handleShowMore.bind(this);
        this.getSectionBetweenPaginationButtons = this.getSectionBetweenPaginationButtons.bind(
            this
        );
    }

    private jumpToPage(p: string) {
        if (this.props.onChangeCurrentPage) {
            this.props.onChangeCurrentPage(parseInt(p, 10));
        }
    }

    handleChangeItemsPerPage(evt: React.FormEvent<HTMLSelectElement>) {
        if (this.props.onChangeItemsPerPage) {
            this.props.onChangeItemsPerPage(
                parseInt((evt.target as HTMLSelectElement).value, 10)
            );
        }
    }

    handleShowMore() {
        if (
            this.props.itemsPerPageOptions &&
            this.props.itemsPerPageOptions.length > 0 &&
            this.props.itemsPerPage &&
            this.props.onChangeItemsPerPage
        ) {
            const index = this.props.itemsPerPageOptions.indexOf(
                this.props.itemsPerPage
            );
            if (
                index > -1 &&
                index < this.props.itemsPerPageOptions.length - 1
            ) {
                this.props.onChangeItemsPerPage(
                    this.props.itemsPerPageOptions[index + 1]
                );
            } else {
                this.props.onChangeItemsPerPage(
                    this.props.itemsPerPage +
                        this.props.itemsPerPageOptions[
                            this.props.itemsPerPageOptions.length - 1
                        ]
                );
            }
        }
    }

    resetItemsPerPage() {
        this.props.onChangeItemsPerPage &&
            this.props.itemsPerPageOptions &&
            this.props.itemsPerPageOptions.length > 0 &&
            this.props.onChangeItemsPerPage(this.props.itemsPerPageOptions[0]);
    }

    private getSectionBetweenPaginationButtons() {
        if (this.props.showMoreButton) {
            return (
                <Button
                    id="showMoreButton"
                    bsSize="sm"
                    disabled={
                        this.props.isResultLimitedAtMaxPage ||
                        !this.props.itemsPerPageOptions ||
                        !this.props.itemsPerPage ||
                        !this.props.totalItems ||
                        this.props.itemsPerPage >= this.props.totalItems
                    }
                    onClick={this.handleShowMore}
                    style={{ width: 200 }}
                    bsStyle={this.props.bsStyle}
                >
                    Show more
                </Button>
            );
        } else {
            return (
                <span
                    key="textBetweenButtons"
                    className={classNames(
                        'btn',
                        'btn-sm',
                        'btn-default',
                        'textBetweenButtons',
                        'disabled',
                        styles['default-cursor']
                    )}
                    style={{ cursor: 'default', color: 'black' }} // HACK for parent project
                >
                    <If condition={this.props.pageNumberEditable}>
                        <EditableSpan
                            className={styles['page-number-input']}
                            value={this.props.currentPage + ''}
                            setValue={this.jumpToPage}
                            maxChars={MAX_DIGITS}
                            numericOnly={true}
                        />
                    </If>
                    {this.props.textBetweenButtons}
                </span>
            );
        }
    }

    private get shouldHidePaginationControls() {
        return (
            this.props.hidePaginationIfOnePage &&
            this.props.itemsPerPageOptions &&
            typeof this.props.totalItems !== 'undefined' &&
            this.props.itemsPerPageOptions[0] >= this.props.totalItems
        );
    }

    render() {
        const pageSizeOptionElts = (this.props.itemsPerPageOptions || []).map(
            (opt: number) => (
                <option key={opt} value={opt + ''}>
                    {opt}
                </option>
            )
        );
        if (this.props.showAllOption) {
            pageSizeOptionElts.push(
                <option key="all" value={SHOW_ALL_PAGE_SIZE + ''}>
                    all
                </option>
            );
        }

        let buttons: any = [
            <If condition={!!this.props.showFirstPage}>
                <Button
                    key="firstPageBtn"
                    bsSize="sm"
                    disabled={!!this.props.firstPageDisabled}
                    onClick={this.props.onFirstPageClick}
                    className={classNames(
                        this.props.groupButtons
                            ? undefined
                            : styles['margin-right-button']
                    )}
                    bsStyle={this.props.bsStyle}
                    aria-label={
                        typeof this.props.firstButtonContent === 'string' &&
                        !!this.props.firstButtonContent
                            ? undefined
                            : 'View First Page'
                    }
                >
                    {this.props.firstButtonContent}
                </Button>
            </If>,
            <Button
                className={classNames(
                    'prevPageBtn',
                    this.props.groupButtons
                        ? undefined
                        : styles['margin-right-button']
                )}
                key="prevPageBtn"
                bsSize="sm"
                disabled={!!this.props.previousPageDisabled}
                onClick={this.props.onPreviousPageClick}
                bsStyle={this.props.bsStyle}
                aria-label={
                    typeof this.props.previousButtonContent === 'string' &&
                    !!this.props.previousButtonContent
                        ? undefined
                        : 'View Previous Page'
                }
            >
                {this.props.previousButtonContent}
            </Button>,
            this.getSectionBetweenPaginationButtons(),
            <Button
                className={classNames(
                    'nextPageBtn',
                    this.props.groupButtons
                        ? undefined
                        : styles['margin-left-button']
                )}
                key="nextPageBtn"
                bsSize="sm"
                disabled={!!this.props.nextPageDisabled}
                onClick={this.props.onNextPageClick}
                bsStyle={this.props.bsStyle}
                aria-label={
                    typeof this.props.nextButtonContent === 'string' &&
                    !!this.props.nextButtonContent
                        ? undefined
                        : 'View Next Page'
                }
            >
                {this.props.nextButtonContent}
            </Button>,
            <If condition={!!this.props.showLastPage}>
                <Button
                    key="lastPageBtn"
                    bsSize="sm"
                    disabled={!!this.props.lastPageDisabled}
                    onClick={this.props.onLastPageClick}
                    className={classNames(
                        this.props.groupButtons
                            ? undefined
                            : styles['margin-left-button']
                    )}
                    bsStyle={this.props.bsStyle}
                    aria-label={
                        typeof this.props.lastButtonContent === 'string' &&
                        !!this.props.lastButtonContent
                            ? undefined
                            : 'View Last Page'
                    }
                >
                    {this.props.lastButtonContent}
                </Button>
            </If>,
            <If condition={!!this.props.showMoreButton}>
                <Button
                    id="resetItemsPerPageButton"
                    bsStyle="link"
                    bsSize="sm"
                    className={
                        this.props.itemsPerPage &&
                        this.props.itemsPerPageOptions &&
                        this.props.itemsPerPageOptions.length > 0 &&
                        this.props.itemsPerPage >
                            this.props.itemsPerPageOptions[0]
                            ? undefined
                            : styles['hidden-button']
                    }
                    onClick={this.resetItemsPerPage}
                >
                    Reset
                </Button>
            </If>,
        ];

        if (this.props.groupButtons) {
            buttons = (
                <ButtonGroup style={{ float: 'none' }}>{buttons}</ButtonGroup>
            );
        } else {
            buttons = <div style={{ float: 'none' }}>{buttons}</div>;
        }

        if (this.shouldHidePaginationControls) {
            buttons = null;
        }

        return (
            <div
                className={classNames(
                    styles.paginationControls,
                    this.props.className
                )}
                style={this.props.style}
            >
                <span style={{ fontSize: 12, marginRight: 10 }}>
                    {this.props.textBeforeButtons}
                </span>
                {buttons}
                <If
                    condition={
                        !!this.props.showItemsPerPageSelector &&
                        !this.shouldHidePaginationControls
                    }
                >
                    <FormGroup bsSize="sm" className={styles['form-select']}>
                        <FormControl
                            className="itemsPerPageSelector"
                            componentClass="select"
                            value={this.props.itemsPerPage}
                            onChange={
                                this
                                    .handleChangeItemsPerPage as React.FormEventHandler<
                                    any
                                >
                            }
                        >
                            {pageSizeOptionElts}
                        </FormControl>
                    </FormGroup>
                </If>
            </div>
        );
    }
}

export default PaginationControls;
