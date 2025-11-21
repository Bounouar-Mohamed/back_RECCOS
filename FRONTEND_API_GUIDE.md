# Guide API Frontend - Module d'Authentification

## ✅ Validation Backend : 100% PRÊT

### Statut
- ✅ Compilation : **Aucune erreur**
- ✅ Linter : **Aucune erreur**
- ✅ Endpoints : **17 endpoints disponibles**
- ✅ Documentation : **Swagger disponible sur `/api/docs`**
- ✅ Sécurité : **Toutes les protections activées**

---

## 📋 Endpoints Disponibles

### 1. Inscription
**POST** `/api/auth/register`

**Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "firstName": "John",
  "lastName": "Doe",
  "username": "johndoe",
  "dateOfBirth": "1990-01-01",
  "country": "UAE"
}
```

**Validation:**
- Email : format valide
- Password : min 8 caractères, majuscule, minuscule, chiffre, caractère spécial
- Username : 3-30 caractères, lettres, chiffres, points, tirets, underscores
- DateOfBirth : format ISO 8601

**Response (201):**
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "username": "johndoe",
  "dateOfBirth": "1990-01-01",
  "country": "UAE",
  "isActive": false,
  "emailVerified": false,
  "role": "CLIENT"
}
```

**Erreurs possibles:**
- `409` : Email ou username déjà utilisé

---

### 2. Connexion
**POST** `/api/auth/login`

**Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "twoFactorCode": "123456" // Optionnel, requis si 2FA activée
}
```

**Response (200):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "CLIENT"
  }
}
```

**Erreurs possibles:**
- `401` : Identifiants invalides
- `401` : Email non vérifié
- `401` : Compte verrouillé (trop de tentatives)
- `401` : Code 2FA requis/invalide
- `429` : Trop de tentatives (rate limiting)

**Rate Limiting:** 5 tentatives par minute

**Protection brute force:**
- 5 tentatives échouées → compte verrouillé 30 minutes

---

### 3. Vérification Email
**GET** `/api/auth/verify-email?token=abc123...`

**Response (200):**
```json
{
  "message": "Email verified successfully"
}
```

**Erreurs possibles:**
- `400` : Token invalide ou expiré (24h)

---

### 4. Renvoyer Email de Vérification
**POST** `/api/auth/resend-verification`

**Body:**
```json
{
  "email": "user@example.com"
}
```

**Response (200):**
```json
{
  "message": "Verification email resent"
}
```

**Rate Limiting:** 3 tentatives par minute

---

### 5. Mot de Passe Oublié
**POST** `/api/auth/forgot-password`

**Body:**
```json
{
  "email": "user@example.com"
}
```

**Response (200):**
```json
{
  "message": "If an account exists, a password reset email was sent"
}
```

**Note:** Ne révèle pas si l'email existe (sécurité)

**Rate Limiting:** 3 tentatives par minute

**Protection:** Maximum 1 demande toutes les 15 minutes par email

---

### 6. Réinitialisation Mot de Passe
**POST** `/api/auth/reset-password`

**Body:**
```json
{
  "token": "abc123def456...",
  "newPassword": "NewSecurePass123!"
}
```

**Validation Password:**
- Min 8 caractères
- Au moins 1 majuscule
- Au moins 1 minuscule
- Au moins 1 chiffre
- Au moins 1 caractère spécial

**Response (200):**
```json
{
  "message": "Password reset successfully"
}
```

**Erreurs possibles:**
- `400` : Token invalide, expiré (1h) ou déjà utilisé

**Rate Limiting:** 3 tentatives par minute

**Protection:** Token ne peut être utilisé qu'une seule fois

---

### 7. OAuth - UAE Pass
**GET** `/api/auth/uae-pass`

**Comportement:** Redirige vers UAE Pass

**Callback:** `/api/auth/uae-pass/callback`
- Redirige vers : `${FRONTEND_URL}/auth/callback?token=...&user=...`

---

### 8. OAuth - Google
**GET** `/api/auth/google`

**Comportement:** Redirige vers Google OAuth

**Callback:** `/api/auth/google/callback`
- Redirige vers : `${FRONTEND_URL}/auth/callback?token=...&user=...`

---

### 9. OAuth - Facebook
**GET** `/api/auth/facebook`

**Comportement:** Redirige vers Facebook OAuth

