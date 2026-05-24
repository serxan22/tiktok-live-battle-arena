import Link from "next/link";

export default function Home() {
  return (
    <main className="control-page grid min-h-screen place-items-center px-6 py-12">
      <section className="w-full max-w-3xl">
        <div className="text-sm font-black uppercase text-cyan-300">TikTok LIVE Battle Arena</div>
        <h1 className="mt-3 text-5xl font-black tracking-normal text-white">OBS-ready football battle game</h1>
        <p className="mt-4 text-lg font-medium leading-8 text-slate-300">
          Open the vertical live screen for OBS, then use the creator control room to add fake viewers,
          trigger gifts, tune balance, and test the realtime event flow.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link className="command-button px-5" href="/live">
            Open /live
          </Link>
          <Link className="command-button px-5" href="/control">
            Open /control
          </Link>
        </div>
      </section>
    </main>
  );
}
