export class SiteError {
    public meta?: Record<any, any>;

    constructor(
        public errorObj: any,
        public displayType: 'alert' | 'site' = 'site',
        public title?: string
    ) {}
}
