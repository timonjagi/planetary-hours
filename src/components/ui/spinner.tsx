import {cn} from '../../lib/utils';
import {Loader2} from 'lucide-react';
import {HTMLAttributes} from 'react';

interface SpinnerProps extends HTMLAttributes<HTMLDivElement> {
  size?: number;
}

export function Spinner({className, size = 24, ...props}: SpinnerProps) {
  return (
    <div role='status' className={cn('animate-spin', className)} {...props}>
      <Loader2 size={size} />
      <span className='sr-only'>Loading...</span>
    </div>
  );
}
