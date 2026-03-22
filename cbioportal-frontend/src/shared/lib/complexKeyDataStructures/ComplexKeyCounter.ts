import ComplexKeyMap, { ComplexKey } from './ComplexKeyMap';

export default class ComplexKeyCounter {
    private map: ComplexKeyMap<number> = new ComplexKeyMap<number>();

    public add(key: ComplexKey, amount: number) {
        this.map.set(key, (this.map.get(key) || 0) + amount);
    }

    public increment(key: ComplexKey) {
        this.add(key, 1);
    }

    public get(key: ComplexKey) {
        return this.map.get(key) || 0;
    }

    public clear() {
        this.map.clear();
    }

    public entries() {
        return this.map.entries();
    }
}
