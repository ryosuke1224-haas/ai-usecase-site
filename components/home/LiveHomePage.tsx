import { HomeHero } from "@/components/homepage/home-hero";

export function LiveHomePage() {
  return (
    <div className="mx-auto flex min-h-[calc(100dvh-11rem)] w-full max-w-6xl flex-col justify-center px-6 py-10 sm:py-14">
      <HomeHero />
    </div>
  );
}
