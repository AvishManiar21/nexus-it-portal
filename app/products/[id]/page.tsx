interface Props {
  params: { id: string };
}

export default function ProductDetail({ params }: Props) {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-4">Product Detail</h1>
      <p className="text-gray-500">You are viewing product ID: <span className="font-mono">{params.id}</span></p>
    </div>
  );
}