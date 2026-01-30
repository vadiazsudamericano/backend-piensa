import React, { useState } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { home, trophy, book, person } from 'ionicons/icons';
import { IonIcon } from '@ionic/react';
import './Tabs.css';

const Tabs: React.FC = () => {
  const history = useHistory();
  const location = useLocation();
  
  // Mapeo de rutas para identificar cuál está activa
  const tabs = [
    { path: '/home', icon: home, label: 'Home' },
    { path: '/retos', icon: trophy, label: 'Retos' },
    { path: '/diccionario', icon: book, label: 'Diccionario' },
    { path: '/perfil', icon: person, label: 'Perfil' },
  ];

  return (
    <div className="tab-bar-container">
      <div className="tab-bar">
        {tabs.map((tab) => {
          const isActive = location.pathname === tab.path;
          return (
            <div 
              key={tab.path} 
              className="tab-item"
              onClick={() => history.push(tab.path)}
            >
              <motion.div
                initial={false}
                animate={isActive ? { y: -15, scale: 1.2 } : { y: 0, scale: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className={`icon-wrapper ${isActive ? 'active' : ''}`}
              >
                <IonIcon icon={tab.icon} />
                {isActive && <div className="active-dot" />}
              </motion.div>
              <span className={`tab-label ${isActive ? 'active' : ''}`}>
                {tab.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Tabs;