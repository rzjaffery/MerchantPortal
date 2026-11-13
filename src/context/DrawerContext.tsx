// src/context/DrawerContext.tsx
import {
    createContext,
    useCallback,
    useContext,
    useMemo,
    useState,
    type PropsWithChildren,
} from 'react';

import AppDrawer from '@/components/common/AppDrawer';

interface DrawerContextValue {
    openDrawer: () => void;
}

const DrawerContext = createContext<DrawerContextValue | undefined>(
    undefined
);

// Holds the one drawer for the whole app.
export function DrawerProvider({ children }: PropsWithChildren) {
    const [visible, setVisible] = useState(false);

    const openDrawer = useCallback(() => setVisible(true), []);
    const closeDrawer = useCallback(() => setVisible(false), []);

    const value = useMemo<DrawerContextValue>(
        () => ({ openDrawer }),
        [openDrawer]
    );

    return (
        <DrawerContext.Provider value={value}>
            {children}

            <AppDrawer visible={visible} onClose={closeDrawer} />
        </DrawerContext.Provider>
    );
}

export function useDrawer(): DrawerContextValue {
    const context = useContext(DrawerContext);

    if (context === undefined) {
        throw new Error('useDrawer must be used inside DrawerProvider.');
    }

    return context;
}