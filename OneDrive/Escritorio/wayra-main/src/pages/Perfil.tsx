import React, { useState, useEffect } from 'react';
import { IonContent, IonPage, IonIcon, IonButton } from '@ionic/react';
import { flash, star, personCircle, logOutOutline, settingsOutline } from 'ionicons/icons';
import { auth } from '../services/firebaseConfig';
import { useHistory } from 'react-router-dom';
import './Perfil.css';

const Perfil: React.FC = () => {
  const history = useHistory();
  const [userName, setUserName] = useState('Yachakuj');

  useEffect(() => {
    const user = auth.currentUser;
    if (user?.displayName) setUserName(user.displayName);
  }, []);

  const handleLogout = () => {
    auth.signOut();
    history.replace('/login');
  };

  return (
    <IonPage>
      <IonContent fullscreen className="perfil-page">
        <div className="perfil-container">
          
          <div className="perfil-header">
            <div className="avatar-wrapper">
              <IonIcon icon={personCircle} className="avatar-icon" />
              <div className="edit-badge"><IonIcon icon={settingsOutline} /></div>
            </div>
            <h1 className="user-name">{userName}</h1>
            <span className="user-tag">Estudiante de Software</span>
          </div>

          <div className="stats-grid-perfil">
            <div className="stat-item-perfil racha-bg">
              <IonIcon icon={flash} />
              <div className="stat-info">
                <strong>7</strong>
                <span>Días de Racha</span>
              </div>
            </div>
            <div className="stat-item-perfil xp-bg">
              <IonIcon icon={star} />
              <div className="stat-info">
                <strong>1250</strong>
                <span>Puntos XP</span>
              </div>
            </div>
          </div>

          <div className="menu-opciones">
            <IonButton expand="block" fill="clear" className="logout-btn" onClick={handleLogout}>
              <IonIcon slot="start" icon={logOutOutline} />
              Cerrar Sesión
            </IonButton>
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Perfil;