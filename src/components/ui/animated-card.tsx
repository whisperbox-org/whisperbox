
import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardProps } from './card';
import { cn } from '@/lib/utils';

interface AnimatedCardProps extends CardProps {
  delay?: number;
  hoverEffect?: boolean;
}

const AnimatedCard = React.forwardRef<HTMLDivElement, AnimatedCardProps>(
  ({ className, children, delay = 0, hoverEffect = true, ...props }, ref) => {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ 
          duration: 0.5, 
          delay, 
          ease: [0.22, 1, 0.36, 1] 
        }}
        whileHover={hoverEffect ? { y: -5 } : undefined}
        className="w-full"
      >
        <Card 
          ref={ref}
          className={cn(
            "transition-shadow duration-300",
            hoverEffect && "hover:shadow-lg",
            className
          )} 
          {...props}
        >
          {children}
        </Card>
      </motion.div>
    );
  }
);

AnimatedCard.displayName = "AnimatedCard";

export { AnimatedCard };
