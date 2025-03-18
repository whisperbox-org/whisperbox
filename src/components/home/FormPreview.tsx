
import React from 'react';
import { LockKeyhole as Lock } from 'lucide-react';

const FormPreview = () => {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">Create Private Forms</h3>
        <div className="h-2 bg-secondary rounded"></div>
      </div>
      
      <div className="space-y-4 mb-6">
        <div className="flex items-start space-x-3">
          <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center mt-0.5">
            <span className="text-xs font-medium text-primary">1</span>
          </div>
          <div className="flex-1">
            <div className="h-5 bg-secondary rounded w-3/4"></div>
          </div>
        </div>
        
        <div className="flex items-start space-x-3">
          <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center mt-0.5">
            <span className="text-xs font-medium text-primary">2</span>
          </div>
          <div className="flex-1">
            <div className="h-5 bg-secondary rounded w-5/6"></div>
            <div className="mt-2 space-y-2">
              <div className="flex items-center">
                <div className="w-4 h-4 rounded-full border border-border mr-2"></div>
                <div className="h-4 bg-secondary rounded w-1/2"></div>
              </div>
              <div className="flex items-center">
                <div className="w-4 h-4 rounded-full border border-border mr-2"></div>
                <div className="h-4 bg-secondary rounded w-2/3"></div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex items-start space-x-3">
          <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center mt-0.5">
            <span className="text-xs font-medium text-primary">3</span>
          </div>
          <div className="flex-1">
            <div className="h-5 bg-secondary rounded w-2/3"></div>
            <div className="mt-3 h-20 bg-secondary rounded"></div>
          </div>
        </div>
      </div>
      
      <div className="flex justify-end">
        <div className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium inline-flex items-center">
          <Lock className="w-4 h-4 mr-1.5" />
          Encrypt & Submit
        </div>
      </div>
    </div>
  );
};

export default FormPreview;
