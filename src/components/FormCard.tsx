import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CalendarClock, ChevronRight, FileText, Users, Clock, Shield } from 'lucide-react';
import { FormType } from '@/types/form';
import { addForm } from '@/lib/formStore';

interface FormCardProps {
  form: FormType;
  delay?: number;
}

const FormCard: React.FC<FormCardProps> = ({ form, delay = 0 }) => {
  // Format date to be more readable
  const formatDate = (ts : number) => {
    const date = new Date(ts);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };
  
  // Calculate days ago
  const calculateDaysAgo = (ts: number) => {
    const date = new Date(ts);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return 'Today';
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 30) {
      return `${diffDays} days ago`;
    } else {
      return formatDate(ts);
    }
  };
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ 
        duration: 0.5, 
        delay: delay * 0.1,
        ease: [0.22, 1, 0.36, 1] 
      }}
      whileHover={{ 
        y: -5,
        boxShadow: '0 10px 30px -15px rgba(0,0,0,0.1)' 
      }}
      className="bg-background border border-border hover:border-primary/20 rounded-xl overflow-hidden shadow-sm hover:shadow transition-all"
    >
      <Link to={`/view/${form.id}`} className="block h-full flex flex-col">
        <div className="p-5 flex-1 flex flex-col">
          {/* Card header */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center">
              <Clock className="w-3.5 h-3.5 text-muted-foreground mr-1.5" />
              <span className="text-xs text-muted-foreground">{calculateDaysAgo(form.createdAt)}</span>
            </div>
            {form.whitelist.type !== 'none' && (
              <div className="flex items-center text-xs">
                <Shield className="w-3.5 h-3.5 text-green-500 mr-1" />
                <span className="text-green-600">Encrypted</span>
              </div>
            )}
          </div>
          
          {/* Card title */}
          <h3 className="text-lg font-semibold line-clamp-1">{form.title}</h3>
          
          {/* Card description */}
          <p className="text-muted-foreground text-sm mt-1.5 mb-4 line-clamp-2 flex-grow">
            {form.description}
          </p>
          
          {/* Stats row */}
          <div className="flex flex-wrap gap-2 mt-auto mb-3">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
              {form.questions.length} Questions
            </span>
            
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-secondary text-foreground/70">
              <Users className="w-3 h-3 mr-1" />
              {form.responses.length} {form.responses.length === 1 ? 'Response' : 'Responses'}
            </span>
          </div>
          
          {/* Card footer with action indicator */}
          <div className="flex justify-end mt-2">
            <span className="text-xs font-medium text-primary flex items-center">
              View Form
              <ChevronRight className="w-4 h-4 ml-1" />
            </span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
};

export default FormCard;
