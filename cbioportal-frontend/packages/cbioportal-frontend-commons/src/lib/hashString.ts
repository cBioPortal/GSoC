// source: https://werxltd.com/wp/2010/05/13/javascript-implementation-of-javas-string-hashcode-method/

export function hashString(str: string) {
    let hash = 0;
    if (str.length == 0) return hash;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = (hash << 5) - hash + char;
        hash = hash & hash; // Convert to 32bit integer
    }
    return hash;
}
