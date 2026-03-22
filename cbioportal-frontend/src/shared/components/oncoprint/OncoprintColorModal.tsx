import { action, makeObservable, observable } from 'mobx';
import { observer } from 'mobx-react';
import * as React from 'react';
import { ClinicalTrackSpec } from './Oncoprint';
import {
    getClinicalTrackColor,
    getClinicalTrackValues,
} from './ResultsViewOncoprint';
import { Modal } from 'react-bootstrap';
import ClinicalTrackColorPicker from './ClinicalTrackColorPicker';
import { RGBAColor } from 'oncoprintjs';
import classnames from 'classnames';
import _ from 'lodash';
import { rgbaToHex } from 'shared/lib/Colors';

interface IOncoprintColorModalProps {
    setTrackKeySelectedForEdit: (key: string | null) => void;
    selectedClinicalTrack: ClinicalTrackSpec;
    handleSelectedClinicalTrackColorChange: (
        value: string,
        color: RGBAColor | undefined
    ) => void;
    getSelectedClinicalTrackDefaultColorForValue: (value: string) => number[];
}

export const OncoprintColorModal: React.FC<IOncoprintColorModalProps> = observer(
    ({
        setTrackKeySelectedForEdit,
        selectedClinicalTrack,
        handleSelectedClinicalTrackColorChange,
        getSelectedClinicalTrackDefaultColorForValue,
    }: IOncoprintColorModalProps) => {
        const clinicalTrackValues = getClinicalTrackValues(
            selectedClinicalTrack
        );

        return (
            <Modal show={true} onHide={() => setTrackKeySelectedForEdit(null)}>
                <Modal.Header closeButton>
                    <Modal.Title>
                        Color Configuration: {selectedClinicalTrack.label}
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <table className="table table-striped">
                        <thead>
                            <tr>
                                <th>Value</th>
                                <th>Color</th>
                            </tr>
                        </thead>
                        <tbody>
                            {clinicalTrackValues.map(value => (
                                <tr>
                                    <td>{value}</td>
                                    <td>
                                        <ClinicalTrackColorPicker
                                            handleClinicalTrackColorChange={
                                                handleSelectedClinicalTrackColorChange
                                            }
                                            clinicalTrackValue={value}
                                            color={getClinicalTrackColor(
                                                selectedClinicalTrack,
                                                value as string
                                            )}
                                        />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <button
                        className={classnames('btn', 'btn-default', 'btn-sm', {
                            hidden: _.every(
                                clinicalTrackValues,
                                v =>
                                    rgbaToHex(
                                        getClinicalTrackColor(
                                            selectedClinicalTrack,
                                            v as string
                                        )
                                    ) ===
                                    rgbaToHex(
                                        getSelectedClinicalTrackDefaultColorForValue(
                                            v
                                        ) as RGBAColor
                                    )
                            ),
                        })}
                        data-test="resetColors"
                        style={{ marginTop: 5 }}
                        onClick={() => {
                            clinicalTrackValues.forEach(v => {
                                handleSelectedClinicalTrackColorChange(
                                    v,
                                    undefined
                                );
                            });
                        }}
                    >
                        Reset Colors
                    </button>
                </Modal.Body>
            </Modal>
        );
    }
);
