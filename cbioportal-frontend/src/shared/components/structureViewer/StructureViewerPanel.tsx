import * as React from 'react';
import _ from 'lodash';
import { FormControl, Checkbox, Button, ButtonGroup } from 'react-bootstrap';
import { If, Else, Then } from 'react-if';
import { ThreeBounce } from 'better-react-spinkit';
import { observable, computed, makeObservable } from 'mobx';
import { observer } from 'mobx-react';
import Draggable from 'react-draggable';
import fileDownload from 'react-file-download';
import classnames from 'classnames';
import { IProteinImpactTypeColors } from 'react-mutation-mapper';
import PdbHeaderCache from 'shared/cache/PdbHeaderCache';
import ResidueMappingCache from 'shared/cache/ResidueMappingCache';
import {
    DefaultTooltip,
    DownloadControlOption,
} from 'cbioportal-frontend-commons';
import { ResidueMapping } from 'genome-nexus-ts-api-client';
import { CacheData } from 'shared/lib/LazyMobXCache';
import { ILazyMobXTableApplicationDataStore } from 'shared/lib/ILazyMobXTableApplicationDataStore';
import MutationMapperDataStore from 'shared/components/mutationMapper/MutationMapperDataStore';
import { Mutation } from 'cbioportal-ts-api-client';
import { IPdbChain, PdbAlignmentIndex } from 'shared/model/Pdb';
import {
    groupMutationsByProteinStartPos,
    getColorForProteinImpactType,
    getProteinStartPositionsByRange,
} from 'shared/lib/MutationUtils';
import StructureViewer from './StructureViewer';
import PdbChainInfo from '../PdbChainInfo';
import {
    ProteinScheme,
    ProteinColor,
    SideChain,
    MutationColor,
    IResidueSpec,
} from './StructureVisualizer';
import PyMolScriptGenerator from './PyMolScriptGenerator';

import styles from './structureViewer.module.scss';
import { getServerConfig } from 'config/config';

export interface IStructureViewerPanelProps extends IProteinImpactTypeColors {
    pdbChainDataStore: ILazyMobXTableApplicationDataStore<IPdbChain>;
    pdbAlignmentIndex?: PdbAlignmentIndex;
    mutationDataStore?: MutationMapperDataStore;
    pdbHeaderCache?: PdbHeaderCache;
    residueMappingCache?: ResidueMappingCache;
    uniprotId?: string;
    onClose?: () => void;
}

@observer
export default class StructureViewerPanel extends React.Component<
    IStructureViewerPanelProps,
    {}
