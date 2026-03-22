import * as React from 'react';
import _ from 'lodash';
import { observer } from 'mobx-react';
import { IStructureVisualizerProps, IResidueSpec } from './StructureVisualizer';
import StructureVisualizer3D from './StructureVisualizer3D';

export interface IStructureViewerProps extends IStructureVisualizerProps {
    pdbId: string;
    chainId: string;
    bounds: { width: number | string; height: number | string };
    residues?: IResidueSpec[];
    containerRef?: (div: HTMLDivElement) => void;
}

@observer
export default class StructureViewer extends React.Component<
    IStructureViewerProps,
    {}
> {
    private _3dMolDiv: HTMLDivElement | undefined;
    private _pdbId: string;
    private wrapper: StructureVisualizer3D;

    public constructor(props: IStructureViewerProps) {
        super(props);

        this.divHandler = this.divHandler.bind(this);
    }

    public render() {
        return (
            <div
                ref={this.divHandler}
                style={{
                    height: this.props.bounds.height,
                    width: this.props.bounds.width,
                    padding: 0,
                }}
                className="borderedChart"
            />
        );
    }

    public componentDidMount() {
        if (this._3dMolDiv) {
            this.wrapper = new StructureVisualizer3D(
                this._3dMolDiv,
                this.props
            );
            this.wrapper.init(
                this.props.pdbId,
                this.props.chainId,
                this.props.residues
            );
            this._pdbId = this.props.pdbId;
        }
    }

    public componentDidUpdate(prevProps: IStructureViewerProps) {
        if (this.wrapper) {
            // if pdbId is updated we need to reload the structure
            if (this.props.pdbId !== this._pdbId) {
                this._pdbId = this.props.pdbId;
                this.wrapper.loadPdb(
                    this._pdbId,
                    this.props.chainId,
                    this.props.residues,
                    this.props
                );
            }
            // other updates just require selection/style updates without reloading the structure
            else {
                this.wrapper.updateViewer(
                    this.props.chainId,
                    this.props.residues,
                    this.props
                );
            }

            if (!_.isEqual(this.props.bounds, prevProps.bounds)) {
                this.wrapper.resize();
            }
        }
    }

    private divHandler(div: HTMLDivElement) {
        this._3dMolDiv = div;

        if (this.props.containerRef) {
            this.props.containerRef(div);
        }
    }
}
