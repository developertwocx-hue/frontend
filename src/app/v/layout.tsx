import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Vehicle Details | Cranelift SaaS",
  description: "View vehicle information and documents",
};

export default function OperationalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {/* Material Symbols Icons */}
      <link
        href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
        rel="stylesheet"
      />
      {children}
    </>
  );
}
