import React, { Context } from 'react';

export interface IAppContext {}

export const AppContext: Context<IAppContext> = React.createContext<
    IAppContext
>({});
