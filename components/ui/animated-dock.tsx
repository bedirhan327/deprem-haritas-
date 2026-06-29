"use client" 

import * as React from "react"
import { useRef } from "react";
import {
  MotionValue,
  motion,
  useMotionValue,
  useSpring,
  useTransform,
} from "motion/react";
 
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
 
const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));
 
export interface AnimatedDockProps {
  className?: string;
  items: DockItemData[];
}
 
export interface DockItemData {
  id: string;
  label?: string;
  Icon: React.ReactNode;
  onClick?: () => void;
  active?: boolean;
}
 
export const AnimatedDock = ({ className, items }: AnimatedDockProps) => {
  const mouseX = useMotionValue(Infinity);
 
  return (
    <motion.div
      onMouseMove={(e) => mouseX.set(e.pageX)}
      onMouseLeave={() => mouseX.set(Infinity)}
      className={cn(
        "flex h-12 items-end gap-2 rounded-2xl bg-[#18181B]/90 backdrop-blur-md border border-[#3F3F46] shadow-xl shadow-black/50 px-3 pb-2",
        className,
      )}
    >
      {items.map((item, index) => (
        <DockItem key={index} mouseX={mouseX} active={item.active} onClick={item.onClick}>
          {item.Icon}
        </DockItem>
      ))}
    </motion.div>
  );
};
 
interface DockItemProps {
  mouseX: MotionValue<number>;
  children: React.ReactNode;
  active?: boolean;
  onClick?: () => void;
}
 
export const DockItem = ({ mouseX, children, active, onClick }: DockItemProps) => {
  const ref = useRef<HTMLDivElement>(null);

  const distance = useTransform(mouseX, (val) => {
    const bounds = ref.current?.getBoundingClientRect() ?? { x: 0, width: 0 };
    return val - bounds.x - bounds.width / 2;
  });

  const widthSync = useTransform(distance, [-100, 0, 100], [36, 56, 36]);
  const width = useSpring(widthSync, {
    mass: 0.1,
    stiffness: 150,
    damping: 12,
  });

  const iconScale = useTransform(width, [36, 56], [1, 1.3]);
  const iconSpring = useSpring(iconScale, {
    mass: 0.1,
    stiffness: 150,
    damping: 12,
  });

  return (
    <motion.div
      ref={ref}
      style={{ width }}
      onClick={onClick}
      className={cn(
        "aspect-square w-9 rounded-full flex items-center justify-center transition-colors cursor-pointer",
        active ? "bg-[#FAFAFA] text-[#09090B] shadow-lg" : "bg-[#27272A] text-[#A1A1AA] hover:text-[#FAFAFA] hover:bg-[#3F3F46]"
      )}
    >
      <motion.div
        style={{ scale: iconSpring }}
        className="flex items-center justify-center w-full h-full grow"
      >
        {children}
      </motion.div>
    </motion.div>
  );
};
