import React, { useState, useEffect } from 'react';
import { 
  IonPage, IonContent, IonInput, IonButton, IonIcon, 
  IonItem, IonToast, IonSpinner, IonButtons, IonBackButton, IonHeader, IonToolbar 
} from '@ionic/react';
import { 
  mailOutline, 
  lockClosedOutline, 
  personAddOutline,
  logoGoogle,
  logoFacebook 
} from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { AuthService } from '../services/authService';
import { auth } from '../services/firebaseConfig';
import './Login.css'; 

const Register: React.FC = () => {
  const history = useHistory();
  
  const [wayraMood, setWayraMood] = useState('👋'); 
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  // ✅ ESCUCHA GLOBAL DE AUTENTICACIÓN
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setWayraMood('🎉');
        const timer = setTimeout(() => {
          history.replace('/home');
        }, 800);
        return () => clearTimeout(timer);
      }
    });
    return () => unsubscribe();
  }, [history]);

  // REGISTRO CON EMAIL
  const handleRegister = async () => {
    if (!email.trim() || !password.trim()) {
      setWayraMood('🤔');
      setMessage("Por favor llena todos los campos 🐆");
      return;
    }
    if (password.length < 6) {
      setWayraMood('😰');
      setMessage("La contraseña debe tener al menos 6 caracteres");
      return;
    }

    setLoading(true);
    setWayraMood('🤞');
    const result = await AuthService.register(email, password);
    if (!result.success) {
      setLoading(false);
      setWayraMood('😢');
      setMessage(result.error || "Error al crear cuenta");
    }
  };

  // REGISTRO/LOGIN CON GOOGLE
  const handleGoogleAuth = async () => {
    setLoading(true);
    setWayraMood('🤔');
    const result = await AuthService.loginWithGoogle();
    if (!result.success) {
      setLoading(false);
      setWayraMood('😢');
      setMessage("No pudimos conectar con Google");
    }
  };

  // REGISTRO/LOGIN CON FACEBOOK
  const handleFacebookAuth = async () => {
    setLoading(true);
    const result = await AuthService.loginFacebook();
    if (!result.success) {
      setLoading(false);
      setMessage("Error con Facebook");
    }
  };

  return (
    <IonPage>
      <IonHeader className="ion-no-border">
        <IonToolbar style={{ '--background': 'transparent' }}>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/login" color="light" text="Volver" />
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen>
        <div className="wayra-gradient-bg"></div>
        <div className="bg-circle c1"></div>
        <div className="bg-circle c2"></div>

        <div className="login-container" style={{ paddingTop: '0' }}>
          
          <div className="mascot-area">
            <div className="mascot-glow"></div>
            <div className="mascot-emoji">{wayraMood}</div>
          </div>

          <div className="app-title" style={{ fontSize: '2rem' }}>
            Únete a <span className="kichwa-highlight">Wayra</span>
          </div>

          <div style={{ width: '100%', maxWidth: '350px', zIndex: 10 }}>
            
            <IonItem lines="none" className="custom-input-item">
              <IonIcon icon={mailOutline} slot="start" />
              <IonInput
                placeholder="Tu correo electrónico"
                type="email"
                value={email}
                onIonInput={(e) => setEmail(e.detail.value ?? '')}
              />
            </IonItem>

            <IonItem lines="none" className="custom-input-item">
              <IonIcon icon={lockClosedOutline} slot="start" />
              <IonInput
                placeholder="Crea una contraseña"
                type="password"
                value={password}
                onIonInput={(e) => setPassword(e.detail.value ?? '')}
              />
            </IonItem>

            <IonButton
              expand="block"
              className="btn-3d"
              onClick={handleRegister}
              disabled={loading}
              style={{ marginTop: '1.5rem' }}
            >
              {loading ? <IonSpinner name="crescent" /> : (
                <>
                  <IonIcon icon={personAddOutline} slot="start" style={{marginRight: '8px'}} />
                  CREAR CUENTA
                </>
              )}
            </IonButton>

            <div style={{ textAlign: 'center', margin: '1.5rem 0', color: '#fff', fontSize: '0.9rem' }}>
              ─── o regístrate con ───
            </div>

            {/* BOTONES SOCIALES ACTUALIZADOS */}
            <div style={{ display: 'flex', gap: '10px' }}>
              <IonButton 
                expand="block" 
                color="light" 
                style={{ flex: 1 }}
                onClick={handleGoogleAuth}
                disabled={loading}
              >
                <IonIcon icon={logoGoogle} />
              </IonButton>

              <IonButton 
                expand="block" 
                color="light" 
                style={{ flex: 1 }}
                onClick={handleFacebookAuth}
                disabled={loading}
              >
                <IonIcon icon={logoFacebook} />
              </IonButton>
            </div>

          </div>
        </div>

        <IonToast
          isOpen={!!message}
          message={message || ""}
          duration={3000}
          onDidDismiss={() => setMessage(null)}
          color={wayraMood === '🎉' ? 'success' : 'danger'}
          position="top"
        />
      </IonContent>
    </IonPage>
  );
};

export default Register;