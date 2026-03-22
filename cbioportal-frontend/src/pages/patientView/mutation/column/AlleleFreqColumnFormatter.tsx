import * as React from 'react';
import _ from 'lodash';
import { DefaultTooltip } from 'cbioportal-frontend-commons';
import 'rc-tooltip/assets/bootstrap_white.css';
import { Mutation } from 'cbioportal-ts-api-client';
import SampleManager from '../../SampleManager';
import { isUncalled } from 'shared/lib/MutationUtils';
import { getFormattedFrequencyValue } from 'shared/components/mutationTable/column/TumorAlleleFreqColumnFormatter';

export default class AlleleFreqColumnFormatter {
    static barWidth = 6;
    static barSpacing = 3;
    static maxBarHeight = 12;
    static indexToBarLeft = (n: number) =>
        n *
        (AlleleFreqColumnFormatter.barWidth +
            AlleleFreqColumnFormatter.barSpacing);

    public static getComponentForSampleArgs<
        T extends { tumorAltCount: number; molecularProfileId: string }
    >(mutation: T) {
        const altReads = mutation.tumorAltCount;

        let opacity: number = 1;
        let extraTooltipText: string = '';
        if (isUncalled(mutation.molecularProfileId)) {
            if (altReads > 0) {
                opacity = 0.1;
                extraTooltipText =
                    "Mutation has supporting reads, but wasn't called";
            } else {
                opacity = 0;
                extraTooltipText =
                    "Mutation has 0 supporting reads and wasn't called";
            }
        }
        return {
            opacity,
            extraTooltipText,
        };
    }

    public static convertMutationToSampleElement<
        T extends {
            sampleId: string;
            tumorRefCount: number;
            tumorAltCount: number;
            molecularProfileId: string;
        }
    >(mutation: T, color: string, barX: number, sampleComponent: any) {
        const altReads = mutation.tumorAltCount;
        const refReads = mutation.tumorRefCount;
        if (altReads < 0 || refReads < 0) {
            return null;
        }
        const freq = altReads / (altReads + refReads);
        const barHeight =
            (isNaN(freq) ? 0 : freq) * AlleleFreqColumnFormatter.maxBarHeight;
        const barY = AlleleFreqColumnFormatter.maxBarHeight - barHeight;

        const bar = (
            <rect
                x={barX}
                y={barY}
                width={AlleleFreqColumnFormatter.barWidth}
                height={barHeight}
                fill={color}
            />
        );

        const variantReadText: string = `${
            isUncalled(mutation.molecularProfileId) ? '(uncalled) ' : ''
        }(${altReads} variant reads out of ${altReads + refReads} total)`;

        const text = (
            <span>
                <strong>{getFormattedFrequencyValue(freq)}</strong>{' '}
                {variantReadText}
            </span>
        );
        return {
            sampleId: mutation.sampleId,
            bar,
            component: sampleComponent,
            text,
            freq,
        };
    }

