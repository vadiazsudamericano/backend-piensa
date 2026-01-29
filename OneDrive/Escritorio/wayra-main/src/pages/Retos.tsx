import React from 'react';
import { IonContent, IonPage, IonIcon } from '@ionic/react';
import { play } from 'ionicons/icons';
import { motion } from 'framer-motion';
import './Retos.css';

const Retos: React.FC = () => {
  const niveles = [
    { id: 1, titulo: 'Nivel Principiante', img: '/assets/jaguar_hola.png', color: '#a3e4d7' },
    { id: 2, titulo: 'Nivel Intermedio', img: '/assets/jaguar_cool.png', color: '#7289da' },
    { id: 3, titulo: 'Nivel Avanzado', img: '/assets/jaguar_pro.png', color: '#c3aef5' }
  ];

  return (
    <IonPage>
      <IonContent fullscreen className="retos-bg">
        <div className="retos-header">
          <h1>Desafíos de la Manada</h1>
          <p>Supera los niveles y demuestra tu poder</p>
        </div>

        <div className="retos-list">
          {niveles.map((nivel, index) => (
            <motion.div 
              key={nivel.id}
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.2 }}
              className="reto-card"
            >
              <div className="reto-info">
                <div className="play-button-glass">
                  <IonIcon icon={play} />
                </div>
                <h2>{nivel.titulo}</h2>
              </div>
              <div className="reto-visual">
                <img src={nivel.img} alt={nivel.titulo} className="jaguar-badge" />
                <div className="bg-glow" style={{ backgroundColor: nivel.color }}></div>
              </div>
            </motion.div>
          ))}
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Retos;