# 🔐 Guide Étape par Étape : Ajouter les Permissions SES à l'utilisateur IAM

## ❌ Erreur actuelle

```
AccessDenied: User `arn:aws:iam::154341157879:user/ses-smtp-user.20251117-015021' 
is not authorized to perform `ses:SendEmail' on resource 
`arn:aws:ses:eu-north-1:154341157879:identity/contact@reccos.ae'
```

**Diagnostic :** La région est correcte (`eu-north-1`), mais l'utilisateur IAM n'a pas les permissions pour envoyer des emails.

---

## ✅ Solution : Ajouter les Permissions IAM

### Étape 1 : Accéder à la Console AWS IAM

1. Ouvrez votre navigateur et allez sur : **https://console.aws.amazon.com/iam/**
2. Connectez-vous avec votre compte AWS
3. Assurez-vous d'être dans la bonne région (peu importe pour IAM, mais vérifiez que vous êtes sur le bon compte AWS)

### Étape 2 : Trouver l'utilisateur IAM

1. Dans le menu de gauche, cliquez sur **"Users"** (Utilisateurs)
2. Dans la barre de recherche, tapez : `ses-smtp-user.20251117-015021`
3. Cliquez sur l'utilisateur trouvé

### Étape 3 : Vérifier les permissions actuelles

1. Cliquez sur l'onglet **"Permissions"** (ou **"Permissions policies"**)
2. Regardez la liste des politiques attachées
3. Si vous ne voyez **PAS** `AmazonSESFullAccess` ou une politique avec `ses:SendEmail`, continuez à l'étape 4

### Étape 4 : Ajouter la politique AmazonSESFullAccess

1. Cliquez sur le bouton **"Add permissions"** (Ajouter des permissions)
2. Sélectionnez **"Attach policies directly"** (Attacher des politiques directement)
3. Dans la barre de recherche, tapez : `AmazonSESFullAccess`
4. Cochez la case à côté de **`AmazonSESFullAccess`**
5. Cliquez sur **"Next"** (Suivant)
6. Cliquez sur **"Add permissions"** (Ajouter des permissions)

### Étape 5 : Vérifier que les permissions sont ajoutées

1. Vous devriez voir un message de confirmation
2. Retournez à l'onglet **"Permissions"**
3. Vous devriez maintenant voir **`AmazonSESFullAccess`** dans la liste

### Étape 6 : Attendre la propagation (1-2 minutes)

Les permissions IAM peuvent prendre 1-2 minutes à se propager. Attendez un peu avant de tester.

---

## 🧪 Tester après avoir ajouté les permissions

### Option 1 : Via le frontend

1. Allez sur votre page de login/register
2. Entrez votre email
3. Vérifiez que vous recevez l'email OTP

### Option 2 : Via curl (terminal)

```bash
curl -X POST http://localhost:3000/api/auth/send-otp \
  -H "Content-Type: application/json" \
  -d '{"email": "votre-email@example.com"}'
```

### Vérifier les logs du backend

Dans les logs du backend, vous devriez voir :
- ✅ **Succès** : `Email sent successfully to ... MessageId: ...`
- ❌ **Erreur** : Si l'erreur persiste, vérifiez les étapes ci-dessus

---

## 🔍 Dépannage si ça ne fonctionne toujours pas

### Vérification 1 : Les permissions sont-elles bien attachées ?

1. IAM Console → Users → `ses-smtp-user.20251117-015021`
2. Onglet Permissions
3. Vérifiez que `AmazonSESFullAccess` est bien listée

### Vérification 2 : L'email est-il vérifié dans la bonne région ?

1. **Console AWS SES** : https://console.aws.amazon.com/ses/
2. **Sélectionnez la région** : `eu-north-1` (en haut à droite)
3. Allez dans **"Verified identities"**
4. Vérifiez que `contact@reccos.ae` est listée et marquée comme **"Verified"**

### Vérification 3 : Les credentials sont-ils corrects ?

Vérifiez dans votre `.env` :
```env
EMAIL_FROM=contact@reccos.ae
AWS_ACCESS_KEY_ID=AKIA... (doit correspondre à l'utilisateur IAM)
AWS_SECRET_ACCESS_KEY=... (doit correspondre à l'utilisateur IAM)
AWS_REGION=eu-north-1
```

### Vérification 4 : Le backend a-t-il été redémarré ?

Si vous avez modifié le `.env`, redémarrez le backend :
```bash
# Arrêtez le serveur (Ctrl+C)
cd /srv/all4one/backend
bun run start:dev
```

---

## 📝 Checklist finale

- [ ] L'utilisateur IAM `ses-smtp-user.20251117-015021` a la politique `AmazonSESFullAccess`
- [ ] L'email `contact@reccos.ae` est vérifié dans SES (région `eu-north-1`)
- [ ] Le `.env` contient `AWS_REGION=eu-north-1`
- [ ] Le `.env` contient `EMAIL_FROM=contact@reccos.ae`
- [ ] Les `AWS_ACCESS_KEY_ID` et `AWS_SECRET_ACCESS_KEY` correspondent à l'utilisateur IAM
- [ ] Le backend a été redémarré après modifications
- [ ] Attendu 1-2 minutes après avoir ajouté les permissions

---

## 🆘 Si rien ne fonctionne

1. **Vérifiez que vous êtes sur le bon compte AWS** (le compte ID dans l'erreur est `154341157879`)
2. **Vérifiez que l'utilisateur IAM existe** dans ce compte
3. **Contactez le support AWS** si les permissions ne se propagent pas après 5 minutes

---

## 📚 Ressources

- [Documentation AWS IAM - Gérer les utilisateurs](https://docs.aws.amazon.com/IAM/latest/UserGuide/id_users_manage.html)
- [Documentation AWS SES - Permissions requises](https://docs.aws.amazon.com/ses/latest/dg/control-user-access.html)






