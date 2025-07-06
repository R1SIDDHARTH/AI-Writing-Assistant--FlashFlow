import { Sparkles } from 'lucide-react';
import type { SVGProps } from 'react';

export function FlashFlowLogo(props: SVGProps<SVGSVGElement>) {
  return (
    <Sparkles className="text-primary h-8 w-8" {...props} />
  );
}
