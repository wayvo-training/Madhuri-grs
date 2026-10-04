import Image from "next/image";

interface LogoProps {
  size?: number;
  className?: string;
}

export function Logo({ size = 40, className = "" }: LogoProps) {
  return (
    <div
      className={`relative overflow-hidden rounded-xl bg-teal-900/5 shadow-xs shrink-0 flex items-center justify-center ${className}`}
      style={{ width: size, height: size }}
    >
      <Image
        src="/logo.png"
        alt="GRS Logo"
        width={size}
        height={size}
        className="w-full h-full object-contain rounded-xl"
        priority
      />
    </div>
  );
}

export default Logo;
