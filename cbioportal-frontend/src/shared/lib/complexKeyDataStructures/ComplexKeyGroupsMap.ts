import ComplexKeyMap, { ComplexKey } from './ComplexKeyMap';

export default class ComplexKeyGroupsMap<V> {
    private map: ComplexKeyMap<V[]> = new ComplexKeyMap<V[]>();

    public add(key: ComplexKey, value: V) {
        let array: V[] = [];
        if (this.map.has(key)) {
            array = this.map.get(key)!;
        } else {
            this.map.set(key, array);
        }
        array.push(value);
    }

    public get(key: ComplexKey) {
        return this.map.get(key);
    }

    public clear() {
        this.map.clear();
    }

    public entries() {
        return this.map.entries();
    }
}
