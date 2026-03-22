import autobind from 'autobind-decorator';
import * as React from 'react';
import { FormEvent } from 'react';

interface ISearchBoxProps {
    onChange?: (input: string) => void;
    filterInputRef?: (input: HTMLInputElement) => void;
    placeholder?: string;
    searchIconClassName?: string;
    boxHeight?: number;
}

export class SearchBox extends React.Component<ISearchBoxProps> {
    public static defaultProps = {
        placeholder: '',
        searchIconClassName: 'fa fa-search form-control-feedback',
        boxHeight: 33.5,
    };

    public render() {
        return (
            <div className="input-group" style={{ display: 'flex' }}>
                <input
                    type="text"
                    onInput={this.onChange}
                    ref={this.props.filterInputRef}
                    className="form-control"
                    placeholder={this.props.placeholder}
                    aria-label="Search"
                    style={{ height: this.props.boxHeight }}
                />
                <div
                    className="input-group-append"
                    style={{ height: this.props.boxHeight }}
                >
                    <button
                        className="btn btn-outline-secondary"
                        type="button"
                        disabled={true}
                    >
                        <i className="fa fa-search" />
                    </button>
                </div>
            </div>
        );
    }

    @autobind
    private onChange(event: FormEvent<any>) {
        if (this.props.onChange) {
            this.props.onChange(event.currentTarget.value);
        }
    }
}

export default SearchBox;
