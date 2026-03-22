import { PfamDomainRange } from 'genome-nexus-ts-api-client';

export function generatePfamDomainColorMap(
    pfamDomains: PfamDomainRange[]
): { [pfamAccession: string]: string } {
    const colors: string[] = [
        '#2dcf00',
        '#ff5353',
        '#5b5bff',
        '#ebd61d',
        '#ba21e0',
        '#ff9c42',
        '#ff7dff',
        '#b9264f',
        '#baba21',
        '#c48484',
        '#1f88a7',
        '#cafeb8',
        '#4a9586',
        '#ceb86c',
        '#0e180f',
    ];

    const map: { [pfamAccession: string]: string } = {};

    let colorIdx = 0;

    // sort domains by start position,
    // then assign a different color for each unique domain id.
    pfamDomains
        .sort(
            (a: PfamDomainRange, b: PfamDomainRange): number =>
                a.pfamDomainStart - b.pfamDomainStart
        )
        .forEach((domain: PfamDomainRange) => {
            if (map[domain.pfamDomainId] === undefined) {
                map[domain.pfamDomainId] = colors[colorIdx % colors.length];
                colorIdx++;
            }
        });

    return map;
}