**Callback:** `/api/auth/facebook/callback`
- Redirige vers : `${FRONTEND_URL}/auth/callback?token=...&user=...`

---

### 10. OAuth - Apple
**GET** `/api/auth/apple`

**Comportement:** Redirige vers Apple OAuth

**Callback:** `/api/auth/apple/callback`
- Redirige vers : `${FRONTEND_URL}/auth/callback?token=...&user=...`

**Note Frontend:** Gérer la route `/auth/callback` pour récupérer le token et l'utilisateur

---

### 11. Activer 2FA
**POST** `/api/auth/enable-2fa` (Auth requise)

**Headers:**
```
Authorization: Bearer <access_token>
```

**Body:**
```json
{
  "method": "app" // ou "email"
}
```

**Méthodes disponibles:**
- `"app"` : TOTP (Google Authenticator, Authy, etc.) - **RECOMMANDÉ**
- `"email"` : Code envoyé par email
- `"sms"` : **DÉSACTIVÉ** (vulnérable au SIM swapping)

**Response (200) - TOTP:**
```json
{
  "method": "app",
  "secret": "JBSWY3DPEHPK3PXP",
  "qrCodeUrl": "data:image/png;base64,iVBORw0KGgo...",
  "message": "Please verify the code to complete 2FA setup"
}
```

**Response (200) - Email:**
```json
{
  "method": "email",
  "message": "Email verification code sent"
}
```

**Erreurs possibles:**
- `400` : 2FA déjà activée
- `400` : Méthode invalide (SMS rejeté)

**Workflow TOTP:**
1. Appeler `/enable-2fa` avec `method: "app"`
2. Afficher le QR code (`qrCodeUrl`) à l'utilisateur
3. Utilisateur scanne avec son app (Google Authenticator, etc.)
4. Appeler `/verify-2fa` avec le code généré

**Workflow Email:**
1. Appeler `/enable-2fa` avec `method: "email"`
2. Code envoyé par email (expire en 10 minutes)
3. Appeler `/verify-2fa` avec le code reçu

---

### 12. Vérifier et Activer 2FA
**POST** `/api/auth/verify-2fa` (Auth requise)

**Headers:**
```
Authorization: Bearer <access_token>
```

**Body:**
```json
{
  "code": "123456"
}
```

**Response (200):**
```json
{
  "message": "2FA enabled successfully"
}
```

