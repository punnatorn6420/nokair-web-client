import dynamic from "next/dynamic";
import HomeContentSkeleton from "@/components/home/home-content-skeleton";

const HomeContent = dynamic(() => import("@/components/home/home-content"), {
  loading: () => <HomeContentSkeleton />,
});

export default function Home() {
  return <HomeContent />;
}
