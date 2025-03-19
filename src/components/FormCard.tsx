import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CalendarClock, ChevronRight, FileText, Users } from 'lucide-react';
import { FormType } from '@/types/form';

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
    } else {
      return `${diffDays} days ago`;
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
        boxShadow: '0 10px 30px -10px rgba(0,0,0,0.1)' 
      }}
      className="glassmorphism rounded-xl overflow-hidden"
    >
      <Link to={`/view/${form.id}`} className="block">
        <div className="p-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <div className="flex space-x-2">
                <span className="inline-block px-2 py-1 text-xs font-medium bg-primary/10 text-primary rounded-full">
                  {form.questions.length} Questions
                </span>
                <span className="inline-block px-2 py-1 text-xs font-medium bg-secondary text-foreground/80 rounded-full flex items-center">
                  <CalendarClock className="w-3 h-3 mr-1" />
                  {calculateDaysAgo(form.createdAt)}
                </span>
              </div>
              <h3 className="text-xl font-semibold mt-3">{form.title}</h3>
              <p className="text-muted-foreground mt-1 line-clamp-2">
                {form.description}
              </p>
            </div>
          </div>
          
          <div className="border-t border-border pt-4 mt-4 flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <div className="flex items-center">
                <FileText className="w-4 h-4 text-muted-foreground mr-1.5" />
                <span className="text-sm text-muted-foreground">Created on {formatDate(form.createdAt)}</span>
              </div>
              
              <div className="flex items-center">
                <Users className="w-4 h-4 text-muted-foreground mr-1.5" />
                <span className="text-sm text-muted-foreground">
                  {form.responses.length} {form.responses.length === 1 ? 'Response' : 'Responses'}
                </span>
              </div>
            </div>
            
            <motion.div
              whileHover={{ x: 5 }}
              className="rounded-full w-8 h-8 flex items-center justify-center bg-primary/10"
            >
              <ChevronRight className="w-5 h-5 text-primary" />
            </motion.div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
};

export default FormCard;