> {
    @observable protected isCollapsed: boolean = false;
    @observable protected isIncreasedSize: boolean = false;
    @observable protected proteinScheme: ProteinScheme = ProteinScheme.CARTOON;
    @observable protected proteinColor: ProteinColor = ProteinColor.UNIFORM;
    @observable protected sideChain: SideChain = SideChain.SELECTED;
    @observable protected mutationColor: MutationColor =
        MutationColor.MUTATION_TYPE;
    @observable protected displayBoundMolecules: boolean = true;

    protected _3dMolDiv: HTMLDivElement | undefined;

    constructor(props: IStructureViewerPanelProps) {
        super(props);

        makeObservable(this);

        this.containerRefHandler = this.containerRefHandler.bind(this);
        this.toggleCollapse = this.toggleCollapse.bind(this);
        this.toggleDoubleSize = this.toggleDoubleSize.bind(this);
        this.handleProteinSchemeChange = this.handleProteinSchemeChange.bind(
            this
        );
        this.handleProteinColorChange = this.handleProteinColorChange.bind(
            this
        );
        this.handleSideChainChange = this.handleSideChainChange.bind(this);
        this.handleMutationColorChange = this.handleMutationColorChange.bind(
            this
        );
        this.handleBoundMoleculeChange = this.handleBoundMoleculeChange.bind(
            this
        );
        this.handlePyMolDownload = this.handlePyMolDownload.bind(this);
    }

    public selectionTitle(
        text: string,
        tooltip?: JSX.Element,
        placement: string = 'top'
    ) {
        let content: JSX.Element | null = null;

        if (tooltip) {
            content = this.defaultInfoTooltip(tooltip, placement);
        }

        return (
            <span>
                {text} {content}:
            </span>
        );
    }

    public defaultInfoTooltip(tooltip: JSX.Element, placement: string = 'top') {
        const tooltipCallback = () => tooltip;

        return (
            <DefaultTooltip
                placement={placement}
                overlay={tooltipCallback}
                arrowContent={<div className="rc-tooltip-arrow-inner" />}
                destroyTooltipOnHide={true}
            >
                <i className="fa fa-info-circle" />
            </DefaultTooltip>
        );
    }

    public proteinColorTooltipContent() {
        return (
            <div style={{ maxWidth: 400, maxHeight: 200, overflowY: 'auto' }}>
                Color options for the protein structure. <br />
                <br />
                <b>Uniform:</b> Colors the entire protein structure with a
                <span className={styles['loop']}> single color</span>. <br />
                <b>Secondary structure:</b> Colors the protein by secondary
                structure. Assigns different colors for{' '}
                <span className={styles['alpha-helix']}>alpha helices</span>,
                <span className={styles['beta-sheet']}> beta sheets</span>, and
                <span className={styles['loop']}> loops</span>. This color
                option is not available for the space-filling protein scheme.{' '}
                <br />
                <b>N-C rainbow:</b> Colors the protein with a rainbow gradient
                from red (N-terminus) to blue (C-terminus). <br />
                <b>Atom Type:</b> Colors the structure with respect to the atom
                type (CPK color scheme). This color option is only available for
                the space-filling protein scheme. <br />
                <br />
                The selected chain is always displayed with full opacity while
                the rest of the structure has some transparency to help better
                focusing on the selected chain.
            </div>
        );
    }

    public sideChainTooltipContent() {
        return (
            <div style={{ maxWidth: 400, maxHeight: 200, overflowY: 'auto' }}>
                Display options for the side chain atoms. <br />
                <br />
                <b>All:</b> Displays the side chain atoms for every mapped
                residue. <br />
                <b>Selected:</b> Displays the side chain atoms only for the
                selected mutations. <br />
                <b>None:</b> Hides the side chain atoms. <br />
                <br />
                This option has no effect for the space-filling protein scheme.
            </div>
        );
    }

    public mutationColorTooltipContent() {
        return (
            <div style={{ maxWidth: 400, maxHeight: 200, overflowY: 'auto' }}>
                Color options for the mapped mutations. <br />
                <br />
                <b>Uniform:</b> Colors all mutated residues with a
                <span className={styles['uniform-mutation']}>
                    {' '}
                    single color
                </span>
                . <br />
                <b>Mutation type:</b> Enables residue coloring by mutation type.
                Mutation types and corresponding color codes are as follows:
                <ul>
                    <li>
                        <span className={styles['missense-mutation']}>
                            Missense Mutations
                        </span>
                    </li>
                    <li>
                        <span className={styles['trunc-mutation']}>
                            Truncating Mutations
                        </span>
                        <span> (Nonsense, Nonstop, FS del, FS ins)</span>
                    </li>
                    <li>
                        <span className={styles['inframe-mutation']}>
                            Inframe Mutations
                        </span>
                        <span> (IF del, IF ins)</span>
                    </li>
                </ul>
                <b>None:</b> Disables coloring of the mutated residues except
                for manually selected (highlighted) residues. <br />
                <br />
                Highlighted residues are colored with{' '}
                <span className={styles['highlighted']}>yellow</span>.
            </div>
        );
    }

    public boundMoleculesTooltipContent() {
        return (
            <div style={{ maxWidth: 400, maxHeight: 200, overflowY: 'auto' }}>
                Displays co-crystalized molecules. This option has no effect if
                the current structure does not contain any co-crystalized bound
                molecules.
            </div>
        );
    }

    public helpTooltipContent() {
        return (
            <div style={{ maxWidth: 400, maxHeight: 200, overflowY: 'auto' }}>
                <b>Zoom in/out:</b> Press and hold the SHIFT key and the left
                mouse button, and then move the mouse backward/forward.
                <br />
                <b>Pan:</b> Press and hold the CTRL key, click and hold the left
                mouse button, and then move the mouse in the desired direction.
                <br />
                <b>Rotate:</b> Press and hold the left mouse button, and then
                move the mouse in the desired direction to rotate along the x
                and y axes.
                <br />
            </div>
        );
    }

    public proteinStyleMenu() {
        return (
            <span>
                <div className="row text-center">
                    <span>Protein Style</span>
                </div>
                <div className="row">
                    <div className="col col-sm-10 col-sm-offset-1">
                        <hr />
                    </div>
                </div>
                <div className="row">
                    <Checkbox
                        checked={this.displayBoundMolecules}
                        onChange={
                            this
                                .handleBoundMoleculeChange as React.FormEventHandler<
                                any
                            >
                        }
                    >
                        Display bound molecules{' '}
                        {this.defaultInfoTooltip(
                            this.boundMoleculesTooltipContent()
                        )}
                    </Checkbox>
                </div>
                <div className="row">
                    <div className="col col-sm-6">
                        <div className="row">
                            {this.selectionTitle('Scheme')}
                        </div>
                        <div className="row">
                            <FormControl
                                className={styles['default-option-select']}
                                componentClass="select"
                                value={`${this.proteinScheme}`}
                                onChange={
                                    this
                                        .handleProteinSchemeChange as React.FormEventHandler<
                                        any
                                    >
                                }
                            >
                                <option value={ProteinScheme.CARTOON}>
                                    cartoon
                                </option>
                                <option value={ProteinScheme.SPACE_FILLING}>
                                    space-filling
                                </option>
                                <option value={ProteinScheme.TRACE}>
                                    trace
                                </option>
                            </FormControl>
                        </div>
                    </div>
                    <div className="col col-sm-6">
                        <div className="row">
                            {this.selectionTitle(
                                'Color',
                                this.proteinColorTooltipContent()
                            )}
                        </div>
                        <div className="row">
                            <FormControl
                                className={styles['default-option-select']}
                                componentClass="select"
                                value={`${this.proteinColor}`}
                                onChange={
                                    this
                                        .handleProteinColorChange as React.FormEventHandler<
                                        any
                                    >
                                }
                            >
                                <option value={ProteinColor.UNIFORM}>
                                    uniform
                                </option>
                                <option
                                    value={ProteinColor.SECONDARY_STRUCTURE}
                                    disabled={
                                        this.colorBySecondaryStructureDisabled
                                    }
                                >
                                    secondary structure
                                </option>
                                <option
                                    value={ProteinColor.NC_RAINBOW}
                                    disabled={this.colorByNCRainbowDisabled}
                                >
                                    N-C rainbow
                                </option>
                                <option
                                    value={ProteinColor.ATOM_TYPE}
                                    disabled={this.colorByAtomTypeDisabled}
                                >
                                    atom type
                                </option>
                            </FormControl>
                        </div>
                    </div>
                </div>
            </span>
        );
    }

    public mutationStyleMenu() {
        return (
            <span>
                <div className="row text-center">
                    <span>Mutation Style</span>
                </div>
                <div className="row">
                    <div className="col col-sm-10 col-sm-offset-1">
                        <hr />
                    </div>
                </div>
                <div className="row">
                    <div className="col col-sm-6">
                        <div className="row">
                            {this.selectionTitle(
                                'Side Chain',
                                this.sideChainTooltipContent()
                            )}
                        </div>
                        <div className="row">
                            <FormControl
                                className={styles['default-option-select']}
                                componentClass="select"
                                value={`${this.sideChain}`}
                                onChange={
                                    this
                                        .handleSideChainChange as React.FormEventHandler<
                                        any
                                    >
                                }
                            >
                                <option value={SideChain.ALL}>all</option>
                                <option value={SideChain.SELECTED}>
                                    selected
                                </option>
                                <option value={SideChain.NONE}>none</option>
                            </FormControl>
                        </div>
                    </div>
                    <div className="col col-sm-6">
                        <div className="row">
                            {this.selectionTitle(
                                'Color',
                                this.mutationColorTooltipContent(),
                                'left'
                            )}
                        </div>
                        <div className="row">
                            <FormControl
                                className={styles['default-option-select']}
                                componentClass="select"
                                value={`${this.mutationColor}`}
                                onChange={
                                    this
                                        .handleMutationColorChange as React.FormEventHandler<
                                        any
                                    >
                                }
                            >
                                <option value={MutationColor.UNIFORM}>
                                    uniform
                                </option>
                                <option value={MutationColor.MUTATION_TYPE}>
                                    mutation type
                                </option>
                                <option value={MutationColor.NONE}>none</option>
                            </FormControl>
                        </div>
                    </div>
                </div>
            </span>
        );
    }

    public topToolbar() {
        return (
            <div className="row">
                <div className="col col-sm-6">
                    {getServerConfig().skin_hide_download_controls ===
                        DownloadControlOption.SHOW_ALL && (
                        <ButtonGroup>
                            <DefaultTooltip
                                overlay={<span>Download PyMol script</span>}
                                placement="top"
                            >
                                <Button
                                    className="btn-sm"
                                    onClick={this.handlePyMolDownload}
                                >
                                    <i className="fa fa-cloud-download" /> PyMol
                                </Button>
                            </DefaultTooltip>
                        </ButtonGroup>
                    )}
                </div>
                <div className="col col-sm-6">
                    <span className="pull-right">
                        how to pan/zoom/rotate?{' '}
                        {this.defaultInfoTooltip(
                            this.helpTooltipContent(),
                            'left'
                        )}
                    </span>
                </div>
            </div>
        );
    }

    public header() {
        return (
            <div className={classnames('row', styles['header'])}>
                <div className="col col-sm-10">
                    <span>3D Structure</span>
                </div>
                <div className="col col-sm-2">
                    <span className="pull-right">
                        <i
                            className={classnames('fa', {
                                'fa-compress': this.isIncreasedSize,
                                'fa-expand': !this.isIncreasedSize,
                            })}
                            onClick={this.toggleDoubleSize}
                            style={{ marginRight: 5, cursor: 'pointer' }}
                        />
                        <i
                            className="fa fa-minus-circle"
                            onClick={this.toggleCollapse}
                            style={{ marginRight: 5, cursor: 'pointer' }}
                        />
                        <i
                            className="fa fa-times-circle"
                            onClick={this.props.onClose}
                            style={{ cursor: 'pointer' }}
                        />
                    </span>
                </div>
            </div>
        );
    }

    public mainContent() {
        if (this.pdbId && this.chainId && this.residues) {
            // load pdb info & 3D visualizer
            return (
                <span>
                    <div className="row">
                        <PdbChainInfo
                            pdbId={this.pdbId}
                            chainId={this.chainId}
                            cache={this.props.pdbHeaderCache}
                            truncateText={true}
                        />
                    </div>
                    <If condition={this.residueWarning.length > 0}>
                        <div className="row">
                            <div className="col col-sm-12 text-center">
                                <span className="text-danger">
                                    {this.residueWarning}
                                </span>
                            </div>
                        </div>
                    </If>
                    <div
                        className="row"
                        style={{ paddingTop: 5, paddingBottom: 5 }}
                    >
                        <StructureViewer
                            displayBoundMolecules={this.displayBoundMolecules}
                            proteinScheme={this.proteinScheme}
                            proteinColor={this.proteinColor}
                            sideChain={this.sideChain}
                            mutationColor={this.mutationColor}
                            pdbId={this.pdbId}
                            chainId={this.chainId}
                            residues={this.residues}
                            bounds={this.structureViewerBounds}
                            containerRef={this.containerRefHandler}
                        />
                    </div>
                </span>
            );
        } else {
            // show loader
            return (
                <div style={{ textAlign: 'center' }}>
                    <ThreeBounce
                        size={25}
                        style={{
                            display: 'inline-block',
                            padding: 25,
                        }}
                    />
                </div>
            );
        }
    }

    public render() {
        return (
            <Draggable handle=".structure-viewer-header">
                <div
                    className={classnames(styles['main-3d-panel'], {
                        [styles['increased-size-panel']]: this.isIncreasedSize,
                    })}
                >
                    <div className="structure-viewer-header row">
                        {this.header()}
                        <hr style={{ borderTopColor: '#BBBBBB' }} />
                    </div>
                    <div
                        className={classnames(styles['body'], {
                            [styles['collapsed-panel']]: this.isCollapsed,
                        })}
                    >
                        {this.mainContent()}
                        <div className="row">
                            {this.topToolbar()}
                            <hr />
                        </div>
                        <div className="row">
                            <div className="col col-sm-6">
                                {this.proteinStyleMenu()}
                            </div>
                            <div className="col col-sm-6">
                                {this.mutationStyleMenu()}
                            </div>
                        </div>
                    </div>
                </div>
            </Draggable>
        );
    }

    private containerRefHandler(div: HTMLDivElement) {
        this._3dMolDiv = div;
    }

    private toggleCollapse() {
        this.isCollapsed = !this.isCollapsed;
    }

    private toggleDoubleSize() {
        this.isIncreasedSize = !this.isIncreasedSize;
    }

    private handleProteinSchemeChange(evt: React.FormEvent<HTMLSelectElement>) {
        this.proteinScheme = parseInt(
            (evt.target as HTMLSelectElement).value,
            10
        );

        // when the protein scheme is SPACE_FILLING, NC_RAINBOW and SECONDARY_STRUCTURE are not allowed
        if (
            this.proteinScheme === ProteinScheme.SPACE_FILLING &&
            (this.proteinColor === ProteinColor.NC_RAINBOW ||
                this.proteinColor === ProteinColor.SECONDARY_STRUCTURE)
        ) {
            this.proteinColor = ProteinColor.UNIFORM;
        }
        // when the protein scheme is CARTOON or TRACE, ATOM_TYPE is not allowed
        else if (
            (this.proteinScheme === ProteinScheme.TRACE ||
                this.proteinScheme === ProteinScheme.CARTOON) &&
            this.proteinColor === ProteinColor.ATOM_TYPE
        ) {
            this.proteinColor = ProteinColor.UNIFORM;
        }
    }

    private handleProteinColorChange(evt: React.FormEvent<HTMLSelectElement>) {
        this.proteinColor = parseInt(
            (evt.target as HTMLSelectElement).value,
            10
        );
    }

    private handleSideChainChange(evt: React.FormEvent<HTMLSelectElement>) {
        this.sideChain = parseInt((evt.target as HTMLSelectElement).value, 10);
    }

    private handleMutationColorChange(evt: React.FormEvent<HTMLSelectElement>) {
        this.mutationColor = parseInt(
            (evt.target as HTMLSelectElement).value,
            10
        );
    }

    private handleBoundMoleculeChange() {
        this.displayBoundMolecules = !this.displayBoundMolecules;
    }

    private handlePyMolDownload() {
        if (this.pdbId && this.chainId) {
            const filename = `${this.pdbId}_${this.chainId}.pml`;
            fileDownload(this.pyMolScript, filename);
        }
    }

    @computed get structureViewerBounds(): {
        width: number | string;
        height: number | string;
    } {
        let width: number | string;
        let height: number | string;

        // if 3Dmol container div is not initialized yet, just set to a default value: width=auto; height=350
        // otherwise toggle the size
        if (this.isIncreasedSize) {
            // TODO: hardocded default value to fix cBioPortal/cbioportal#4561
            width = this._3dMolDiv
                ? Math.floor(this._3dMolDiv.offsetWidth * (5 / 3))
                : 698;
            height = this._3dMolDiv ? this._3dMolDiv.offsetHeight * 2 : 350;
        } else {
            // TODO: hardcoded default value to fix cBioPortal/cbioportal#4561
            width = this._3dMolDiv
                ? Math.floor(this._3dMolDiv.offsetWidth / (5 / 3))
                : 450;
            height = this._3dMolDiv ? this._3dMolDiv.offsetHeight / 2 : 350;
        }

        return { width, height };
    }

    @computed get pdbId() {
        if (this.pdbChain) {
            return this.pdbChain.pdbId;
        } else {
            return undefined;
        }
    }

    @computed get chainId() {
        if (this.pdbChain) {
            return this.pdbChain.chain;
        } else {
            return undefined;
        }
    }

    @computed get pdbChain() {
        let data = this.props.pdbChainDataStore.sortedFilteredSelectedData;

        if (data.length === 0) {
            // if no selected data, then try allData,
            // first element of allData is always the first element of initially sorted data
            data = this.props.pdbChainDataStore.allData;
        }

        if (data.length === 0) {
            return undefined;
        } else {
            return data[0];
        }
    }

    @computed get residueWarning(): string {
        let warning = '';

        // None of the mutations (selected or not) can be mapped onto the current PDB chain.
        if (
            this.proteinPositions.length === 0 ||
            (this.residueMappingData &&
                this.residueMappingData.filter(
                    cacheData => cacheData === null || cacheData.data !== null
                ).length === 0)
        ) {
            warning = 'None of the mutations can be mapped onto this structure';
        } else {
            // find the difference between number of selected position and
            // the number of mapped positions among the selected ones.
            // if the difference is not zero, then it means there is at least one unmapped position
            // among the selected positions.
            const selectedPositionCount = _.keys(
                this.selectedMutationsByPosition
            ).length;
            const diff =
                selectedPositionCount - this.mappedSelectedPositions.length;

            // there is only one position selected, and it cannot be mapped
            if (selectedPositionCount === 1 && diff === 1) {
                warning =
                    'Selected mutation cannot be mapped onto this structure';
            }
            // more than one position selected, at least one of them cannot be mapped
            else if (diff > 0) {
                warning = `${diff} of the selections cannot be mapped onto this structure`;
            }
        }

        return warning;
    }

    @computed get residues(): IResidueSpec[] | undefined {
        if (!this.residueMappingData) {
            return undefined;
        }

        const residues: IResidueSpec[] = [];

        this.residueMappingData.forEach(cacheData => {
            if (cacheData && cacheData.data) {
                const mutations = this.mutationsByPosition[
                    cacheData.data.queryPosition
                ];

                const highlighted: boolean =
                    (this.props.mutationDataStore &&
                        (this.props.mutationDataStore.isPositionSelected(
                            cacheData.data.queryPosition
                        ) ||
                            this.props.mutationDataStore.isPositionHighlighted(
                                cacheData.data.queryPosition
                            ))) ||
                    false;

                if (mutations && mutations.length > 0) {
                    residues.push({
                        positionRange: {
                            start: {
                                position: cacheData.data.pdbPosition,
                            },
                            end: {
                                position: cacheData.data.pdbPosition,
                            },
                        },
                        color: getColorForProteinImpactType(
                            mutations,
                            this.props
                        ),
                        highlighted,
                    });
                }
            }
        });

        return _.uniq(residues);
    }

    @computed get residueMappingData():
        | Array<CacheData<ResidueMapping> | null>
        | undefined {
        if (this.alignmentIds.length === 0) {
            return undefined;
        }

        let residueMappingData: Array<CacheData<ResidueMapping> | null> = [];

        if (
            this.props.residueMappingCache &&
            this.props.uniprotId &&
            this.pdbId &&
            this.chainId &&
            this.proteinPositions.length > 0
        ) {
            // TODO remove this after implementing the cache!
            // create query parameters
            // this.proteinPositions.forEach((uniprotPosition: number) => {
            //     this.alignmentIds.forEach((alignmentId: number) => {
            //         if (this.props.pdbPositionMappingCache) {
            //             residueMappingData.push(this.props.pdbPositionMappingCache.get({
            //                 uniprotPosition,
            //                 alignmentId
            //             }));
            //         }
            //     });
            // });

            // TODO this query may slightly change wrt to the cache implementation
            const remoteData = this.props.residueMappingCache.get({
                uniprotId: this.props.uniprotId,
                pdbId: this.pdbId,
                chainId: this.chainId,
                uniprotPositions: this.proteinPositions,
            });

            if (remoteData.result) {
                residueMappingData = remoteData.result;
            }
        }

        return residueMappingData;
    }

    @computed get mappedSelectedPositions(): number[] {
        if (!this.residueMappingData) {
            return [];
        }

        const positions: number[] = [];

        this.residueMappingData.forEach(cacheData => {
            if (
                cacheData &&
                cacheData.data &&
                this.props.mutationDataStore &&
                this.props.mutationDataStore.isPositionSelected(
                    cacheData.data.queryPosition
                )
            ) {
                positions.push(cacheData.data.queryPosition);
            }
        });

        return _.uniq(positions);
    }

    @computed get alignmentIds(): number[] {
        let alignmentIds: number[] = [];

        if (this.pdbChain && this.props.pdbAlignmentIndex) {
            const alignments = this.props.pdbAlignmentIndex[
                this.pdbChain.pdbId
            ][this.pdbChain.chain];
            alignmentIds =
                alignments === undefined
                    ? []
                    : this.props.pdbAlignmentIndex[this.pdbChain.pdbId][
                          this.pdbChain.chain
                      ].map(alignment => alignment.alignmentId);
        }

        return _.uniq(alignmentIds);
    }

    @computed get mutationsByPosition(): { [pos: number]: Mutation[] } {
        if (this.props.mutationDataStore) {
            return groupMutationsByProteinStartPos(
                this.props.mutationDataStore.sortedFilteredData
            );
        } else {
            return {};
        }
    }

    @computed get selectedMutationsByPosition(): { [pos: number]: Mutation[] } {
        if (this.props.mutationDataStore) {
            return groupMutationsByProteinStartPos(
                this.props.mutationDataStore.sortedFilteredSelectedData
            );
        } else {
            return {};
        }
    }

    /**
     * Protein start positions for the mutations falling between the current chain's
     * start and end. This value is computed for the filtered mutations only.
     */
    @computed get proteinPositions(): number[] {
        let positions: number[] = [];

        if (this.props.mutationDataStore && this.pdbChain) {
            positions = getProteinStartPositionsByRange(
                this.props.mutationDataStore.sortedFilteredData,
                this.pdbChain.uniprotStart,
                this.pdbChain.uniprotEnd
            );
        }

        return positions;
    }

    @computed get pyMolScript() {
        const scriptGenerator = new PyMolScriptGenerator();

        const visualizerProps = {
            displayBoundMolecules: this.displayBoundMolecules,
            proteinScheme: this.proteinScheme,
            proteinColor: this.proteinColor,
            sideChain: this.sideChain,
            mutationColor: this.mutationColor,
        };

        if (this.pdbId && this.chainId) {
            return scriptGenerator.generateScript(
                this.pdbId,
                this.chainId,
                this.residues || [],
                visualizerProps
            );
        } else {
            return '';
        }
    }

    @computed get colorBySecondaryStructureDisabled() {
        return this.proteinScheme === ProteinScheme.SPACE_FILLING;
    }

    @computed get colorByNCRainbowDisabled() {
        return this.proteinScheme === ProteinScheme.SPACE_FILLING;
    }

    @computed get colorByAtomTypeDisabled() {
        return this.proteinScheme !== ProteinScheme.SPACE_FILLING;
    }
}
