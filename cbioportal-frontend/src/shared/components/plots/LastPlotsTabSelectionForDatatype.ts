import {
    AxisMenuSelection,
    PlotsTabGeneOption,
    PlotsTabOption,
} from './PlotsTab';
import autobind from 'autobind-decorator';

type Selection = {
    gene?: PlotsTabGeneOption | undefined;
    geneSet?: PlotsTabOption | undefined;
    source?: PlotsTabOption | undefined;
    genericAssay?: PlotsTabOption | undefined;
};

type FieldUpdater = (option: any) => void;

export default class LastPlotsTabSelectionForDatatype {
    private horizontal: Map<string, Selection> = new Map();
    private vertical: Map<string, Selection> = new Map();

    @autobind
    public updateHorizontalFromSelection(
        newSelection: AxisMenuSelection
    ): void {
        this.updateAxisWithSelection(this.horizontal, newSelection);
    }

    @autobind
    public updateVerticalFromSelection(newSelection: AxisMenuSelection): void {
        this.updateAxisWithSelection(this.vertical, newSelection);
    }

    private updateAxisWithSelection(
        axis: Map<string, Selection>,
        newSelection: AxisMenuSelection
    ): void {
        if (newSelection.dataType !== undefined) {
            let selectionToUpdate = axis.get(newSelection.dataType);

            if (selectionToUpdate === undefined) {
                selectionToUpdate = {};
            }

            axis.set(
                newSelection.dataType,
                LastPlotsTabSelectionForDatatype.updateSelection(
                    selectionToUpdate,
                    newSelection
                )
            );
        }
    }

    private static updateSelection(
        selectionToUpdate: Selection,
        newSelection: AxisMenuSelection
    ): Selection {
        selectionToUpdate.gene = newSelection.selectedGeneOption;
        selectionToUpdate.geneSet = newSelection.selectedGenesetOption;
        selectionToUpdate.source = newSelection.selectedDataSourceOption;
        selectionToUpdate.genericAssay =
            newSelection.selectedGenericAssayOption;
        return selectionToUpdate;
    }

    /**
     * Finds the old selections made for dataType type on the
     * horizontal axis. For each selection, it runs the
     * corresponding updater. Unused and unchanged selections
     * are not updated.
     */
    @autobind
    public runHorizontalUpdaters(
        type: string,
        gene: FieldUpdater,
        geneSet: FieldUpdater,
        source: FieldUpdater,
        genericAssay: FieldUpdater
    ): void {
        LastPlotsTabSelectionForDatatype.runSelectionUpdaters(
            this.horizontal,
            type,
            gene,
            geneSet,
            source,
            genericAssay
        );
    }

    /**
     * Finds the old selections made for dataType type on the
     * vertical axis. For each selection, it runs the
     * corresponding updater. Unused and unchanged selections
     * are not updated.
     */
    @autobind
    public runVerticalUpdaters(
        type: string,
        gene: FieldUpdater,
        geneSet: FieldUpdater,
        source: FieldUpdater,
        genericAssay: FieldUpdater
    ): void {
        LastPlotsTabSelectionForDatatype.runSelectionUpdaters(
            this.vertical,
            type,
            gene,
            geneSet,
            source,
            genericAssay
        );
    }

    private static runSelectionUpdaters(
        axis: Map<string, Selection>,
        type: string,
        gene: FieldUpdater,
        geneSet: FieldUpdater,
        source: FieldUpdater,
        genericAssay: FieldUpdater
    ) {
        if (!axis.get(type)) {
            return;
        }

        const infoUpdaterPairs = [
            { saved: axis.get(type)!.gene, updater: gene },
            { saved: axis.get(type)!.geneSet, updater: geneSet },
            { saved: axis.get(type)!.source, updater: source },
            { saved: axis.get(type)!.genericAssay, updater: genericAssay },
        ];

        infoUpdaterPairs
            .filter(tuple => tuple.saved !== undefined)
            .forEach(tuple => tuple.updater(tuple.saved));
    }
}
