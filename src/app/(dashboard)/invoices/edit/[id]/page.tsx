import EditInvoiceClient from "./EditInvoiceClient";

export function generateStaticParams() {
  return [
    { id: "default" }
  ];
}

export default function Page() {
  return <EditInvoiceClient />;
}
