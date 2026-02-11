import { type HTMLMotionProps, motion } from "framer-motion";
import { forwardRef, type ReactNode } from "react";
import { Card } from "./Card";

interface MotionCardProps extends HTMLMotionProps<"div"> {
  children: ReactNode;
}

const MotionCard = forwardRef<HTMLDivElement, MotionCardProps>(
  ({ children, ...props }, ref) => {
    return (
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        whileInView={{ opacity: 1, y: 0, scale: 1 }}
        viewport={{ once: true, margin: "-50px" }}
        whileHover={{ y: -4, transition: { duration: 0.2 } }}
        transition={{
          type: "spring",
          stiffness: 260,
          damping: 20,
          mass: 1,
        }}
        {...props}
      >
        <Card className="h-full transition-shadow hover:shadow-lg">
          {children}
        </Card>
      </motion.div>
    );
  },
);

MotionCard.displayName = "MotionCard";

export { MotionCard };