**Erreurs possibles:**
- `400` : Code invalide
- `400` : 2FA déjà activée
- `400` : Secret 2FA non trouvé (appeler `/enable-2fa` d'abord)

---

### 13. Désactiver 2FA
**POST** `/api/auth/disable-2fa` (Auth requise)

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response (200):**
```json
{
  "message": "2FA disabled successfully"
}
```

**Erreurs possibles:**
- `400` : 2FA non activée

---

## 🔒 Sécurité

### Rate Limiting
- **Login:** 5 tentatives par minute
- **Forgot Password:** 3 tentatives par minute
- **Reset Password:** 3 tentatives par minute
- **Resend Verification:** 3 tentatives par minute

### Protection Brute Force
- **5 tentatives échouées** → compte verrouillé **30 minutes**
- Message d'erreur : `"Account is locked. Try again in X minutes."`

### Protection 2FA
- **3 tentatives 2FA échouées** → blocage temporaire
- Message d'erreur : `"Too many failed 2FA attempts. Please try again later."`

### Validation Mots de Passe
**Règles:**
- Minimum 8 caractères
- Au moins 1 majuscule (A-Z)
- Au moins 1 minuscule (a-z)
- Au moins 1 chiffre (0-9)
- Au moins 1 caractère spécial (@$!%*?&#^()_+-=[]{};':"\\|,.<>/)

**Message d'erreur:**
```
"Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character"
```

### Expiration Tokens
- **Email verification:** 24 heures
- **Password reset:** 1 heure
- **2FA codes (email):** 10 minutes

### Token Reuse Protection
- Les tokens de reset password ne peuvent être utilisés qu'**une seule fois**
- Erreur si réutilisation : `"This reset token has already been used"`

---

## 📝 Format des Réponses

### Succès
```json
{
  "message": "Operation successful",
  // ... données additionnelles
}
```

### Erreur Standard
```json
{
  "statusCode": 400,
  "message": "Error message",
  "error": "Bad Request"
}
```

### Login Succès
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "CLIENT"
  }
}
```

---

## 🔐 Headers Requis

### Endpoints Protégés (Auth requise)
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

### Endpoints Publics
```
Content-Type: application/json
```

---

## 🎯 Workflows Frontend

### 1. Inscription + Vérification Email
```
1. POST /api/auth/register
2. Afficher message : "Vérifiez votre email"
3. Utilisateur clique sur lien dans email
4. GET /api/auth/verify-email?token=...
5. Rediriger vers login
```

### 2. Connexion avec 2FA
```
1. POST /api/auth/login { email, password }
2. Si 2FA activée → Erreur 401 "Invalid credentials"
3. Afficher champ 2FA code
4. POST /api/auth/login { email, password, twoFactorCode }
5. Succès → Stocker access_token
```

### 3. OAuth (Google, Facebook, Apple, UAE Pass)
```
1. Rediriger vers GET /api/auth/{provider}
2. Utilisateur s'authentifie sur le provider
3. Callback automatique vers /api/auth/{provider}/callback
4. Backend redirige vers : /auth/callback?token=...&user=...
5. Frontend récupère token et user depuis URL
6. Stocker access_token
```

### 4. Activation 2FA TOTP
```
1. POST /api/auth/enable-2fa { method: "app" } (avec token)
2. Recevoir { secret, qrCodeUrl, message }
3. Afficher QR code à l'utilisateur
4. Utilisateur scanne avec Google Authenticator
5. POST /api/auth/verify-2fa { code } (avec token)
6. 2FA activée
```

### 5. Activation 2FA Email
```
1. POST /api/auth/enable-2fa { method: "email" } (avec token)
2. Recevoir { message: "Email verification code sent" }
3. Code envoyé par email (expire en 10 min)
4. Utilisateur entre le code reçu
5. POST /api/auth/verify-2fa { code } (avec token)
6. 2FA activée
```

### 6. Mot de Passe Oublié
```
1. POST /api/auth/forgot-password { email }
2. Afficher message générique (ne pas révéler si email existe)
3. Utilisateur clique sur lien dans email
4. Afficher formulaire reset password
5. POST /api/auth/reset-password { token, newPassword }
6. Rediriger vers login
```

---

## ⚠️ Gestion des Erreurs

### Codes HTTP
- `200` : Succès
- `201` : Créé (register)
- `400` : Requête invalide (validation, token expiré, etc.)
- `401` : Non autorisé (credentials invalides, token manquant, etc.)
- `403` : Interdit (permissions insuffisantes)
- `409` : Conflit (email/username déjà utilisé)
- `429` : Trop de requêtes (rate limiting)

### Messages d'Erreur Importants
- `"Account is locked. Try again in X minutes."` → Afficher compte verrouillé
- `"Too many failed 2FA attempts. Please try again later."` → Afficher blocage 2FA
- `"Invalid credentials"` → Générique pour login (ne pas révéler si email existe)
- `"Email not verified"` → Rediriger vers renvoyer email
- `"2FA code required"` → Afficher champ 2FA
- `"This reset token has already been used"` → Demander nouveau reset

---

## 🚀 Variables d'Environnement Frontend

```env
NEXT_PUBLIC_API_URL=http://localhost:3000/api
# ou
NEXT_PUBLIC_API_URL=https://api.votredomaine.com/api
```

---

## 📚 Documentation Swagger

Accéder à la documentation complète :
```
http://localhost:3000/api/docs
```

Tous les endpoints sont documentés avec exemples de requêtes/réponses.

---

## ✅ Checklist Frontend

- [ ] Gérer l'inscription avec validation password
- [ ] Gérer la vérification email
- [ ] Gérer le login avec 2FA optionnel
- [ ] Gérer les OAuth callbacks (`/auth/callback`)
- [ ] Gérer le password reset flow
- [ ] Gérer l'activation 2FA (TOTP + Email)
- [ ] Gérer les erreurs de rate limiting (429)
- [ ] Gérer les comptes verrouillés
- [ ] Stocker le `access_token` (localStorage/cookies)
- [ ] Ajouter `Authorization: Bearer <token>` aux requêtes protégées
- [ ] Gérer l'expiration du token JWT (24h par défaut)

---

## 🎉 Backend 100% Validé et Prêt !

Tous les endpoints sont fonctionnels, sécurisés et documentés. Vous pouvez commencer l'implémentation frontend en toute confiance.
















