import logo from "@/assets/perpex-logo.png";
import { cn } from "@/lib/utils";

type Props = {
  className?: string;
  showWordmark?: boolean;
  onClick?: () => void;
};

export function PerpexLogo({ className, onClick }: Props) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "flex items-center justify-center select-none",
        onClick ? "cursor-pointer" : "cursor-default",
        className
      )}
    >
      <img 
        src={logo} 
        alt="PerpeX logo" 
        className="h-16 w-auto object-contain" 
        draggable={false} 
      />
    </div>
  );
}
