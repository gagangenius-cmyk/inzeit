import * as React from "react"

interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'secondary' | 'destructive' | 'outline'
}

const badgeVariants = {
  default: "border-transparent bg-blue-600 text-white hover:bg-blue-700",
  secondary: "border-transparent bg-gray-200 text-gray-900 hover:bg-gray-300",
  destructive: "border-transparent bg-red-600 text-white hover:bg-red-700",
  outline: "border-gray-300 text-gray-900 bg-white hover:bg-gray-50"
}

function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  const variantClass = badgeVariants[variant] || badgeVariants.default
  return (
    <div 
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors ${variantClass} ${className || ''}`} 
      {...props} 
    />
  )
}

export { Badge }
