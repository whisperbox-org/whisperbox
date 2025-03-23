import React, { useEffect } from 'react';
import Navbar from './Navbar';
import { AnimatePresence, motion } from 'framer-motion';
import { useLocation, useParams } from 'react-router-dom';
import { useFormResponseNotifications } from '@/hooks/useFormResponseNotifications';
import { useWakuContext } from '@/hooks/useWakuHooks';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
  const { id } = useParams<{ id: string }>();
  const {client} = useWakuContext()
 

  useFormResponseNotifications();
  
  const pageVariants = {
    initial: {
      opacity: 0,
      y: 10,
    },
    in: {
      opacity: 1,
      y: 0,
    },
    out: {
      opacity: 0,
      y: -10,
    },
  };

  const pageTransition = {
    type: 'tween',
    ease: 'anticipate',
    duration: 0.5,
  };

  useEffect(() => {
    if (!client ) return

    console.log("Setting the id!!!!")
    client.setCurrentFormId(id)
  }, [client, id])

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <AnimatePresence mode="wait">
        <motion.main
          key={location.pathname}
          initial="initial"
          animate="in"
          exit="out"
          variants={pageVariants}
          transition={pageTransition}
          className="flex-grow"
        >
          {children}
        </motion.main>
      </AnimatePresence>
    </div>
  );
};

export default Layout;
