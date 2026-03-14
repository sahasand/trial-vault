interface ErrorBannerProps {
  message: string;
  className?: string;
}

export default function ErrorBanner({ message, className = "" }: ErrorBannerProps) {
  return (
    <div
      className={`rounded-[10px] border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive ${className}`}
    >
      {message}
    </div>
  );
}
