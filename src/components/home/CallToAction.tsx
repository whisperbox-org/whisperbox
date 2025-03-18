
import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { AnimatedButton } from '@/components/ui/animated-button';

const CallToAction = () => {
  return (
    <div className="py-16">
      <div className="bg-primary/5 rounded-2xl p-10 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-1/3 h-full bg-primary/10 transform -skew-x-12"></div>
        
        <div className="relative z-10 max-w-3xl">
          <h2 className="text-3xl font-bold mb-4">Ready to create your first secure form?</h2>
          <p className="text-lg text-muted-foreground mb-8">
            Join the privacy revolution. Create forms that respect your data and your respondents' privacy.
          </p>
          
          <Link to="/create">
            <AnimatedButton 
              variant="default"
              icon={<ArrowRight className="w-5 h-5" />}
            >
              Get Started
            </AnimatedButton>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default CallToAction;
