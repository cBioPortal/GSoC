import { getBrowserWindow } from 'cbioportal-frontend-commons';
import { getServerConfig } from 'config/config';

export const DEFAULT_ONCOKB_CONTENT_WIDTH = 22;

export function calculateOncoKbContentWidth(
    annotationElementId: string,
    oncoKbContentClassName: string = 'oncokb-content'
) {
    return document
        .getElementById(annotationElementId)
        ?.getElementsByClassName(oncoKbContentClassName)[0]?.clientWidth;
}

export function calculateOncoKbContentWidthOnNextFrame(
    annotationElementId: string,
    callback: (width?: number) => void
) {
    // workaround for updated width due to style toggle
    // we need to calculate the OncoKB width on the next render cycle, otherwise it is not updated yet
    setTimeout(() => {
        let oncokbContentWidth = calculateOncoKbContentWidth(
            annotationElementId
        );
        oncokbContentWidth = oncokbContentWidth
            ? Number(oncokbContentWidth)
            : oncokbContentWidth;
        callback(oncokbContentWidth);
    }, 0);
}

export function calculateOncoKbContentWidthWithInterval(
    annotationElementId: string,
    callback: (width: number) => void
) {
    const interval = setInterval(() => {
        let oncoKbContentWidth = calculateOncoKbContentWidth(
            annotationElementId
        );

        if (oncoKbContentWidth) {
            oncoKbContentWidth =
                Number(oncoKbContentWidth) || DEFAULT_ONCOKB_CONTENT_WIDTH;
            callback(oncoKbContentWidth);
        }
    }, 500);

    return interval;
}

export function calculateOncoKbContentPadding(oncoKbContentWidth?: number) {
    return oncoKbContentWidth || 0 > 22 ? oncoKbContentWidth! - 22 : 0;
}

export function saveOncoKbIconStyleToLocalStorage(style: {
    mergeIcons: boolean;
}) {
    getBrowserWindow().localStorage.setItem(
        'mergeOncoKbIcons',
        `${style.mergeIcons}`
    );
}

export function getOncoKbIconStyleFromLocalStorage() {
    const mergeOncoKbIcons = getBrowserWindow().localStorage.getItem(
        'mergeOncoKbIcons'
    );

    // if no local storage value found, fallback to server config value
    const mergeIcons =
        mergeOncoKbIcons !== null && mergeOncoKbIcons.length > 0
            ? mergeOncoKbIcons === 'true'
            : getServerConfig().oncokb_merge_icons_by_default;

    return { mergeIcons };
}
