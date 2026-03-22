function normalizeInterval(start: number, end: number) {
    return { start: Math.min(start, end), end: Math.max(start, end) };
}

export function intersect(
    start1: number,
    end1: number,
    start2: number,
    end2: number
) {
    const { start: _start1, end: _end1 } = normalizeInterval(start1, end1);
    const { start: _start2, end: _end2 } = normalizeInterval(start2, end2);
    // find out which is longer one or two
    let shorter, longer;
    if (_end1 - _start1 > _end2 - _start2) {
        shorter = { start: _start2, end: _end2 };
        longer = { start: _start1, end: _end1 };
    } else {
        shorter = { start: _start1, end: _end1 };
        longer = { start: _start2, end: _end2 };
    }

    return (
        between(shorter.start, longer.start, longer.end) ||
        between(shorter.end, longer.start, longer.end)
    );
}

function between(num: number, bound1: number, bound2: number) {
    return num >= bound1 && num <= bound2;
}

export default intersect;
