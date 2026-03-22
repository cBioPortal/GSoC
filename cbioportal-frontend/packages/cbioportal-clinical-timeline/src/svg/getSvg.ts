import {TimelineStore} from "../TimelineStore";
import {CustomTrackSpecification} from "../CustomTrack";
import {EXPORT_TRACK_HEADER_BORDER_CLASSNAME, getTrackHeadersG} from "../TrackHeader";
import {TICK_AXIS_COLOR} from "../TickAxis";
import jQuery from "jquery";
import {REMOVE_FOR_DOWNLOAD_CLASSNAME} from "../lib/helpers";

export default function getSvg(
    store: TimelineStore,
    timelineG: SVGGElement | null,
    customTracks?: CustomTrackSpecification[],
    visibleTracks?: string[]
) {
    if (!timelineG) {
        return null;
    }

    const svg = (document.createElementNS(
        'http://www.w3.org/2000/svg',
        'svg'
    ) as unknown) as SVGElement;
    document.body.appendChild(svg); // add to body so that we can do getBBox calculations for layout

    const everythingG = (document.createElementNS(
        'http://www.w3.org/2000/svg',
        'g'
    ) as unknown) as SVGGElement;
    svg.append(everythingG);

    try {
        // Add headers
        const headersG = getTrackHeadersG(store, customTracks, visibleTracks);
        everythingG.appendChild(headersG);
        const headersSize = headersG.getBBox();
        const headersPadding = 10;

        // Add separating line between headers and tracks
        const separatingLine = (document.createElementNS(
            'http://www.w3.org/2000/svg',
            'line'
        ) as unknown) as SVGLineElement;
        separatingLine.setAttribute(
            'x1',
            `${store.headersWidth}`
        );
        separatingLine.setAttribute(
            'x2',
            `${store.headersWidth}`
        );
        separatingLine.setAttribute('y1', '0');
        separatingLine.setAttribute(
            'y2',
            `${headersSize.y + headersSize.height}`
        );
        separatingLine.setAttribute(
            'style',
            `stroke-width:1; stroke:${TICK_AXIS_COLOR}`
        );
        everythingG.appendChild(separatingLine);

        // Add tracks
        // Clone node so we don't disrupt the UI
        timelineG = timelineG.cloneNode(true) as SVGGElement;
        everythingG.appendChild(timelineG);
        // Move tracks over from labels
        timelineG.setAttribute(
            'transform',
            `translate(${store.headersWidth} 0)`
        );

        const everythingSize = everythingG.getBBox();

        // Set svg size to include everything
        svg.setAttribute('width', `${everythingSize.width}`);
        svg.setAttribute('height', `${everythingSize.height}`);

        // Finishing touches
        // Filter out non-download elements
        jQuery(svg)
            .find(`.${REMOVE_FOR_DOWNLOAD_CLASSNAME}`)
            .remove();

        // Extend track header borders
        jQuery(svg)
            .find(`.${EXPORT_TRACK_HEADER_BORDER_CLASSNAME}`)
            .each(function() {
                this.setAttribute(
                    'x2',
                    `${headersSize.width + headersPadding}`
                );
            });
    } finally {
        document.body.removeChild(svg); // remove from body no matter what happens
    }
    return svg;
}
