# Guide Frontend - Workflow d'inscription et vérification email

Ce document décrit comment intégrer le workflow d'inscription et de vérification email depuis le frontend.

## 📋 Table des matières

1. [Vue d'ensemble du workflow](#vue-densemble-du-workflow)
2. [Endpoints disponibles](#endpoints-disponibles)
3. [Workflow étape par étape](#workflow-étape-par-étape)
4. [Exemples de code](#exemples-de-code)
5. [Gestion des erreurs](#gestion-des-erreurs)

---

## Vue d'ensemble du workflow

```
1. Inscription (POST /api/auth/register)
   ↓
2. Email de vérification envoyé (automatique)
   ↓
3. Utilisateur clique sur le lien dans l'email
   ↓
4. Vérification email (GET /api/auth/verify-email?token=...)
   ↓
5. Compte activé → Utilisateur peut se connecter
   ↓
6. Connexion (POST /api/auth/login)
```

**Alternative** : Si l'utilisateur ne reçoit pas l'email :
- Utiliser `POST /api/auth/resend-verification` pour renvoyer l'email

---

## Endpoints disponibles

### Base URL
```
http://localhost:3000/api
```

### 1. Inscription - `POST /api/auth/register`

**Description** : Crée un nouveau compte utilisateur (non activé)

**Headers** :
```json
{
  "Content-Type": "application/json"
}
```

**Body** :
```json
{
  "email": "user@example.com",
  "password": "MotDePasse123",
  "firstName": "John",
  "lastName": "Doe",
  "username": "johndoe",
  "dateOfBirth": "1990-01-01",
  "country": "France"
}
```

**Validation** :
- `email` : Format email valide, requis, unique
- `password` : Minimum 8 caractères, requis
- `firstName` : String, requis
- `lastName` : String, requis
- `username` : 3-30 caractères, lettres/chiffres/._-, requis, unique
- `dateOfBirth` : Format ISO 8601 (YYYY-MM-DD), requis
- `country` : String, requis

**Réponse succès (201 Created)** :
```json
{
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "username": "johndoe",
    "firstName": "John",
    "lastName": "Doe",
    "dateOfBirth": "1990-01-01T00:00:00.000Z",
    "country": "France",
    "isActive": false,
    "emailVerified": false,
    "emailVerificationToken": "token_hex_64_chars",
    "emailVerificationTokenExpiresAt": "2025-11-10T18:17:27.796Z",
    "role": "user",
    "createdAt": "2025-11-09T18:17:27.802Z",
    "updatedAt": "2025-11-09T18:17:27.802Z"
  },
  "statusCode": 201,
  "message": "Success",
  "timestamp": "2025-11-09T18:17:28.160Z"
}
```

**Réponses d'erreur** :

**409 Conflict - Email déjà utilisé** :
```json
{
  "statusCode": 409,
  "message": "User with this email already exists",
  "timestamp": "2025-11-09T18:17:28.160Z",
  "path": "/api/auth/register"
}
```

**409 Conflict - Username déjà utilisé** :
```json
{
  "statusCode": 409,
  "message": "Username already taken",
  "timestamp": "2025-11-09T18:17:28.160Z",
  "path": "/api/auth/register"
}
```

**400 Bad Request - Validation échouée** :
```json
{
  "statusCode": 400,
  "message": "email must be an email; Password must be at least 8 characters long; firstName should not be empty; ...",
  "timestamp": "2025-11-09T18:17:28.160Z",
  "path": "/api/auth/register"
}
```

---

### 2. Vérification email - `GET /api/auth/verify-email`

**Description** : Active le compte utilisateur avec le token reçu par email

**URL** :
```
GET /api/auth/verify-email?token=TOKEN_HEX_64_CHARS
```

**Query Parameters** :
- `token` (requis) : Token de vérification (64 caractères hexadécimaux)

**Réponse succès (200 OK)** :
```json
{
  "data": {
    "message": "Email verified successfully"
  },
  "statusCode": 200,
  "message": "Success",
  "timestamp": "2025-11-09T18:17:28.160Z"
}
```

**Réponses d'erreur** :

**400 Bad Request - Token manquant** :
```json
{
  "statusCode": 400,
  "message": "Token is required",
  "timestamp": "2025-11-09T18:17:28.160Z",
  "path": "/api/auth/verify-email"
}
```

**400 Bad Request - Token invalide** :
```json
{
  "statusCode": 400,
  "message": "Invalid token",
  "timestamp": "2025-11-09T18:17:28.160Z",
  "path": "/api/auth/verify-email"
}
```

**400 Bad Request - Token expiré** :
```json
{
  "statusCode": 400,
  "message": "Token expired",
  "timestamp": "2025-11-09T18:17:28.160Z",
  "path": "/api/auth/verify-email"
}
```

---

### 3. Renvoi de vérification - `POST /api/auth/resend-verification`

**Description** : Renvoie un nouvel email de vérification

**Headers** :
```json
{
  "Content-Type": "application/json"
}
```

**Body** :
```json
{
  "email": "user@example.com"
}
```

**Réponse succès (200 OK)** :
```json
{
  "data": {
    "message": "Verification email resent"
  },
  "statusCode": 200,
  "message": "Success",
  "timestamp": "2025-11-09T18:17:28.160Z"
}
```

**Réponses** :

**200 OK - Email déjà vérifié** :
```json
{
  "data": {
    "message": "Email already verified"
  },
  "statusCode": 200,
  "message": "Success",
  "timestamp": "2025-11-09T18:17:28.160Z"
}
```

**200 OK - Si l'utilisateur n'existe pas** (sécurité : ne révèle pas l'existence) :
```json
{
  "data": {
    "message": "If an account exists, a verification email was sent"
  },
  "statusCode": 200,
  "message": "Success",
  "timestamp": "2025-11-09T18:17:28.160Z"
}
```

---

### 4. Connexion - `POST /api/auth/login`

**Description** : Connecte un utilisateur vérifié

**Headers** :
```json
{
  "Content-Type": "application/json"
}
```

**Body** :
```json
{
  "email": "user@example.com",
  "password": "MotDePasse123"
}
```

**Réponse succès (200 OK)** :
```json
{
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "user"
    }
  },
  "statusCode": 200,
  "message": "Success",
  "timestamp": "2025-11-09T18:17:28.160Z"
}
```

**Réponses d'erreur** :

**401 Unauthorized - Identifiants invalides** :
```json
{
  "statusCode": 401,
  "message": "Invalid credentials",
  "timestamp": "2025-11-09T18:17:28.160Z",
  "path": "/api/auth/login"
}
```

**401 Unauthorized - Email non vérifié** :
```json
{
  "statusCode": 401,
  "message": "Email not verified",
  "timestamp": "2025-11-09T18:17:28.160Z",
  "path": "/api/auth/login"
}
```

**401 Unauthorized - Compte inactif** :
```json
{
  "statusCode": 401,
  "message": "Account is not active",
  "timestamp": "2025-11-09T18:17:28.160Z",
  "path": "/api/auth/login"
}
```

---

## Workflow étape par étape

### Étape 1 : Page d'inscription

**Composant** : `RegisterForm.vue` / `RegisterForm.tsx` / etc.

1. Afficher le formulaire avec les champs :
   - Email
   - Password (avec indicateur de force)
   - First Name
   - Last Name
   - Username
   - Date of Birth (date picker)
   - Country (select/dropdown)

2. Validation côté client :
   - Email format valide
   - Password ≥ 8 caractères
   - Username : 3-30 caractères, format valide
   - Tous les champs requis remplis

3. Soumission :
   ```javascript
   const response = await fetch('http://localhost:3000/api/auth/register', {
     method: 'POST',
     headers: {
       'Content-Type': 'application/json',
     },
     body: JSON.stringify({
       email: formData.email,
       password: formData.password,
       firstName: formData.firstName,
       lastName: formData.lastName,
       username: formData.username,
       dateOfBirth: formData.dateOfBirth, // Format: YYYY-MM-DD
       country: formData.country,
     }),
   });
   ```

4. Gestion de la réponse :
   - **201** : Afficher message de succès + rediriger vers page "Vérifiez votre email"
   - **409** : Afficher erreur (email/username déjà utilisé)
   - **400** : Afficher erreurs de validation

### Étape 2 : Page "Vérifiez votre email"

**Composant** : `CheckEmail.vue` / `CheckEmail.tsx`

1. Afficher message :
   ```
   "Un email de vérification a été envoyé à [email].
   Cliquez sur le lien dans l'email pour activer votre compte."
   ```

2. Bouton "Renvoyer l'email" :
   ```javascript
   const resendEmail = async () => {
     const response = await fetch('http://localhost:3000/api/auth/resend-verification', {
       method: 'POST',
       headers: {
         'Content-Type': 'application/json',
       },
       body: JSON.stringify({
         email: userEmail, // Récupéré depuis le state/localStorage
       }),
     });
     
     if (response.ok) {
       // Afficher message de succès
       showMessage('Email renvoyé avec succès');
     }
   };
   ```

### Étape 3 : Page de vérification (lien dans l'email)

**Composant** : `VerifyEmail.vue` / `VerifyEmail.tsx`

1. Récupérer le token depuis l'URL :
   ```javascript
   const urlParams = new URLSearchParams(window.location.search);
   const token = urlParams.get('token');
   ```

2. Appeler l'API :
   ```javascript
   const verifyEmail = async (token) => {
     const response = await fetch(`http://localhost:3000/api/auth/verify-email?token=${token}`, {
       method: 'GET',
     });
     
     const data = await response.json();
     
     if (response.ok) {
       // Afficher message de succès
       // Rediriger vers page de connexion
       router.push('/login');
     } else {
       // Afficher erreur
       if (data.message === 'Token expired') {
         // Proposer de renvoyer l'email
       } else {
         // Afficher erreur générique
       }
     }
   };
   ```

3. Gestion des erreurs :
   - **Token expiré** : Proposer de renvoyer l'email
   - **Token invalide** : Afficher message d'erreur

### Étape 4 : Page de connexion

**Composant** : `LoginForm.vue` / `LoginForm.tsx`

1. Formulaire :
   - Email
   - Password

2. Soumission :
   ```javascript
   const login = async () => {
     const response = await fetch('http://localhost:3000/api/auth/login', {
       method: 'POST',
       headers: {
         'Content-Type': 'application/json',
       },
       body: JSON.stringify({
         email: formData.email,
         password: formData.password,
       }),
     });
     
     const data = await response.json();
     
     if (response.ok) {
       // Stocker le token
       localStorage.setItem('access_token', data.data.access_token);
       localStorage.setItem('user', JSON.stringify(data.data.user));
       
       // Rediriger vers dashboard
       router.push('/dashboard');
     } else {
       // Gérer les erreurs
       if (data.message === 'Email not verified') {
         // Afficher message + lien pour renvoyer l'email
       } else {
         // Afficher erreur générique
       }
     }
   };
   ```

---

## Exemples de code

### React / Vue / Angular - Service d'authentification

```typescript
// auth.service.ts
const API_BASE_URL = 'http://localhost:3000/api';

export class AuthService {
  // Inscription
  async register(userData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    username: string;
    dateOfBirth: string; // YYYY-MM-DD
    country: string;
  }) {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Erreur lors de l\'inscription');
    }
    
    return data.data;
  }
  
  // Vérification email
  async verifyEmail(token: string) {
    const response = await fetch(`${API_BASE_URL}/auth/verify-email?token=${token}`, {
      method: 'GET',
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Erreur lors de la vérification');
    }
    
    return data.data;
  }
  
  // Renvoyer email de vérification
  async resendVerification(email: string) {
    const response = await fetch(`${API_BASE_URL}/auth/resend-verification`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Erreur lors du renvoi');
    }
    
    return data.data;
  }
  
  // Connexion
  async login(email: string, password: string) {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Erreur lors de la connexion');
    }
    
    // Stocker le token
    localStorage.setItem('access_token', data.data.access_token);
    localStorage.setItem('user', JSON.stringify(data.data.user));
    
    return data.data;
  }
}
```

### Exemple React Hook

```typescript
// useAuth.ts
import { useState } from 'react';
import { AuthService } from './auth.service';

