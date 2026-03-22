import { getPatientViewUrl, getSampleViewUrl } from '../../api/urls';
import $ from 'jquery';
import { GenePanel, MolecularProfile } from 'cbioportal-ts-api-client';

import client from 'shared/api/cbioportalClientInstance';
import {
    ClinicalTrackSpec,
    IBaseHeatmapTrackSpec,
    ICategoricalTrackSpec,
    IHeatmapTrackSpec,
} from './Oncoprint';
import { AlterationTypeConstants } from 'shared/constants';
import _ from 'lodash';

export const TOOLTIP_DIV_CLASS = 'oncoprint__tooltip';

const tooltipTextElementNaN = 'N/A';
import './styles.scss';

import { deriveDisplayTextFromGenericAssayType } from 'shared/lib/GenericAssayUtils/GenericAssayCommonUtils';
import { AlterationTypeText } from 'shared/constants';

function sampleViewAnchorTag(study_id: string, sample_id: string) {
    return `<a class="nobreak" href="${getSampleViewUrl(
        study_id,
        sample_id
    )}" target="_blank">${sample_id}</a>`;
}
function patientViewAnchorTag(study_id: string, patient_id: string) {
    return `<a class="nobreak" href="${getPatientViewUrl(
        study_id,
        patient_id
    )}" target="_blank">${patient_id}</a>`;
}

export function makeGenePanelPopupLink(
    gene_panel_id: string,
    profiled: boolean,
    numSamples?: number
) {
    let anchor = $(
        `<span class="nobreak">
            <a href="#" oncontextmenu="return false;">${gene_panel_id}</a>
            ${!profiled ? '(gene not on panel)' : ''}
            ${numSamples ? ` (${numSamples})` : ''}
         </span>`
    );
    anchor.ready(() => {
        anchor.click(function() {
            client
                .getGenePanelUsingGET({ genePanelId: gene_panel_id })
                .then((panel: GenePanel) => {
                    const genes = panel.genes
                        .map(function(g) {
                            return g.hugoGeneSymbol;
                        })
                        .sort();
                    const popup = open('', '_blank', 'width=500,height=500');
                    if (popup) {
                        const div = popup.document.createElement('div');
                        popup.document.body.appendChild(div);

                        $(
                            `<h3 style="text-align:center;">${gene_panel_id}</h3><br>`
                        ).appendTo(div);
                        $(`<span>${genes.join('<br>')}</span>`).appendTo(div);
                    }
                });
        });
    });
    return anchor;
}

export function linebreakGenesetId(genesetId: string): string {
    return (
        // encode the string as the textual contents of an HTML element
        $('<div>')
            .text(genesetId)
            .html()
            // Include zero-width spaces to allow line breaks after punctuation in
            // (typically long) gs names
            .replace(/_/g, '_&#8203;')
            .replace(/\./g, '.&#8203;')
    );
}

export function makeCategoricalTrackTooltip(
    track: ICategoricalTrackSpec,
    link_id?: boolean
) {
    return function(dataUnderMouse: any[]) {
        let ret = '';
        let attr_val_counts: { [attr_val: string]: number } = {};
        for (const d of dataUnderMouse) {
            if (d.attr_val_counts) {
                for (const key of Object.keys(d.attr_val_counts)) {
                    attr_val_counts[key] = attr_val_counts[key] || 0;
                    attr_val_counts[key] += d.attr_val_counts[key];
                }
            }
        }
        const attr_vals = Object.keys(attr_val_counts);
        if (attr_vals.length > 1) {
            ret += track.label + ':<br>';
            for (let i = 0; i < attr_vals.length; i++) {
                const val = attr_vals[i];
                ret +=
                    '<span class="nobreak"><b>' +
                    val +
                    '</b>: ' +
                    attr_val_counts[val] +
                    ` sample${
                        attr_val_counts[val] === 1 ? '' : 's'
                    }</span><br>`;
            }
        } else if (attr_vals.length === 1) {
            let displayVal = attr_vals[0];
            ret +=
                track.label +
                ': <span class="nobreak"><b>' +
                displayVal +
                `</b>${
                    dataUnderMouse.length > 1
                        ? ` (${attr_val_counts[attr_vals[0]]} samples)`
                        : ''
                }</span><br>`;
        }
        let naCount = 0;
        for (const d of dataUnderMouse) {
            if (d.na) {
                naCount += 1;
            }
        }
        if (naCount > 0) {
            ret += `${track.label}: <b>N/A</b>${
                dataUnderMouse.length > 1 ? ` (${naCount} samples)` : ''
            }<br/>`;
        }
        return $('<div>')
            .addClass(TOOLTIP_DIV_CLASS)
            .append(getCaseViewElt(dataUnderMouse, !!link_id))
            .append('<br/>')
            .append(ret);
    };
}

