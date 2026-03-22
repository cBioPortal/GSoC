import _ from 'lodash';
import { ClinicalTrackDatum } from 'shared/components/oncoprint/Oncoprint';
import { makeUniqueColorGetter } from 'shared/components/plots/PlotUtils';
import { RESERVED_CLINICAL_VALUE_COLORS } from 'shared/lib/Colors';

export function getDataForSubmission(
    fileInput: HTMLInputElement | null,
    stringInput: string
) {
    return new Promise<string>(resolve => {
        if (fileInput && fileInput.files && fileInput.files.length > 0) {
            // get data from file upload
            const fileReader = new FileReader();
            fileReader.onload = () => {
                const data = fileReader.result as string | null;
                if (data) {
                    resolve(data);
                } else {
                    resolve('');
                }
            };
            fileReader.readAsText(fileInput.files[0]);
        } else {
            // get data from text input
            resolve(stringInput);
        }
    });
}

export function getDefaultClinicalAttributeColoringForStringDatatype(
    data: ClinicalTrackDatum[]
) {
    const colorGetter = makeUniqueColorGetter(
        _.values(RESERVED_CLINICAL_VALUE_COLORS)
    );
    let categoryToColor: { [value: string]: string } = {};
    for (const d of data) {
        if (
            (d.attr_val as string) !== '' &&
            !((d.attr_val as string) in categoryToColor)
        ) {
            categoryToColor[d.attr_val as string] = colorGetter();
        }
    }
    categoryToColor = Object.assign(
        categoryToColor,
        RESERVED_CLINICAL_VALUE_COLORS
    );
    return categoryToColor;
}
