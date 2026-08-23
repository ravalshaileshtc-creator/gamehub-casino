import Plinko from "@/components/games/Plinko";

export default function PlinkoPage() {
  return (
    <div className="container mx-auto py-12">
      <h1 className="text-4xl font-bold text-center mb-8 text-gradient">Plinko</h1>
      <Plinko />
    </div>
  );
}