export function makeClinicalTrackTooltip(
    track: ClinicalTrackSpec,
    link_id?: boolean
) {
    return function(dataUnderMouse: any[]) {
        let ret = '';
        if (track.datatype === 'counts') {
            const d = dataUnderMouse[0];
            for (let i = 0; i < track.countsCategoryLabels.length; i++) {
                ret +=
                    '<span class="nobreak" style="color:' +
                    track.countsCategoryFills[i] +
                    ';font-weight:bold;">' +
                    track.countsCategoryLabels[i] +
                    '</span>: ' +
                    d.attr_val_counts[track.countsCategoryLabels[i]] +
                    '<br>';
            }
        } else {
            let attr_val_counts: { [attr_val: string]: number } = {};
            for (const d of dataUnderMouse) {
                if (d.attr_val_counts) {
                    for (const key of Object.keys(d.attr_val_counts)) {
                        attr_val_counts[key] = attr_val_counts[key] || 0;
                        attr_val_counts[key] += d.attr_val_counts[key];
                    }
                }
            }
            const attr_vals = Object.keys(attr_val_counts);
            if (track.datatype === 'number') {
                // average
                let sum = 0;
                let count = 0;
                for (const attr_val of attr_vals) {
                    const numSamplesWithVal = attr_val_counts[attr_val];
                    sum += numSamplesWithVal * parseFloat(attr_val);
                    count += numSamplesWithVal;
                }
                let displayVal = (sum / count).toFixed(2);
                if (displayVal.substring(displayVal.length - 3) === '.00') {
                    displayVal = displayVal.substring(0, displayVal.length - 3);
                }
                ret +=
                    track.label +
                    ': <span class="nobreak"><b>' +
                    displayVal +
                    `${
                        count > 1 ? ` (average of ${count} values)` : ''
                    }</b></span><br>`;
            } else {
                if (attr_vals.length > 1) {
                    ret += track.label + ':<br>';
                    for (let i = 0; i < attr_vals.length; i++) {
                        const val = attr_vals[i];
                        ret +=
                            '<span class="nobreak"><b>' +
                            val +
                            '</b>: ' +
                            attr_val_counts[val] +
                            ` sample${
                                attr_val_counts[val] === 1 ? '' : 's'
                            }</span><br>`;
                    }
                } else if (attr_vals.length === 1) {
                    let displayVal = attr_vals[0];
                    ret +=
                        track.label +
                        ': <span class="nobreak"><b>' +
                        displayVal +
                        `</b>${
                            dataUnderMouse.length > 1
                                ? ` (${attr_val_counts[attr_vals[0]]} samples)`
                                : ''
                        }</span><br>`;
                }
            }
        }
        let naCount = 0;
        for (const d of dataUnderMouse) {
            if (d.na) {
                naCount += 1;
            }
        }
        if (naCount > 0 && track.na_tooltip_value) {
            ret += `${track.label}: <b>${track.na_tooltip_value}</b>${
                dataUnderMouse.length > 1 ? ` (${naCount} samples)` : ''
            }<br/>`;
        }
        return $('<div>')
            .addClass(TOOLTIP_DIV_CLASS)
            .append(getCaseViewElt(dataUnderMouse, !!link_id))
            .append('<br/>')
            .append(ret);
    };
}
export function makeHeatmapTrackTooltip(
    trackSpec: Pick<
        IBaseHeatmapTrackSpec,
        'tooltipValueLabel' | 'molecularAlterationType'
    >,
    link_id?: boolean
) {
    return function(dataUnderMouse: any[]) {
        let data_header = '';
        let valueTextElement = tooltipTextElementNaN;
        let categoryTextElement = '';

        if (trackSpec.tooltipValueLabel) {
            data_header = `${trackSpec.tooltipValueLabel}: `;
        } else {
            switch (trackSpec.molecularAlterationType) {
                case AlterationTypeConstants.MRNA_EXPRESSION:
                    data_header = 'MRNA: ';
                    break;
                case AlterationTypeConstants.PROTEIN_LEVEL:
                    data_header = 'PROT: ';
                    break;
                case AlterationTypeConstants.METHYLATION:
                    data_header = 'METHYLATION: ';
                    break;
                case AlterationTypeConstants.GENERIC_ASSAY:
                    // track for GENERIC_ASSAY type always has the genericAssayType
                    data_header = `${deriveDisplayTextFromGenericAssayType(
                        (trackSpec as IHeatmapTrackSpec).genericAssayType!
                    )}: `;
                    break;
                case AlterationTypeConstants.MUTATION_EXTENDED:
                    data_header = 'VAF: ';
                    break;
                default:
                    data_header = 'Value: ';
                    break;
            }
        }

        let profileDataSum = 0;
        const profileCategories: string[] = [];
        let profileDataCount = 0;
        let categoryCount = 0;
        for (const d of dataUnderMouse) {
            if (
                d.profile_data !== null &&
                typeof d.profile_data !== 'undefined'
            ) {
                if (
                    trackSpec.molecularAlterationType ===
                        AlterationTypeConstants.GENERIC_ASSAY &&
                    d.category
                ) {
                    profileCategories.push(d.category);
                    categoryCount += 1;
                } else {
                    profileDataSum += d.profile_data;
                    profileDataCount += 1;
                }
            }
        }

        if (profileDataCount > 0) {
            const profileDisplayValue = (
                profileDataSum / profileDataCount
            ).toFixed(2);
            if (profileDataCount === 1) {
                valueTextElement = profileDisplayValue;
            } else {
                valueTextElement = `${profileDisplayValue} (average of ${profileDataCount} values)`;
            }
        }

        if (categoryCount > 0) {
            if (profileDataCount === 0 && categoryCount === 1) {
                categoryTextElement = profileCategories[0];
            } else if (profileDataCount > 0 && categoryCount === 1) {
                categoryTextElement = `${profileCategories[0]}`;
            } else {
                categoryTextElement = `${_.uniq(profileCategories).join(
                    ', '
                )} (${categoryCount} data points)`;
            }
        }

        let ret = data_header;
        if (valueTextElement !== tooltipTextElementNaN || categoryCount === 0) {
            ret += '<b>' + valueTextElement + '</b>';
        }
        if (valueTextElement !== tooltipTextElementNaN && categoryCount > 0) {
            ret += ' and ';
        }
        if (categoryCount > 0) {
            ret += '<b>' + categoryTextElement + '</b>';
        }
        ret += '<br />';
        return $('<div>')
            .addClass(TOOLTIP_DIV_CLASS)
            .append(getCaseViewElt(dataUnderMouse, !!link_id))
            .append('<br/>')
            .append(ret);
    };
}

