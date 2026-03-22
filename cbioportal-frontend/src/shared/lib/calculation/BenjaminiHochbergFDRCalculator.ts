export function calculateQValues(pValuesInIncreasingOrder: number[]): number[] {
    let cachedElement: number;
    const dataLength = pValuesInIncreasingOrder.length;
    const reversedQValues = pValuesInIncreasingOrder
        .reverse()
        .map((currentElement, index) => {
            if (cachedElement) {
                const calculatedValue = Math.min(
                    cachedElement,
                    (currentElement * dataLength) / (dataLength - index)
                );
                cachedElement = calculatedValue;
                return calculatedValue;
            }
            cachedElement = currentElement;
            return currentElement;
        });

    return reversedQValues.reverse();
}
