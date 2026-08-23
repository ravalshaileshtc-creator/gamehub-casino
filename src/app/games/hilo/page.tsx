import HiLo from "@/components/games/HiLo";

export default function HiLoPage() {
  return (
    <div className="container mx-auto py-12">
      <h1 className="text-4xl font-bold text-center mb-8 text-gradient">Hi-Lo</h1>
      <HiLo />
    </div>
  );
}