export function makeGeneticTrackTooltip_getCoverageInformation(
    profiled_in:
        | { genePanelId?: string; molecularProfileId: string }[]
        | undefined,
    not_profiled_in:
        | { genePanelId?: string; molecularProfileId: string }[]
        | undefined,
    alterationTypesInQuery?: string[],
    molecularProfileIdToMolecularProfile?: {
        [molecularProfileId: string]: MolecularProfile;
    }
): {
    dispProfiledGenePanelIds: string[];
    dispNotProfiledGenePanelIds: string[];
    dispProfiledIn: string[] | undefined;
    dispNotProfiledIn: string[] | undefined;
    dispAllProfiled: boolean;
    dispNotProfiled: boolean;
} {
    let dispProfiledGenePanelIds: string[] = [];
    let dispProfiledGenePanelIdsMap: { [genePanelId: string]: string } = {};
    let dispProfiledIn: string[] | undefined = undefined;
    let dispProfiledInMap: { [molecularProfileId: string]: string } = {};
    let dispNotProfiledIn: string[] | undefined = undefined;
    let dispNotProfiledGenePanelIds: string[] = [];
    let profiledInTypes: { [type: string]: string } | undefined = undefined;
    if (profiled_in) {
        dispProfiledGenePanelIds = _.uniq(
            (profiled_in.map(x => x.genePanelId) as (
                | string
                | undefined
            )[]).filter(x => !!x) as string[]
        );
        dispProfiledIn = _.uniq(profiled_in.map(x => x.molecularProfileId));
        if (molecularProfileIdToMolecularProfile) {
            profiledInTypes = _.keyBy(
                dispProfiledIn,
                molecularProfileId =>
                    molecularProfileIdToMolecularProfile[molecularProfileId]
                        .molecularAlterationType
            );
        }
        dispProfiledInMap = _.keyBy(dispProfiledIn);
        dispProfiledGenePanelIdsMap = _.keyBy(dispProfiledGenePanelIds);
    }
    if (not_profiled_in) {
        dispNotProfiledIn = _.uniq(
            not_profiled_in.map(x => x.molecularProfileId)
        ).filter(x => !dispProfiledInMap[x]); // filter out profiles in profiled_in to avoid confusing tooltip (this occurs e.g. w multiple samples, one profiled one not)
        if (
            profiledInTypes &&
            alterationTypesInQuery &&
            molecularProfileIdToMolecularProfile
        ) {
            let notProfiledInTypes = _.keyBy(
                dispNotProfiledIn,
                molecularProfileId =>
                    molecularProfileIdToMolecularProfile[molecularProfileId]
                        .molecularAlterationType
            );
            // add an entry to 'not profiled in' for each alteration type in the query iff the sample is not profiled in a profile of that type, and that type is not already accounted for.
            // This is for the case of multiple study query - eg one study has CNA profile, the other doesnt, and we want to show in a tooltip from the other study that
            //      the sample is not profiled for CNA. If the study actually has a CNA profile, then we wont show "not profiled for copy number alterations" because
            //      that will be filtered out below because its in profiledInTypes or notProfiledInTypes. Otherwise, CNA will be in alterationTypesInQuery,
            //      and it wont be covered in profiledInTypes or notProfiledInTypes, so it will make sense to say "copy number alterations" in that generality.
            dispNotProfiledIn = dispNotProfiledIn.concat(
                alterationTypesInQuery
                    .filter(t => !profiledInTypes![t] && !notProfiledInTypes[t])
                    .map(
                        t =>
                            AlterationTypeText[
                                t as keyof typeof AlterationTypeText
                            ]
                    )
            );
        }
        dispNotProfiledGenePanelIds = _.uniq(
            not_profiled_in.map(x => x.genePanelId)
        ).filter(x => !!x && !dispProfiledGenePanelIdsMap[x]) as string[];
    }
    const dispAllProfiled = !!(
        dispProfiledIn &&
        dispProfiledIn.length &&
        dispNotProfiledIn &&
        !dispNotProfiledIn.length
    );
    const dispNotProfiled = !!(
        dispNotProfiledIn &&
        dispNotProfiledIn.length &&
        dispProfiledIn &&
        !dispProfiledIn.length
    );
    return {
        dispProfiledGenePanelIds,
        dispNotProfiledGenePanelIds,
        dispProfiledIn,
        dispNotProfiledIn,
        dispAllProfiled,
        dispNotProfiled,
    };
}

