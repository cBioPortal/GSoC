import ComplexKeyMap, { ComplexKey } from './ComplexKeyMap';

export default class ComplexKeySet {
    private map: ComplexKeyMap<boolean> = new ComplexKeyMap<boolean>();

    public static from(keys: ComplexKey[]) {
        const set = new ComplexKeySet();
        for (const k of keys) {
            set.add(k);
        }
        return set;
    }

    public keys(): ComplexKey[] {
        return this.map
            .entries()
            .filter(e => e.value)
            .map(e => e.key);
    }

    public add(key: ComplexKey) {
        this.map.set(key, true);
    }

    public delete(key: ComplexKey) {
        this.map.set(key, false);
    }

    public has(key: ComplexKey, keyMembers?: string[]) {
        return !!this.map.get(key, keyMembers);
    }

    public isEmpty() {
        return this.keys().length === 0;
    }

    public clear() {
        this.map.clear();
    }
}
