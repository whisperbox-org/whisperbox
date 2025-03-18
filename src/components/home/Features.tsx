
import React from 'react';
import { LockKeyhole, Shield, UserCheck } from 'lucide-react';
import { AnimatedCard } from '@/components/ui/animated-card';
import { CardHeader, CardContent } from '@/components/ui/card';

const features = [
  {
    icon: LockKeyhole,
    title: 'End-to-End Encryption',
    description: 'All form responses are encrypted and can only be decrypted by authorized parties.',
  },
  {
    icon: Shield,
    title: 'Decentralized Storage',
    description: 'Form data is stored in a decentralized network, not on vulnerable centralized servers.',
  },
  {
    icon: UserCheck,
    title: 'NFT-Based Access',
    description: 'Control who can fill out your forms by requiring specific NFT ownership or whitelisted addresses.',
  },
];

const Features = () => {
  return (
    <div className="py-16">
      <div className="text-center max-w-3xl mx-auto mb-16">
        <h2 className="text-3xl font-bold mb-4">No More Data Leaks</h2>
        <p className="text-lg text-muted-foreground">
          With WhisperBox's end-to-end encryption and decentralized storage, your form data never touches a centralized server. Only you and your respondents have access to the data.
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {features.map((feature, index) => (
          <AnimatedCard 
            key={feature.title} 
            delay={0.1 * index}
            className="bg-background border border-border"
          >
            <CardHeader>
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
                <feature.icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold">{feature.title}</h3>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">{feature.description}</p>
            </CardContent>
          </AnimatedCard>
        ))}
      </div>
    </div>
  );
};

export default Features;
