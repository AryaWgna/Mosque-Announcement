'use client';

import { AlertProvider } from '@/components/MosqueAlert';

export default function Providers({ children }: { children: React.ReactNode }) {
    return <AlertProvider>{children}</AlertProvider>;
}
