import CustomerDetailClient from "./CustomerDetailClient";

export function generateStaticParams() {
  return [
    { id: "default" }
  ];
}

export default function Page() {
  return <CustomerDetailClient />;
}
