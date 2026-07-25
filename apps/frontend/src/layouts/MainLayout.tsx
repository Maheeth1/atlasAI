import type { ReactNode } from "react";

interface Props {
    children: ReactNode;
}

export default function MainLayout({ children }: Props) {
    return (
        <div
            style={{
                width: "100vw",
                height: "100vh",
                display: "flex",
                flexDirection: "column",
            }}
        >
            {children}
        </div>
    );
}