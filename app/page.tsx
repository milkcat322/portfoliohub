export default function Home() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-50">
      <div className="text-center">
        <h1 className="text-5xl font-bold tracking-tight">
          PortfolioHub
        </h1>

        <p className="mt-4 text-zinc-500">
          학생 활동을 기록하고 관리하는 플랫폼
        </p>

        <button className="mt-10 rounded-xl bg-black px-6 py-3 text-white transition hover:bg-zinc-800">
          시작하기
        </button>
      </div>
    </main>
  );
}