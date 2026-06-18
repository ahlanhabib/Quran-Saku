import React, { ReactNode } from "react";
import { motion, HTMLMotionProps } from "motion/react";

interface PageContainerProps extends HTMLMotionProps<"div"> {
  children: ReactNode;
  className?: string;
  isGrid?: boolean;
}

export const PageContainer: React.FC<PageContainerProps> = ({ 
  children, 
  className = "", 
  isGrid = false,
  ...props 
}) => {
  const baseClasses = isGrid
    ? "grid grid-cols-1 lg:grid-cols-12 gap-6 items-start max-w-5xl mx-auto w-full pb-8 sm:pb-12"
    : "flex flex-col h-full bg-[#FDFBF7] relative max-w-2xl mx-auto w-full pb-8 sm:pb-12";

  return (
    <motion.div
      {...props}
      className={`${baseClasses} ${className}`}
    >
      {children}
    </motion.div>
  );
};
