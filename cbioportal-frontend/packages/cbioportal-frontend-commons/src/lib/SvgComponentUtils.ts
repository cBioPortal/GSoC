export function unhoverAllComponents<
    T extends { isHovered: boolean }
>(components: { [index: string]: T }) {
    for (const index of Object.keys(components)) {
        const component = components[index];
        if (component) {
            component.isHovered = false;
        }
    }
}

export function getComponentIndex(
    classes: string,
    classPrefix: string
): number | null {
    const match = classes
        .split(/[\s]+/g)
        .map(c => c.match(new RegExp(`^${classPrefix}(.*)$`)))
        .find(x => x !== null);

    if (!match) {
        return null;
    } else {
        return parseInt(match[1], 10);
    }
}