export function getCaseViewElt(
    dataUnderMouse: {
        sample?: string;
        patient: string;
        study_id: string;
    }[],
    caseViewLinkout: boolean
) {
    if (!dataUnderMouse.length) {
        return '';
    }

    let caseIdElt;
    if (dataUnderMouse[0].sample) {
        if (dataUnderMouse.length > 1) {
            caseIdElt = caseViewLinkout
                ? `<a class="nobreak" href=${getSampleViewUrl(
                      dataUnderMouse[0].study_id,
                      dataUnderMouse[0].sample,
                      dataUnderMouse.map(d => ({
                          studyId: d.study_id,
                          patientId: d.patient,
                      }))
                  )} target="_blank">View these ${
                      dataUnderMouse.length
                  } samples<a/>`
                : `<span class="nobreak">${dataUnderMouse.length} samples</span>`;
        } else {
            caseIdElt = caseViewLinkout
                ? sampleViewAnchorTag(
                      dataUnderMouse[0].study_id,
                      dataUnderMouse[0].sample
                  )
                : `<span class="nobreak">${dataUnderMouse[0].sample}</span>`;
        }
    } else if (dataUnderMouse[0].patient) {
        if (dataUnderMouse.length > 1) {
            caseIdElt = caseViewLinkout
                ? `<a class="nobreak" href=${getPatientViewUrl(
                      dataUnderMouse[0].study_id,
                      dataUnderMouse[0].patient,
                      dataUnderMouse.map(d => ({
                          studyId: d.study_id,
                          patientId: d.patient!,
                      }))
                  )} target="_blank">View these ${
                      dataUnderMouse.length
                  } patients<a/>`
                : `<span class="nobreak">${dataUnderMouse.length} patients</span>`;
        } else {
            caseIdElt = caseViewLinkout
                ? patientViewAnchorTag(
                      dataUnderMouse[0].study_id,
                      dataUnderMouse[0].patient
                  )
                : `<span class="nobreak">${dataUnderMouse[0].patient}</span>`;
        }
    } else {
        caseIdElt = '';
    }
    return caseIdElt;
}
