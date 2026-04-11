import Image from "next/image"

interface AppLogoProps {
  className?: string
  imageClassName?: string
}

export function AppLogo({ className = "h-8 w-8", imageClassName = "" }: AppLogoProps) {
  return (
    <div className={`relative shrink-0 overflow-hidden rounded-lg ${className}`}>
      <Image
        src="/logo.png"
        alt="IntelliSupply logo"
        fill
        sizes="32px"
        className={`object-contain ${imageClassName}`.trim()}
        priority
      />
    </div>
  )
}
