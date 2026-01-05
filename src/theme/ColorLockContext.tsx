import React, { createContext, useContext, ReactNode } from 'react';
import { COLORS } from './tokens';

const ColorLockContext = createContext(COLORS);

export const ColorLockProvider = ({ children }: { children: ReactNode }) => {
    return (
        <ColorLockContext.Provider value={COLORS}>
            {children}
        </ColorLockContext.Provider>
    );
};

export const useColors = () => useContext(ColorLockContext);
export { COLORS };
