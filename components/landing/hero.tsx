"use client"

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useSession } from "next-auth/react";

export const LandingHero = () => {
  const { data } = useSession();

  const isSignedIn = data?.user;

  return <div className="text-white font-bold py-36 text-center space-y-5">
    <div className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl space-y-5 font-extrabold"><h1>The Best AI Tool</h1>
      <div className="text-sm md:text-xl font-light text-zinc-400">Keeping rapid information retrieval at your fingertips with AI</div>
      <div>
        <Link href={isSignedIn ? "/dashboard" : "/sign-up"}>
          <Button variant="premium" className="md:text-lg p-4 md:p-6 rounded-full font-semibold">
            Start Generating for Free
          </Button>
        </Link>
      </div>
    </div>
    <div className="text-zinc-400 text-xs md:text-sm font-normal">No credit card required</div>
  </div>
}
