import * as React from 'react';
import { observer } from 'mobx-react';
import { observable, action, computed, makeObservable } from 'mobx';
import Select from 'react-select';
import AsyncSelect from 'react-select/async';
import { If, Then, Else } from 'react-if';
import _ from 'lodash';
import LabeledCheckbox from '../labeledCheckbox/LabeledCheckbox';
import {
    ColoringMenuOmnibarOption,
    ColoringMenuOmnibarGroup,
    NONE_SELECTED_OPTION_NUMERICAL_VALUE,
} from '../../components/plots/PlotsTab';
import { ClinicalAttribute, Gene } from 'cbioportal-ts-api-client';
import { SpecialAttribute } from '../../cache/ClinicalDataCache';

export interface ColorSamplesByDropdownProps {
    // Data sources
    genes: Gene[];
    clinicalAttributes: ClinicalAttribute[];

    // Current selection
    selectedOption?: ColoringMenuOmnibarOption;
    logScale: boolean;

    // Configuration
    hasNoQueriedGenes: boolean;
    logScalePossible: boolean;
    isLoading: boolean;

    // Gene-based coloring options (like PlotsTab)
    mutationDataExists?: boolean;
    cnaDataExists?: boolean;
    svDataExists?: boolean;
    mutationTypeEnabled?: boolean;
    copyNumberEnabled?: boolean;
    structuralVariantEnabled?: boolean;

    // Event handlers
    onSelectionChange: (option: ColoringMenuOmnibarOption | undefined) => void;
    onLogScaleChange: (enabled: boolean) => void;
    onMutationTypeToggle?: (enabled: boolean) => void;
    onCopyNumberToggle?: (enabled: boolean) => void;
    onStructuralVariantToggle?: (enabled: boolean) => void;

    // Additional option groups to insert before Clinical Attributes
    additionalGroups?: ColoringMenuOmnibarGroup[];

    // Optional styling
    className?: string;
    style?: React.CSSProperties;
}

@observer
export class ColorSamplesByDropdown extends React.Component<
    ColorSamplesByDropdownProps
