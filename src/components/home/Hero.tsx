
import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  LockKeyhole, 
  FileText, 
  ChevronRight
} from 'lucide-react';
import FormPreview from './FormPreview';
import { AnimatedButton } from '@/components/ui/animated-button';

const Hero = () => {
  return (
    <div className="flex flex-col lg:flex-row items-center justify-between py-12 lg:py-20">
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="lg:w-1/2 mb-10 lg:mb-0"
      >
        <div className="bg-primary/10 text-primary text-sm font-medium px-4 py-1.5 rounded-full inline-flex items-center mb-6">
          <LockKeyhole className="w-4 h-4 mr-1.5" />
          <span>Privacy-First Form Platform</span>
        </div>
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6">
          WhisperBox: Encrypted Decentralized Forms
        </h1>
        <p className="text-lg text-muted-foreground mb-8 max-w-xl">
          Create forms, surveys, and polls that respect your privacy. 
          Built on Web3 with encryption to ensure your data stays private.
        </p>
        
        <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
          <Link to="/create">
            <AnimatedButton 
              variant="default"
              icon={<FileText className="w-5 h-5" />}
              iconPosition="left"
              className="w-full sm:w-auto shadow-lg"
            >
              Create a Form
            </AnimatedButton>
          </Link>
          <Link to="/forms">
            <AnimatedButton 
              variant="secondary"
              icon={<ChevronRight className="w-5 h-5" />}
              className="w-full sm:w-auto border border-border"
            >
              View Your Forms
            </AnimatedButton>
          </Link>
        </div>
      </motion.div>
      
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, delay: 0.4 }}
        className="lg:w-1/2 flex justify-center"
      >
        <div className="relative w-full max-w-md">
          <div className="absolute -top-6 -left-6 w-40 h-40 bg-primary/5 rounded-full"></div>
          <div className="absolute -bottom-8 -right-8 w-60 h-60 bg-primary/5 rounded-full"></div>
          
          <motion.div
            initial={{ rotate: 0 }}
            animate={{ rotate: 360 }}
            transition={{ duration: 120, repeat: Infinity, ease: "linear" }}
            style={{ transformOrigin: "center center" }}
            className="absolute inset-0 border-2 border-dashed border-primary/20 rounded-xl opacity-60"
          />
          
          <div className="glassmorphism rounded-xl overflow-hidden shadow-xl relative z-10">
            <div className="p-1 bg-secondary/70">
              <div className="flex justify-start space-x-1.5 px-3 py-2">
                <div className="w-3 h-3 rounded-full bg-red-400"></div>
                <div className="w-3 h-3 rounded-full bg-amber-400"></div>
                <div className="w-3 h-3 rounded-full bg-green-400"></div>
              </div>
            </div>
            
            <FormPreview />
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Hero;
