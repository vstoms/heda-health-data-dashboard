import { type HTMLMotionProps, motion, type Variants } from "framer-motion";
import type { ReactNode } from "react";
import { FADE_IN_VARIANTS, STAGGER_CONTAINER_VARIANTS } from "@/lib/animations";

interface MotionWrapperProps extends HTMLMotionProps<"div"> {
  children: ReactNode;
  variants?: Variants;
  delay?: number;
}

export function MotionWrapper({
  children,
  variants = FADE_IN_VARIANTS,
  delay = 0,
  className,
  ...props
}: MotionWrapperProps) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={variants}
      transition={{ delay }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}

export function StaggerContainer({
  children,
  className,
  ...props
}: MotionWrapperProps) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={STAGGER_CONTAINER_VARIANTS}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}
