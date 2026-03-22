export function findFirstMostCommonElt<T>(sortedList: T[]): T | undefined {
    let maxCount = 0;
    let maxElt: T | undefined = undefined;
    let currentCount = 0;
    for (let i = 0; i < sortedList.length; i++) {
        if (i === 0 || sortedList[i] !== sortedList[i - 1]) {
            if (currentCount > maxCount) {
                maxCount = currentCount;
                maxElt = sortedList[i - 1];
            }
            currentCount = 1;
        } else {
            currentCount += 1;
        }
    }
    if (currentCount > maxCount) {
        maxElt = sortedList[sortedList.length - 1];
    }
    return maxElt;
}
