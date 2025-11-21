# Configuration Amazon SES

Amazon SES est déjà pré-configuré dans le backend. Ce guide explique comment le configurer complètement.

## ✅ Configuration actuelle

Le service `EmailService` est déjà implémenté et configuré pour utiliser Amazon SES via AWS SDK v3.

### Variables d'environnement requises

Dans votre fichier `.env` du backend, configurez :

```env
# Adresse email expéditrice (doit être vérifiée dans AWS SES)
EMAIL_FROM=noreply@yourdomain.com

# Credentials AWS pour Amazon SES
AWS_ACCESS_KEY_ID=your-aws-access-key-id
AWS_SECRET_ACCESS_KEY=your-aws-secret-access-key
# ⚠️ IMPORTANT : La région doit correspondre à celle de votre configuration SES
# Exemples : us-east-1, eu-north-1, eu-west-1, etc.
# Vérifiez dans AWS SES Console → la région où vous avez vérifié votre email/domaine
AWS_REGION=us-east-1
```

## 📋 Étapes de configuration AWS SES

### 1. Créer un compte AWS (si nécessaire)

1. Allez sur [AWS Console](https://console.aws.amazon.com/)
2. Créez un compte ou connectez-vous

### 2. Activer Amazon SES

1. Dans la console AWS, recherchez "SES" (Simple Email Service)
2. Sélectionnez la région appropriée (ex: `us-east-1`, `eu-west-1`)
3. Activez le service

### 3. Vérifier votre adresse email ou domaine

**Option A : Vérifier une adresse email (Sandbox - développement)**

1. Dans SES Console → "Verified identities"
2. Cliquez sur "Create identity"
3. Sélectionnez "Email address"
4. Entrez votre email (ex: `noreply@yourdomain.com`)
5. Cliquez sur "Create identity"
6. Vérifiez votre boîte email et cliquez sur le lien de vérification

**Option B : Vérifier un domaine (Production - recommandé)**

1. Dans SES Console → "Verified identities"
2. Cliquez sur "Create identity"
3. Sélectionnez "Domain"
4. Entrez votre domaine (ex: `yourdomain.com`)
5. Suivez les instructions pour ajouter les enregistrements DNS
6. Une fois vérifié, vous pourrez envoyer depuis n'importe quelle adresse @yourdomain.com

### 4. Créer des credentials IAM

1. Allez dans **IAM Console** → "Users"
2. Cliquez sur "Create user"
3. Nommez l'utilisateur (ex: `ses-email-sender`)
4. Sélectionnez "Attach policies directly"
5. Recherchez et attachez la politique `AmazonSESFullAccess` (ou créez une politique personnalisée plus restrictive)
6. Cliquez sur "Next" puis "Create user"
7. Cliquez sur l'utilisateur créé → "Security credentials"
8. Cliquez sur "Create access key"
9. Sélectionnez "Application running outside AWS"
10. Copiez l'**Access Key ID** et le **Secret Access Key**
11. ⚠️ **IMPORTANT** : Sauvegardez le Secret Access Key immédiatement (il ne sera plus visible)

### 5. Sortir du Sandbox (pour la production)

Par défaut, AWS SES est en mode "Sandbox" qui limite :
- Envoi uniquement vers des adresses vérifiées
- Maximum 200 emails/jour
- Maximum 1 email/seconde

Pour sortir du Sandbox :
1. Dans SES Console → "Account dashboard"
2. Cliquez sur "Request production access"
3. Remplissez le formulaire avec :
   - Type d'utilisation (transactional, marketing, etc.)
   - Site web de votre application
   - Description de votre cas d'usage
4. Soumettez la demande (généralement approuvée en 24-48h)

## 🔧 Configuration dans le backend

### Vérifier que les variables sont chargées

Le service `EmailService` vérifie automatiquement si les credentials sont présents :

- ✅ Si `AWS_ACCESS_KEY_ID` et `AWS_SECRET_ACCESS_KEY` sont définis → SES est activé
- ⚠️ Si non définis → Les emails sont simulés (loggés dans la console)

### Tester la configuration

1. Démarrez le backend :
```bash
cd /srv/all4one/backend
bun run start:dev
```

2. Vérifiez les logs au démarrage :
   - ✅ `Amazon SES client initialized successfully` → Configuration OK
   - ⚠️ `AWS credentials not configured; emails will be logged instead of sent.` → Variables manquantes

3. Testez l'envoi d'un email via l'endpoint OTP :
```bash
curl -X POST http://localhost:3000/api/auth/send-otp \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com"}'
```

4. Vérifiez les logs :
   - ✅ `Email sent successfully to test@example.com. MessageId: ...` → Succès
   - ❌ `Failed to send email to test@example.com: ...` → Erreur (vérifiez les credentials et la vérification de l'email)

## 🔒 Sécurité

### Bonnes pratiques

1. **Ne jamais commiter le fichier `.env`** dans Git
2. **Utiliser des credentials IAM avec permissions minimales** (pas `AmazonSESFullAccess` en production)
3. **Créer une politique IAM personnalisée** avec uniquement les permissions SES nécessaires :
   ```json
   {
     "Version": "2012-10-17",
     "Statement": [
       {
         "Effect": "Allow",
         "Action": [
           "ses:SendEmail",
           "ses:SendRawEmail"
         ],
         "Resource": "*"
       }
     ]
   }
   ```

### Variables d'environnement

Les variables sont chargées depuis :
- Fichier `.env` (développement)
- Variables d'environnement système (production)
- Configuration Docker/Kubernetes (déploiement)

## 📧 Utilisation dans le code

Le service `EmailService` est déjà injecté dans `AuthModule` et utilisé dans `AuthService` pour :
- ✅ Envoi d'OTP pour login/signup
- ✅ Emails de vérification
- ✅ Réinitialisation de mot de passe
- ✅ Codes 2FA par email

Aucune modification de code nécessaire - il suffit de configurer les variables d'environnement.

## 🐛 Dépannage

### Erreur : "Email address is not verified"

**Cause** : L'adresse email dans `EMAIL_FROM` n'est pas vérifiée dans AWS SES.

**Solution** : Vérifiez l'adresse email dans la console SES ou utilisez un domaine vérifié.

### Erreur : "User is not authorized to perform: ses:SendEmail"

**Cause** : Les credentials IAM n'ont pas les permissions SES.

**Solution** : Attachez la politique `AmazonSESFullAccess` ou une politique personnalisée avec les permissions SES.

### Erreur : "Message rejected: Email address is not verified"

**Cause** : Vous êtes en mode Sandbox et essayez d'envoyer à une adresse non vérifiée.

**Solution** : 
- Vérifiez l'adresse de destination dans SES, OU
- Demandez l'accès production dans SES Console

### Les emails ne sont pas envoyés (simulation)

**Cause** : Les variables `AWS_ACCESS_KEY_ID` ou `AWS_SECRET_ACCESS_KEY` ne sont pas définies.

**Solution** : Vérifiez que les variables sont bien définies dans votre fichier `.env` et redémarrez le serveur.

## 📚 Ressources

- [Documentation AWS SES](https://docs.aws.amazon.com/ses/)
- [AWS SES Pricing](https://aws.amazon.com/ses/pricing/)
- [AWS SDK v3 for JavaScript](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-ses/)

