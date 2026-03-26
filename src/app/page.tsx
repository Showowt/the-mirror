import dynamic from "next/dynamic";

// Dynamic import to avoid SSR issues with localStorage
const TheMirrorV3 = dynamic(() => import("@/components/MirrorV3"), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
      <div className="w-10 h-10 border-2 border-[#222] border-t-[#666] rounded-full animate-spin" />
    </div>
  ),
});

export default function MirrorPage() {
  return <TheMirrorV3 />;
}
