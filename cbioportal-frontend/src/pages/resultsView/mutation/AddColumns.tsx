import * as React from 'react';
import { observer } from 'mobx-react';
import { action, computed, makeObservable, observable } from 'mobx';
import { getTextWidth, MobxPromise } from 'cbioportal-frontend-commons';
import { ClinicalAttribute } from 'cbioportal-ts-api-client';
import { IColumnVisibilityControlsProps } from 'shared/components/columnVisibilityControls/ColumnVisibilityControls';
import { MSKTab, MSKTabs } from 'shared/components/MSKTabs/MSKTabs';
import CustomDropdown from 'shared/components/oncoprint/controls/CustomDropdown';
import AddChartByType from '../../studyView/addChartButton/addChartByType/AddChartByType';

export interface IAddColumnsProps extends IColumnVisibilityControlsProps {
    clinicalAttributes: ClinicalAttribute[];
    clinicalAttributeIdToAvailableFrequency: MobxPromise<{
        [clinicalAttributeId: string]: number;
    }>;
}

enum Tab {
    MUTATIONS = 'Mutations',
    CLINICAL = 'Clinical',
}

type Option = {
    key: string;
    label: string;
    selected: boolean;
};

const MIN_DROPDOWN_WIDTH = 400;
const CONTAINER_PADDING_WIDTH = 20;
const TAB_PADDING_WIDTH = 14;
const COUNT_PADDING_WIDTH = 17;
@observer
export default class AddColumns extends React.Component<IAddColumnsProps, {}> {
    @observable tabId: Tab = Tab.MUTATIONS;

    constructor(props: IAddColumnsProps) {
        super(props);
        makeObservable(this);
    }

    @action.bound
    private updateTabId(newId: Tab) {
        this.tabId = newId;
    }

    @action.bound
    private addAll(ids: string[], options: Option[]) {
        if (this.props.onColumnToggled && options.length > 0) {
            for (let option of options) {
                if (!option.selected && ids.includes(option.key)) {
                    this.props.onColumnToggled(option.key);
                }
            }
        }
    }

    @action.bound
    private clearAll(ids: string[], options: Option[]) {
        if (this.props.onColumnToggled && options.length > 0) {
            for (let option of options) {
                if (option.selected && ids.includes(option.key)) {
                    this.props.onColumnToggled(option.key);
                }
            }
        }
    }

    @action.bound
    private toggle(id: string) {
        if (this.props.onColumnToggled) {
            this.props.onColumnToggled(id);
        }
    }

    @computed get clinicalAttributeIds(): Set<string> {
        let ids: Set<string> = new Set();
        this.props.clinicalAttributes.forEach(x =>
            ids.add(x.clinicalAttributeId)
        );
        return ids
            .add('CANCER_STUDY')
            .add('CANCER_TYPE_DETAILED')
            .add('MUTATION_COUNT');
    }

    @computed get mutationsOptions(): Option[] {
        if (!this.props.columnVisibility) {
            return [];
        }

        return this.props.columnVisibility
            .filter(col => !this.clinicalAttributeIds.has(col.id))
            .map(col => ({
                key: col.id,
                label: col.name,
                selected: col.visible,
            }));
    }

    @computed get numSelectedMutationsOptions() {
        return this.mutationsOptions.filter(opt => opt.selected).length;
    }

    @computed get mutationsTabContent() {
        return (
            <AddChartByType
                options={this.mutationsOptions}
                onAddAll={(ids: string[]) =>
                    this.addAll(ids, this.mutationsOptions)
                }
                onClearAll={(ids: string[]) =>
                    this.clearAll(ids, this.mutationsOptions)
                }
                onToggleOption={this.toggle}
                optionsGivenInSortedOrder={true}
                width={this.dropdownWidth}
            />
        );
    }

    @computed get clinicalOptions(): Option[] {
        if (!this.props.columnVisibility) {
            return [];
        }

        return this.props.columnVisibility
            .filter(col => this.clinicalAttributeIds.has(col.id))
            .map(col => ({
                key: col.id,
                label: col.name,
                selected: col.visible,
            }));
    }

    @computed get numSelectedClinicalOptions() {
        return this.clinicalOptions.filter(opt => opt.selected).length;
    }

