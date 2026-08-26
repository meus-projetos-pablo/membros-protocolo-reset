export default function ReaderLoading() {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-[#0a0a0a] z-50">
      <div className="relative w-8 h-8">
        {/* Spinner outer ring */}
        <div className="absolute inset-0 border-[3px] border-white/10 rounded-full"></div>
        {/* Spinner inner rotating ring */}
        <div className="absolute inset-0 border-[3px] border-white border-t-transparent rounded-full animate-spin"></div>
      </div>
    </div>
  );
}
