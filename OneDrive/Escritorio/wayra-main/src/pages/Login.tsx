import React, { useState, useEffect } from 'react';
import {
  IonPage,
  IonContent,
  IonInput,
  IonButton,
  IonIcon,
  IonItem,
  IonToast,
  IonSpinner
} from '@ionic/react';
import {
  mailOutline,
  lockClosedOutline,
  logoGoogle,
  logoFacebook
} from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';

// Asegúrate de que estas rutas sean correctas según tu carpeta
import { AuthService } from '../services/authService'; 
import { auth } from '../services/firebaseConfig';

import './Login.css';

const Login: React.FC = () => {
  const history = useHistory();

  // Estados
  const [wayraMood, setWayraMood] = useState('😊');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  // ✅ 1. ESCUCHA GLOBAL DE AUTENTICACIÓN
  // Este useEffect es el que realmente te sacará de aquí cuando Firebase confirme el usuario
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setWayraMood('🤩'); // Mood de éxito
        setLoading(false);
        // Pequeño delay para que la animación se vea antes de cambiar de página
        const timer = setTimeout(() => {
          history.replace('/home');
        }, 800);
        return () => clearTimeout(timer);
      }
    });
    return () => unsubscribe();
  }, [history]);

  // ✅ 2. ANIMACIÓN NATURAL DE WAYRA (Parpadeo)
  useEffect(() => {
    const blinkInterval = setInterval(() => {
      if (wayraMood === '😊') {
        setWayraMood('😌');
        setTimeout(() => setWayraMood('😊'), 200);
      }
    }, 3000);
    return () => clearInterval(blinkInterval);
  }, [wayraMood]);

  // ✅ 3. LOGIN CON EMAIL
  const handleLogin = async () => {
    if (!email || !password) {
      setWayraMood('😢');
      setMessage('¡Uy! Faltan datos 🐆');
      return;
    }

    setLoading(true);
    setWayraMood('🤔');

    const result = await AuthService.loginEmail(email, password);

    if (!result.success) {
      setLoading(false);
      setWayraMood('😢');
      setMessage(result.error || 'Error al iniciar sesión');
    }
    // Si tiene éxito, onAuthStateChanged se activa automáticamente
  };

  // ✅ 4. LOGIN CON GOOGLE
  const handleGoogleLogin = async () => {
    setLoading(true);
    setWayraMood('🤔');
    
    const result = await AuthService.loginWithGoogle();
    
    if (!result.success) {
      setLoading(false);
      setWayraMood('😢');
      setMessage('No pudimos conectar con Google 🐆');
    }
  };

  // ✅ 5. LOGIN CON FACEBOOK
  const handleFacebookLogin = async () => {
    setLoading(true);
    const result = await AuthService.loginFacebook();
    
    if (!result.success) {
      setLoading(false);
      setMessage('Error con Facebook');
    }
  };

  return (
    <IonPage>
      <IonContent fullscreen>
        {/* Fondo decorativo */}
        <div className="wayra-gradient-bg"></div>
        <div className="bg-circle c1"></div>
        <div className="bg-circle c2"></div>

        <div className="login-container">
          {/* Mascota Wayra */}
          <div className="mascot-area">
            <div className="mascot-glow"></div>
            <div className="mascot-emoji">{wayraMood}</div>
          </div>

          <div className="app-title">
            Wayra <span className="kichwa-highlight">Kichwa</span>
          </div>

          <div style={{ width: '100%', maxWidth: '350px', zIndex: 10 }}>
            {/* Formulario */}
            <IonItem lines="none" className="custom-input-item">
              <IonIcon icon={mailOutline} slot="start" />
              <IonInput
                type="email"
                placeholder="Correo electrónico"
                value={email}
                onIonChange={e => setEmail(e.detail.value!)}
              />
            </IonItem>

            <IonItem lines="none" className="custom-input-item">
              <IonIcon icon={lockClosedOutline} slot="start" />
              <IonInput
                type="password"
                placeholder="Contraseña"
                value={password}
                onIonChange={e => setPassword(e.detail.value!)}
              />
            </IonItem>

            <IonButton
              expand="block"
              className="btn-3d"
              onClick={handleLogin}
              disabled={loading}
            >
              {loading ? <IonSpinner name="crescent" /> : 'INICIAR SESIÓN'}
            </IonButton>

            <div className="divider-text" style={{ textAlign: 'center', margin: '1rem 0', color: '#fff' }}>
              ─── o ingresa con ───
            </div>

            {/* Botones Sociales */}
            <div style={{ display: 'flex', gap: '10px' }}>
              <IonButton 
                expand="block" 
                color="light" 
                style={{ flex: 1 }}
                onClick={handleGoogleLogin}
                disabled={loading}
              >
                <IonIcon icon={logoGoogle} />
              </IonButton>

              <IonButton 
                expand="block" 
                color="light" 
                style={{ flex: 1 }}
                onClick={handleFacebookLogin}
                disabled={loading}
              >
                <IonIcon icon={logoFacebook} />
              </IonButton>
            </div>

            <div
              className="footer-link"
              style={{
                textAlign: 'center',
                marginTop: '1.5rem',
                color: 'white',
                cursor: 'pointer'
              }}
              onClick={() => history.push('/register')}
            >
              ¿No tienes cuenta? <strong>Regístrate aquí</strong>
            </div>
          </div>
        </div>

        <IonToast
          isOpen={!!message}
          message={message || ''}
          duration={2500}
          onDidDismiss={() => setMessage(null)}
          position="top"
          className="custom-toast"
        />
      </IonContent>
    </IonPage>
  );
};

export default Login;