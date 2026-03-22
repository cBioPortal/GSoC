export type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>;
export type Mutable<T> = { -readonly [P in keyof T]: T[P] };
export type MapValues<T, K> = { [P in keyof T]: K };