export const useAuth = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const authService = new AuthService();
  
  const register = async (userData: RegisterData) => {
    setLoading(true);
    setError(null);
    try {
      const result = await authService.register(userData);
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };
  
  const verifyEmail = async (token: string) => {
    setLoading(true);
    setError(null);
    try {
      const result = await authService.verifyEmail(token);
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };
  
  return {
    register,
    verifyEmail,
    loading,
    error,
  };
};
```

---

## Gestion des erreurs

### Codes de statut HTTP

| Code | Signification | Action recommandée |
|------|---------------|---------------------|
| 200 | Succès | Continuer le workflow |
| 201 | Créé | Rediriger vers page de vérification |
| 400 | Requête invalide | Afficher erreurs de validation |
| 401 | Non autorisé | Vérifier email/password ou état du compte |
| 409 | Conflit | Email/username déjà utilisé |
| 500 | Erreur serveur | Afficher message générique, réessayer plus tard |

### Messages d'erreur courants

```typescript
const ERROR_MESSAGES = {
  'User with this email already exists': 'Cet email est déjà utilisé',
  'Username already taken': 'Ce nom d\'utilisateur est déjà pris',
  'Email not verified': 'Veuillez vérifier votre email avant de vous connecter',
  'Invalid credentials': 'Email ou mot de passe incorrect',
  'Token expired': 'Le lien de vérification a expiré',
  'Invalid token': 'Lien de vérification invalide',
};
```

---

## Configuration

### Variables d'environnement frontend

```env
VITE_API_BASE_URL=http://localhost:3000/api
# ou
REACT_APP_API_BASE_URL=http://localhost:3000/api
```

### Intercepteur Axios (exemple)

```typescript
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api',
});

// Ajouter le token aux requêtes authentifiées
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
```

---

## Checklist d'intégration

- [ ] Page d'inscription avec tous les champs requis
- [ ] Validation côté client
- [ ] Gestion des erreurs (409, 400)
- [ ] Page "Vérifiez votre email"
- [ ] Bouton "Renvoyer l'email"
- [ ] Page de vérification (lien dans email)
- [ ] Gestion token expiré/invalide
- [ ] Page de connexion
- [ ] Gestion erreur "Email not verified"
- [ ] Stockage du token JWT
- [ ] Redirections appropriées
- [ ] Messages d'erreur traduits/compréhensibles

---

## Notes importantes

1. **Format de date** : Toujours utiliser `YYYY-MM-DD` pour `dateOfBirth`
2. **Token de vérification** : Valide 24 heures
3. **Sécurité** : Ne jamais exposer le token dans les logs frontend
4. **UX** : Toujours proposer de renvoyer l'email si le token expire
5. **CORS** : S'assurer que le backend autorise les requêtes depuis le frontend

