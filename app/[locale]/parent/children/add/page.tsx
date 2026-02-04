import AddChildForm from './AddChildForm';

export default async function AddChildPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const prefix = `/${locale}`;
  return (
    <main className="max-w-sm mx-auto px-4 py-6">
      <h1 className="text-xl font-bold mb-6">Bolani qo&apos;shish</h1>
      <AddChildForm redirectPrefix={prefix} />
    </main>
  );
}