> {
    private lastSearchTerm = '';

    constructor(props: ColorSamplesByDropdownProps) {
        super(props);
        makeObservable(this);
    }

    @computed get coloringMenuOmnibarOptions(): (
        | ColoringMenuOmnibarOption
        | ColoringMenuOmnibarGroup
    )[] {
        const allOptions: (
            | ColoringMenuOmnibarOption
            | ColoringMenuOmnibarGroup
        )[] = [];

        // Add gene options with pre-computed search strings for performance
        if (this.props.genes.length > 0) {
            allOptions.push({
                label: 'Genes',
                options: this.props.genes.map(
                    gene =>
                        ({
                            label: gene.hugoGeneSymbol,
                            value: `gene_${gene.entrezGeneId}`,
                            info: {
                                entrezGeneId: gene.entrezGeneId,
                            },
                            // Pre-compute lowercase for faster searching
                            searchString: gene.hugoGeneSymbol.toLowerCase(),
                        } as any)
                ),
            });
        }

        // Add additional groups (e.g., "Map Attributes") before Clinical Attributes
        if (this.props.additionalGroups) {
            allOptions.push(...this.props.additionalGroups);
        }

        // Add clinical attributes
        if (this.props.clinicalAttributes.length > 0) {
            allOptions.push({
                label: 'Clinical Attributes',
                options: this.props.clinicalAttributes
                    .filter(
                        a =>
                            a.clinicalAttributeId !==
                            SpecialAttribute.MutationSpectrum
                    )
                    .map(
                        clinicalAttribute =>
                            ({
                                label: clinicalAttribute.displayName,
                                value: `clinical_${clinicalAttribute.clinicalAttributeId}`,
                                info: {
                                    clinicalAttribute,
                                },
                                // Pre-compute lowercase for faster searching
                                searchString: clinicalAttribute.displayName.toLowerCase(),
                            } as any)
                    ),
            });
        }

        // Add 'None' option to the top
        if (allOptions.length > 0) {
            allOptions.unshift({
                label: 'None',
                value: 'none',
                info: {
                    entrezGeneId: NONE_SELECTED_OPTION_NUMERICAL_VALUE,
                },
            });
        }

        return allOptions;
    }

    @computed get flattenedOptions(): ColoringMenuOmnibarOption[] {
        return this.coloringMenuOmnibarOptions.reduce<
            ColoringMenuOmnibarOption[]
        >((acc, item) => {
            if ('options' in item) {
                return acc.concat(item.options);
            } else {
                return acc.concat(item);
            }
        }, []);
    }

    @computed get isGeneSelected(): boolean {
        return !!(
            this.props.selectedOption?.info?.entrezGeneId &&
            this.props.selectedOption.info.entrezGeneId !==
                NONE_SELECTED_OPTION_NUMERICAL_VALUE
        );
    }

    @action.bound
    private handleSelectionChange(
        selectedOption: ColoringMenuOmnibarOption | null
    ) {
        this.props.onSelectionChange(selectedOption || undefined);
    }

    @action.bound
    private handleLogScaleChange() {
        this.props.onLogScaleChange(!this.props.logScale);
    }

    @action.bound
    private handleMutationTypeToggle() {
        if (this.props.onMutationTypeToggle) {
            this.props.onMutationTypeToggle(!this.props.mutationTypeEnabled);
        }
    }

    @action.bound
    private handleCopyNumberToggle() {
        if (this.props.onCopyNumberToggle) {
            this.props.onCopyNumberToggle(!this.props.copyNumberEnabled);
        }
    }

    @action.bound
    private handleStructuralVariantToggle() {
        if (this.props.onStructuralVariantToggle) {
            this.props.onStructuralVariantToggle(
                !this.props.structuralVariantEnabled
            );
        }
    }

    // Optimized string comparison with priority matching
    private getMatchScore = (
        option: ColoringMenuOmnibarOption,
        searchTerm: string
    ): number => {
        // Use pre-computed search string if available, otherwise compute
        const label =
            (option as any).searchString || option.label.toLowerCase();
        const search = searchTerm.toLowerCase();

        if (label === search) return 100; // Exact match
        if (label.startsWith(search)) return 80; // Starts with
        if (label.includes(search)) return 60; // Contains
        return 0; // No match
    };

    private loadColoringOptionsImpl = async (
        inputValue: string
    ): Promise<(ColoringMenuOmnibarOption | ColoringMenuOmnibarGroup)[]> => {
        if (!inputValue || inputValue.length === 0) {
            // Return grouped options with limited genes for performance
            return this.coloringMenuOmnibarOptions.map(item => {
                if ('options' in item && item.label === 'Genes') {
                    // Show more initial genes for better UX
                    return {
                        ...item,
                        options: item.options.slice(0, 50),
                    };
                }
                return item;
            });
        }

        // Filter and maintain group structure with relevance scoring
        const filteredGroups: (
            | ColoringMenuOmnibarOption
            | ColoringMenuOmnibarGroup
        )[] = [];

        for (const item of this.coloringMenuOmnibarOptions) {
            if ('options' in item) {
                // This is a group - filter and sort by relevance
                const scoredOptions = item.options
                    .map(option => ({
                        option,
                        score: this.getMatchScore(option, inputValue),
                    }))
                    .filter(scored => scored.score > 0)
                    .sort((a, b) => b.score - a.score)
                    .map(scored => scored.option);

                if (scoredOptions.length > 0) {
                    filteredGroups.push({
                        ...item,
                        options: scoredOptions.slice(0, 50), // Increased limit for better UX
                    });
                }
            } else {
                // This is a single option (like "None")
                if (this.getMatchScore(item, inputValue) > 0) {
                    filteredGroups.push(item);
                }
            }
        }

        return filteredGroups;
    };

    private loadColoringOptions = async (
        inputValue: string
    ): Promise<(ColoringMenuOmnibarOption | ColoringMenuOmnibarGroup)[]> => {
        this.lastSearchTerm = inputValue;

        // For very short searches, apply a small delay to avoid excessive calls
        if (inputValue && inputValue.length > 0 && inputValue.length < 3) {
            // Small delay for short terms to avoid excessive filtering
            await new Promise(resolve => setTimeout(resolve, 150));

            // Check if search term changed during delay - if so, cancel this request
            if (this.lastSearchTerm !== inputValue) {
                return [];
            }
        }

        return await this.loadColoringOptionsImpl(inputValue);
    };

    render() {
        const selectProps = {
            className: 'color-samples-toolbar-elt gene-select',
            value: this.props.selectedOption,
            onChange: this.handleSelectionChange,
            isLoading: this.props.isLoading,
            clearable: false,
            searchable: true,
            disabled: !this.coloringMenuOmnibarOptions.length,
        };

        return (
            <div
                style={{
                    display: 'inline-flex',
                    position: 'relative',
                    alignItems: 'center',
                    ...this.props.style,
                }}
                data-test="ColorSamplesByDropdown"
                className={`coloring-menu ${this.props.className || ''}`}
            >
                <label className="legend-label">Color by:</label>
                &nbsp;
                <div
                    style={{
                        display: 'inline-block',
                    }}
                    className="gene-select-background"
                >
                    <div className="checkbox gene-select-container">
                        <If condition={this.props.hasNoQueriedGenes}>
                            <Then>
                                <AsyncSelect
                                    aria-label="Gene or Clinical Attribute Search Dropdown"
                                    name="colorSamplesByDropdown"
                                    {...selectProps}
                                    noOptionsMessage={(obj: {
                                        inputValue: string;
                                    }) => {
                                        if (
                                            obj.inputValue &&
                                            obj.inputValue.length > 0
                                        ) {
                                            return `No results found for "${obj.inputValue}"`;
                                        }
                                        return 'Search for gene or clinical attribute';
                                    }}
                                    loadOptions={this.loadColoringOptions}
                                    defaultOptions={true} // Load initial options on mount
                                    cacheOptions={true}
                                    loadingMessage={() => 'Searching...'}
                                />
                            </Then>
                            <Else>
                                <Select
                                    name="colorSamplesByDropdown"
                                    {...selectProps}
                                    options={this.coloringMenuOmnibarOptions}
                                />
                            </Else>
                        </If>
                    </div>
                </div>
                {this.props.logScalePossible && (
                    <LabeledCheckbox
                        checked={this.props.logScale}
                        onChange={this.handleLogScaleChange}
                        inputProps={{
                            style: { marginTop: 4 },
                            className: 'coloringLogScale',
                        }}
                    >
                        Log Scale
                    </LabeledCheckbox>
                )}
                {/* Gene-based coloring checkboxes (like PlotsTab) */}
                {this.isGeneSelected && (
                    <div
                        style={{
                            marginLeft: '10px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '10px',
                        }}
                    >
                        {this.props.mutationDataExists && (
                            <LabeledCheckbox
                                checked={
                                    this.props.mutationTypeEnabled || false
                                }
                                onChange={this.handleMutationTypeToggle}
                                inputProps={{
                                    style: { marginTop: 4 },
                                    className: 'mutationTypeToggle',
                                }}
                            >
                                Mutation Type
                            </LabeledCheckbox>
                        )}

                        {this.props.cnaDataExists && (
                            <LabeledCheckbox
                                checked={this.props.copyNumberEnabled || false}
                                onChange={this.handleCopyNumberToggle}
                                inputProps={{
                                    style: { marginTop: 4 },
                                    className: 'copyNumberToggle',
                                }}
                            >
                                Copy Number
                            </LabeledCheckbox>
                        )}

                        {this.props.svDataExists && (
                            <LabeledCheckbox
                                checked={
                                    this.props.structuralVariantEnabled || false
                                }
                                onChange={this.handleStructuralVariantToggle}
                                inputProps={{
                                    style: { marginTop: 4 },
                                    className: 'structuralVariantToggle',
                                }}
                            >
                                Structural Variant
                            </LabeledCheckbox>
                        )}
                    </div>
                )}
            </div>
        );
    }
}

export default ColorSamplesByDropdown;
