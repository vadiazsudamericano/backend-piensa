import React from 'react';
import { IonContent, IonPage, IonIcon } from '@ionic/react';
import { flash, star, personCircle } from 'ionicons/icons';
import './Home.css';

// Importación de imágenes desde src/assets
import fondoImg from '../assets/fondos/fondo.png';
import arbolesImg from '../assets/fondos/arboles.png';
import plantasImg from '../assets/fondos/plantas_cercanas.png';
import wayraImg from '../assets/wayra/wayra.png';

const Home: React.FC = () => {
  return (
    <IonPage>
      <IonContent fullscreen scrollEvents={true}>
        <div className="forest-scene-container">
          
          {/* CAPAS DE FONDO - PARALLAX */}
          <div className="parallax-layer bg-sky"><img src={fondoImg} alt="sky" /></div>
          <div className="parallax-layer bg-trees"><img src={arbolesImg} alt="trees" /></div>
          <div className="parallax-layer bg-plants"><img src={plantasImg} alt="plants" /></div>

          {/* CONTENIDO DESPLAZABLE */}
          <div className="foreground-scroll-content">
            
            {/* 1. HEADER DE STATS */}
            <div className="top-stats-row">
              <div className="level-info-card">
                <span className="lvl-text">Nivel Básico 1</span>
                <div className="mini-progress-bar">
                  <div className="fill" style={{ width: '35%' }}></div>
                </div>
              </div>
              <div className="currency-row">
                <div className="stat-pill racha">
                  <IonIcon icon={flash} /> <span>7</span>
                </div>
                <div className="stat-pill xp">
                  <IonIcon icon={star} /> <span>1250 XP</span>
                </div>
                <div className="profile-btn-circle">
                   <IonIcon icon={personCircle} />
                </div>
              </div>
            </div>

            {/* 2. BANNER DE UNIDAD */}
            <div className="unit-floating-card">
              <h3 className="unit-label">UNIDAD 1</h3>
              <h1 className="unit-title">Saludos y Presentación</h1>
            </div>

            {/* 3. CAMINO DE NIVELES */}
            <div className="path-container-main">
              <svg className="dotted-line-svg" viewBox="0 0 100 800" preserveAspectRatio="none">
                <path 
                  d="M50,0 Q85,200 50,400 T50,800" 
                  fill="none" stroke="white" strokeWidth="3" strokeDasharray="10,10" opacity="0.5"
                />
              </svg>

              <div className="nodes-list">
                <LevelNode icon="🔒" label="Familia" pos="node-p1" locked />
                <LevelNode icon="🔒" label="Comida" pos="node-p2" locked />
                <LevelNode icon="🔒" label="Examen" pos="node-p3" locked />
                
                {/* 4. NODO ACTIVO CON EL JAGUAR WAYRA */}
                <div className="node-wrapper node-active">
                  <div className="active-character-node">
                    <img 
                      src={wayraImg} 
                      alt="Jaguar" 
                      className="jaguar-node-img" 
                    />
                    <div className="node-glow-ring"></div>
                  </div>
                  <div className="node-speech-bubble">
                     <span className="bubble-title">Saludos</span>
                     <p>¡Alli Puncha! ¿Listo para aprender?</p>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </IonContent>
    </IonPage>
  );
};

// Componente reutilizable para los nodos
const LevelNode: React.FC<{icon: any, label: string, pos: string, locked?: boolean}> = ({icon, label, pos, locked}) => (
  <div className={`node-wrapper ${pos}`}>
    <div className={`glass-node ${locked ? 'locked' : ''}`}>
      {icon}
    </div>
    <span className="node-label-small">{label}</span>
  </div>
);

export default Home;