    @computed get clinicalTabContent() {
        return (
            <AddChartByType
                options={this.clinicalOptions}
                freqPromise={this.props.clinicalAttributeIdToAvailableFrequency}
                onAddAll={(ids: string[]) =>
                    this.addAll(ids, this.clinicalOptions)
                }
                onClearAll={(ids: string[]) =>
                    this.clearAll(ids, this.clinicalOptions)
                }
                onToggleOption={this.toggle}
                optionsGivenInSortedOrder={false}
                width={this.dropdownWidth}
            />
        );
    }

    @computed get mutationsTabText() {
        return (
            <span style={{ marginTop: '3px', marginBottom: '3px' }}>
                {Tab.MUTATIONS}
                <span style={{ paddingLeft: 5 }}>
                    <span className="oncoprintDropdownCount">
                        {this.numSelectedMutationsOptions} /{' '}
                        {this.mutationsOptions.length}
                    </span>
                </span>
            </span>
        );
    }

    @computed get clinicalTabText() {
        return (
            <span style={{ marginTop: '3px', marginBottom: '3px' }}>
                {Tab.CLINICAL}
                <span style={{ paddingLeft: 5 }}>
                    <span className="oncoprintDropdownCount">
                        {this.numSelectedClinicalOptions} /{' '}
                        {this.clinicalOptions.length}
                    </span>
                </span>
            </span>
        );
    }

    @computed get dropdownButtonText() {
        const numSelected =
            this.numSelectedMutationsOptions + this.numSelectedClinicalOptions;
        const numTotal =
            this.mutationsOptions.length + this.clinicalOptions.length;
        return `Columns (${numSelected} / ${numTotal})`;
    }

    private getTextPixel(text: string, fontSize: string) {
        return Math.floor(getTextWidth(text, 'Helvetica Neue', fontSize));
    }

    @computed get dropdownWidth() {
        let width = 2 * CONTAINER_PADDING_WIDTH;
        const HEADER_FONT_SIZE = '14px';
        const COUNT_FONT_SIZE = '11px';

        const textWidth =
            this.getTextPixel(Tab.CLINICAL, HEADER_FONT_SIZE) +
            TAB_PADDING_WIDTH;
        const countTextWidth =
            this.getTextPixel(
                this.clinicalOptions.length.toString(),
                COUNT_FONT_SIZE
            ) + COUNT_PADDING_WIDTH;
        width += textWidth + countTextWidth;

        return Math.max(width, MIN_DROPDOWN_WIDTH);
    }

    render() {
        const haveMutationsOptions = this.mutationsOptions.length > 0;
        const haveClinicalOptions = this.clinicalOptions.length > 0;
        const showTabs = haveMutationsOptions || haveClinicalOptions;

        return (
            <div style={{ float: 'right' }}>
                <CustomDropdown
                    bsStyle="default"
                    title={this.dropdownButtonText}
                    id="addColumnsDropdown"
                    className={this.props.className}
                    styles={{ minWidth: MIN_DROPDOWN_WIDTH, width: 'auto' }}
                    buttonClassName="btn btn-default btn-sm"
                >
                    <div
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                        }}
                    >
                        {showTabs && (
                            <MSKTabs
                                activeTabId={this.tabId}
                                onTabClick={this.updateTabId}
                                unmountOnHide={false}
                                className="mainTabs mutationsTabAddColumnsDropdown"
                            >
                                {haveMutationsOptions && (
                                    <MSKTab
                                        key={0}
                                        id={Tab.MUTATIONS}
                                        linkText={this.mutationsTabText}
                                    >
                                        {this.mutationsTabContent}
                                    </MSKTab>
                                )}
                                {haveClinicalOptions && (
                                    <MSKTab
                                        key={1}
                                        id={Tab.CLINICAL}
                                        linkText={this.clinicalTabText}
                                    >
                                        {this.clinicalTabContent}
                                    </MSKTab>
                                )}
                            </MSKTabs>
                        )}
                        {showTabs && this.props.showResetColumnsButton && (
                            <button
                                style={{
                                    position: 'absolute',
                                    top: 11,
                                    right: 12,
                                    zIndex: 2,
                                }}
                                className="btn btn-primary btn-xs"
                                onClick={this.props.resetColumnVisibility}
                            >
                                Reset columns
                            </button>
                        )}
                    </div>
                </CustomDropdown>
            </div>
        );
    }
}
