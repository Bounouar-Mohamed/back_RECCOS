# 🔐 Permissions IAM Requises pour Amazon SES

## 📋 Résumé

Pour que l'application puisse envoyer des emails via Amazon SES, l'utilisateur IAM a besoin des permissions suivantes :

### Permissions minimales (recommandé pour production)

- ✅ `ses:SendEmail` - Envoyer des emails simples
- ✅ `ses:SendRawEmail` - Envoyer des emails avec pièces jointes (optionnel, pour futures fonctionnalités)

### Permissions complètes (pour développement/test)

- ✅ `AmazonSESFullAccess` - Toutes les permissions SES (plus simple mais moins sécurisé)

---

## 🎯 Option 1 : Politique Minimale (RECOMMANDÉ pour production)

Cette politique donne uniquement les permissions nécessaires pour envoyer des emails.

### Créer la politique dans AWS IAM

1. **Console AWS IAM** → **Policies** → **Create policy**
2. Cliquez sur l'onglet **JSON**
3. Collez le JSON suivant :

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AllowSendEmail",
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

4. Cliquez sur **Next**
5. Nommez la politique : `SES-SendEmail-Only`
6. Description : `Permissions minimales pour envoyer des emails via SES`
7. Cliquez sur **Create policy**

### Attacher la politique à l'utilisateur

1. **IAM Console** → **Users** → `ses-smtp-user.20251117-015021`
2. Onglet **Permissions** → **Add permissions**
3. Sélectionnez **Attach policies directly**
4. Recherchez `SES-SendEmail-Only`
5. Cochez la case → **Next** → **Add permissions**

---

## 🎯 Option 2 : Politique avec Restrictions par Identité (Plus sécurisé)

Cette politique limite l'envoi d'emails uniquement depuis l'identité vérifiée `contact@reccos.ae`.

### JSON de la politique

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AllowSendEmailFromVerifiedIdentity",
      "Effect": "Allow",
      "Action": [
        "ses:SendEmail",
        "ses:SendRawEmail"
      ],
      "Resource": "arn:aws:ses:eu-north-1:154341157879:identity/contact@reccos.ae"
    }
  ]
}
```

**Note :** Remplacez `154341157879` par votre Account ID AWS et `eu-north-1` par votre région si différente.

---

## 🎯 Option 3 : Politique Complète (AmazonSESFullAccess)

Cette politique donne toutes les permissions SES. **Utilisez uniquement pour le développement/test**.

### Attacher directement la politique AWS

1. **IAM Console** → **Users** → `ses-smtp-user.20251117-015021`
2. Onglet **Permissions** → **Add permissions**
3. Sélectionnez **Attach policies directly**
4. Recherchez `AmazonSESFullAccess`
5. Cochez la case → **Next** → **Add permissions**

### Permissions incluses dans AmazonSESFullAccess

Cette politique inclut (entre autres) :
- `ses:SendEmail`
- `ses:SendRawEmail`
- `ses:GetSendQuota`
- `ses:GetSendStatistics`
- `ses:ListIdentities`
- `ses:GetIdentityVerificationAttributes`
- `ses:VerifyEmailIdentity`
- `ses:DeleteIdentity`
- Et toutes les autres actions SES

**⚠️ Attention :** Cette politique est très permissive. En production, préférez une politique minimale.

---

## 📝 Détails des Permissions

### `ses:SendEmail`

**Description :** Permet d'envoyer des emails simples (HTML et texte) via l'API SES.

**Utilisé par :** `EmailService.sendMail()` → `SendEmailCommand`

**Nécessaire :** ✅ **OUI** - C'est la permission principale utilisée par l'application

### `ses:SendRawEmail`

**Description :** Permet d'envoyer des emails avec pièces jointes et format personnalisé.

**Utilisé par :** Actuellement non utilisé, mais peut être nécessaire pour futures fonctionnalités

**Nécessaire :** ⚠️ **Optionnel** - Recommandé pour éviter les erreurs futures

---

## 🔍 Vérification des Permissions

### Méthode 1 : Via la Console AWS

1. **IAM Console** → **Users** → `ses-smtp-user.20251117-015021`
2. Onglet **Permissions**
3. Vérifiez que la politique contient `ses:SendEmail`

### Méthode 2 : Via AWS CLI

```bash
aws iam list-user-policies --user-name ses-smtp-user.20251117-015021
aws iam list-attached-user-policies --user-name ses-smtp-user.20251117-015021
```

### Méthode 3 : Test d'envoi

Si l'envoi d'email fonctionne, les permissions sont correctes. Si vous obtenez `AccessDenied`, les permissions sont manquantes ou incorrectes.

---

## 🚀 Recommandations

### Pour le Développement

✅ Utilisez `AmazonSESFullAccess` pour simplifier la configuration

### Pour la Production

✅ Utilisez une politique minimale avec uniquement :
- `ses:SendEmail`
- `ses:SendRawEmail` (optionnel mais recommandé)

✅ Si possible, restreignez par identité (Option 2) pour limiter l'envoi à `contact@reccos.ae`

---

## 📚 Références

- [Documentation AWS SES - Permissions requises](https://docs.aws.amazon.com/ses/latest/dg/control-user-access.html)
- [Documentation AWS IAM - Créer des politiques](https://docs.aws.amazon.com/IAM/latest/UserGuide/access_policies_create.html)
- [Actions SES disponibles](https://docs.aws.amazon.com/service-authorization/latest/reference/list_amazonses.html)

---

## ✅ Checklist de Configuration

- [ ] Politique IAM créée (minimale ou complète)
- [ ] Politique attachée à l'utilisateur `ses-smtp-user.20251117-015021`
- [ ] Permissions propagées (attendre 1-2 minutes)
- [ ] Email `contact@reccos.ae` vérifié dans SES (région `eu-north-1`)
- [ ] Variables `.env` correctes :
  ```env
  EMAIL_FROM=contact@reccos.ae
  AWS_ACCESS_KEY_ID=...
  AWS_SECRET_ACCESS_KEY=...
  AWS_REGION=eu-north-1
  ```
- [ ] Backend redémarré
- [ ] Test d'envoi d'email réussi

---

## 🆘 Dépannage

### Erreur : "User is not authorized to perform: ses:SendEmail"

**Cause :** Les permissions ne sont pas attachées ou ne se sont pas propagées.

**Solution :**
1. Vérifiez que la politique est bien attachée à l'utilisateur
2. Attendez 1-2 minutes pour la propagation
3. Redémarrez le backend

### Erreur : "Email address is not verified"

**Cause :** L'email `contact@reccos.ae` n'est pas vérifié dans SES.

**Solution :**
1. Console AWS SES → Région `eu-north-1`
2. Verified identities → Vérifiez que `contact@reccos.ae` est listée et vérifiée

### Les permissions sont attachées mais ça ne fonctionne toujours pas

**Vérifications :**
1. Les credentials IAM correspondent-ils à l'utilisateur ?
2. La région dans `.env` correspond-elle à celle de SES ?
3. L'email est-il vérifié dans la bonne région ?






