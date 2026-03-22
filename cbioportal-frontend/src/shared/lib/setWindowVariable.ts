export default function setWindowVariable(propName: string, value: any) {
    if (window) (window as any)[propName] = value;
}
