import _ from 'lodash';

export type ComplexKey = {
    [k: string]: string | number | boolean | null | undefined;
};

type Entry<V> = {
    key: ComplexKey;
    value: V;
};

function getStringKey(key: ComplexKey) {
    const keyElements = _.keys(key);
    const sortedKeyElements = _.sortBy(keyElements);
    return sortedKeyElements.map(k => `${key}:${(key as any)[k]}`).join(',');
}

function keyEquals(key1: ComplexKey, key2: ComplexKey) {
    return _.isEqual(key1, key2);
}

function narrowKey(key: ComplexKey, keyMembers?: string[]) {
    if (!keyMembers) {
        return key;
    } else {
        const ret: ComplexKey = {};
        for (const keyMember of keyMembers) {
            ret[keyMember] = key[keyMember];
        }
        return ret;
    }
}

export default class ComplexKeyMap<V> {
    private map: { [stringKey: string]: Entry<V>[] } = {};

    public entries(): Entry<V>[] {
        return _.flatten(_.values(this.map));
    }

    public set(key: ComplexKey, value: V, keyMembers?: string[]): boolean {
        // true if an entry was added, false if an entry existed and was updated

        key = narrowKey(key, keyMembers);
        const existingEntry = this.getEntry(key);
        if (existingEntry) {
            existingEntry.value = value;
            return false;
        } else {
            this.getEntriesWithStringKey(key).push({ key, value });
            return true;
        }
    }

    public get(key: ComplexKey, keyMembers?: string[]): V | undefined {
        key = narrowKey(key, keyMembers);
        const entry = this.getEntry(key);
        if (!entry) {
            return undefined;
        } else {
            return entry.value;
        }
    }

    public has(key: ComplexKey, keyMembers?: string[]): boolean {
        key = narrowKey(key, keyMembers);
        return !!this.getEntry(key);
    }

    public clear() {
        this.map = {};
    }

    public static from<K, T>(
        objs: T[],
        key: (t: T) => ComplexKey
    ): ComplexKeyMap<T> {
        const map = new ComplexKeyMap<T>();
        for (const o of objs) {
            map.set(key(o), o);
        }
        return map;
    }

    private getEntriesWithStringKey(key: ComplexKey): Entry<V>[] {
        const stringKey = getStringKey(key);
        this.map[stringKey] = this.map[stringKey] || [];
        return this.map[stringKey];
    }

    private getEntry(key: ComplexKey): Entry<V> | undefined {
        return this.getEntriesWithStringKey(key).find(entry =>
            keyEquals(entry.key, key)
        );
    }
}
