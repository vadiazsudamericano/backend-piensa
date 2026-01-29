// src/App.tsx
import { Redirect, Route } from 'react-router-dom';
import { IonApp, IonRouterOutlet, IonTabs, setupIonicReact } from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';

/* Core CSS required for Ionic components to work properly */
import '@ionic/react/css/core.css';

/* Basic CSS for apps built with Ionic */
import '@ionic/react/css/normalize.css';
import '@ionic/react/css/structure.css';
import '@ionic/react/css/typography.css';

/* Theme variables */
import './theme/variables.css';

// Importamos nuestras páginas
import Login from './pages/Login';
import Home from './pages/Home'; 
import Register from './pages/Register';
import Retos from './pages/Retos';
import Perfil from './pages/Perfil';

// Importamos la Navbar animada
import Tabs from './components/Tabs';

setupIonicReact();

const App: React.FC = () => (
  <IonApp>
    <IonReactRouter>
      {/* Usamos IonTabs para envolver las rutas protegidas. 
        Esto mantiene la Navbar fija en la parte inferior.
      */}
      <IonTabs>
        <IonRouterOutlet>
          {/* Rutas sin Navbar (Login y Registro) */}
          <Route exact path="/login" component={Login} />
          <Route exact path="/register" component={Register} />

          {/* Rutas con Navbar (Home, Retos, Perfil) */}
          <Route exact path="/home" component={Home} />
          <Route exact path="/retos" component={Retos} />
          <Route exact path="/perfil" component={Perfil} />

          {/* Ruta por defecto */}
          <Route exact path="/">
            <Redirect to="/login" />
          </Route>
        </IonRouterOutlet>

        {/* El componente Tabs se coloca fuera del RouterOutlet pero dentro de IonTabs 
          para que sea visible en todas las rutas definidas arriba.
        */}
        <Tabs />
      </IonTabs>
    </IonReactRouter>
  </IonApp>
);

export default App;