    public static renderFunction(
        mutations: Mutation[],
        sampleManager: SampleManager | null
    ) {
        if (!sampleManager) {
            return <span></span>;
        }

        const sampleOrder = sampleManager.getSampleIdsInOrder();
        const barX = sampleOrder.reduce((map, sampleId: string, i: number) => {
            map[sampleId] = AlleleFreqColumnFormatter.indexToBarLeft(i);
            return map;
        }, {} as { [s: string]: number });
        const sampleElements = mutations.map((m: Mutation) => {
            const args = AlleleFreqColumnFormatter.getComponentForSampleArgs(m);
            return AlleleFreqColumnFormatter.convertMutationToSampleElement(
                m,
                sampleManager.getColorForSample(m.sampleId),
                barX[m.sampleId],
                sampleManager.getComponentForSample(
                    m.sampleId,
                    args.opacity,
                    args.extraTooltipText
                )
            );
        });
        const sampleToElements = sampleElements.reduce((map, elements: any) => {
            if (elements) {
                map[elements.sampleId] = elements;
            }
            return map;
        }, {} as { [s: string]: any });
        const elementsInSampleOrder = sampleOrder
            .map((sampleId: string) => sampleToElements[sampleId])
            .filter((x: any) => !!x);
        const tooltipLines = elementsInSampleOrder.map((elements: any) => (
            <span key={elements.sampleId}>
                {elements.component} {elements.text}
                <br />
            </span>
        ));
        const freqs = sampleOrder.map(
            (sampleId: string) =>
                (sampleToElements[sampleId] &&
                    sampleToElements[sampleId].freq) ||
                undefined
        );
        const bars = elementsInSampleOrder.map((elements: any) => elements.bar);

        let content: JSX.Element = <span />;

        // single sample: just show the number
        if (sampleManager.sampleIdsInHeader.length === 1) {
            // The frequency is populated by the sampleOrder.
            // In the sample view of multi-sample patient, it still populates frequency for all samples.
            const visualizedSampleIndex = sampleOrder.indexOf(
                sampleManager.sampleIdsInHeader[0]
            );
            content = (
                <span>
                    {!isNaN(freqs[visualizedSampleIndex])
                        ? getFormattedFrequencyValue(
                              freqs[visualizedSampleIndex]
                          )
                        : ''}
                </span>
            );
        }
        // multiple samples: show a graphical component
        // (if no tooltip info available do not update content)
        else if (tooltipLines.length > 0) {
            content = (
                <svg
                    width={AlleleFreqColumnFormatter.getSVGWidth(
                        sampleOrder.length
                    )}
                    height={AlleleFreqColumnFormatter.maxBarHeight}
                >
                    {bars}
                </svg>
            );
        }

        // as long as we have tooltip lines, show tooltip in either cases (single or multiple)
        if (
            tooltipLines.length > 0 &&
            freqs.filter(freq => freq !== undefined).length > 0
        ) {
            const overlay = () => <span>{tooltipLines}</span>;
            content = (
                <DefaultTooltip
                    placement="left"
                    overlay={overlay}
                    arrowContent={<div className="rc-tooltip-arrow-inner" />}
                    destroyTooltipOnHide={true}
                >
                    <div data-test="allele-freq-cell">{content}</div>
                </DefaultTooltip>
            );
        }

        return content;
    }

    public static getSVGWidth(numSamples: number) {
        return (
            numSamples * AlleleFreqColumnFormatter.barWidth +
            (numSamples - 1) * AlleleFreqColumnFormatter.barSpacing
        );
    }

    public static getSortValue(
        d: Mutation[],
        sampleManager: SampleManager | null
    ) {
        if (!sampleManager) {
            return [null];
        }

        // frequencies in sample order
        const sampleToMutation = d.reduce(
            (map: { [s: string]: Mutation }, next: Mutation) => {
                map[next.sampleId] = next;
                return map;
            },
            {} as { [s: string]: Mutation }
        );
        return sampleManager
            .getSampleIdsInOrder()
            .map(sampleId => sampleToMutation[sampleId])
            .map(
                mutation =>
                    AlleleFreqColumnFormatter.calcFrequency(mutation) || null
            );
    }

    public static isVisible(
        sampleManager: SampleManager | null,
        allMutations?: Mutation[][]
    ): boolean {
        if (allMutations) {
            for (const rowMutations of allMutations) {
                const frequency = this.getSortValue(
                    rowMutations,
                    sampleManager
                );
                // if there is at least one valid (non-falsey) value, it should be visible
                if (_.compact(frequency).length > 0) {
                    return true;
                }
            }
        }

        return false;
    }

    public static getFrequency(data: Mutation[]): string | string[] {
        const result: string[] = [];

        if (data) {
            for (const mutation of data) {
                const frequency = AlleleFreqColumnFormatter.calcFrequency(
                    mutation
                );
                const value = frequency === null ? '' : String(frequency);

                result.push(value);
            }
        }

        if (result.length === 1) {
            return result[0];
        }

        return result;
    }

    protected static calcFrequency(mutation: Mutation): number | null {
        if (!mutation) {
            return null;
        }

        const altReads = mutation.tumorAltCount;
        const refReads = mutation.tumorRefCount;

        if (altReads < 0 || refReads < 0) {
            return null;
        }

        return altReads / (altReads + refReads);
    }
}
