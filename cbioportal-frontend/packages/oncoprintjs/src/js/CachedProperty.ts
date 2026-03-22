export default class CachedProperty<T> {
    private bound_properties: CachedProperty<any>[] = [];

    constructor(private value: T, private updateFn: (...args: any[]) => T) {}

    public update(...args: any[]) {
        this.value = this.updateFn.apply(null, args);
        for (let i = 0; i < this.bound_properties.length; i++) {
            this.bound_properties[i].update(...args);
        }
    }

    public get() {
        return this.value;
    }

    public updateAndGet() {
        this.update();
        return this.get();
    }
    public addBoundProperty(cached_property: CachedProperty<any>) {
        this.bound_properties.push(cached_property);
    }
}
