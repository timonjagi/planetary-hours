import {cn} from '../../lib/utils';
import {HTMLAttributes} from 'react';

export function Container({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('container mx-auto px-4', className)} {...props} />;
}

export function Stack({className, ...props}: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('flex flex-col', className)} {...props} />;
}

export function Box({className, ...props}: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn(className)} {...props} />;
}

export function Text({
  className,
  ...props
}: HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn('text-sm', className)} {...props} />;
}

export function List({className, ...props}: HTMLAttributes<HTMLUListElement>) {
  return <ul className={cn('list-none', className)} {...props} />;
}

export function ListItem({className, ...props}: HTMLAttributes<HTMLLIElement>) {
  return <li className={cn(className)} {...props} />;
}
