
import React from 'react';
import Layout from '@/components/Layout';
import Hero from '@/components/home/Hero';
import Features from '@/components/home/Features';
import CallToAction from '@/components/home/CallToAction';

const Index = () => {
  return (
    <Layout>
      <div className="px-4 sm:px-6 lg:px-8 pt-28 pb-16">
        <div className="max-w-7xl mx-auto">
          {/* Hero Section */}
          <Hero />
          
          {/* Feature Section */}
          <Features />
          
          {/* CTA Section */}
          <CallToAction />
        </div>
      </div>
    </Layout>
  );
};

export default Index;
