# 🏖️ AWS SES Mode Sandbox - Guide de Résolution

## ❌ Erreur actuelle

```
MessageRejected: Email address is not verified. 
The following identities failed the check in region EU-NORTH-1: momobounouar1@gmail.com
```

## ✅ Diagnostic

**Bonne nouvelle :** Les permissions IAM sont maintenant correctes ! ✅

**Problème :** Votre compte AWS SES est en mode **Sandbox**, ce qui limite l'envoi d'emails uniquement aux adresses vérifiées.

## 🎯 Solutions

### Solution 1 : Vérifier l'adresse email de destination (Développement/Test)

Pour tester rapidement, vous pouvez vérifier l'adresse email de destination :

1. **Console AWS SES** : https://console.aws.amazon.com/ses/
2. **Sélectionnez la région** : `eu-north-1` (en haut à droite)
3. Allez dans **"Verified identities"**
4. Cliquez sur **"Create identity"**
5. Sélectionnez **"Email address"**
6. Entrez l'adresse email de destination (ex: `momobounouar1@gmail.com`)
7. Cliquez sur **"Create identity"**
8. Vérifiez votre boîte email et cliquez sur le lien de vérification

**⚠️ Limitation :** Vous devrez vérifier chaque adresse email de destination, ce qui n'est pas pratique pour la production.

### Solution 2 : Demander l'accès Production (RECOMMANDÉ)

Pour envoyer des emails à n'importe quelle adresse, vous devez sortir du mode Sandbox :

1. **Console AWS SES** : https://console.aws.amazon.com/ses/
2. **Sélectionnez la région** : `eu-north-1`
3. Allez dans **"Account dashboard"** (ou **"Sending statistics"**)
4. Cliquez sur **"Request production access"** (ou **"Edit your account details"**)
5. Remplissez le formulaire avec :
   - **Mail Type** : Transactional (pour OTP, vérifications, etc.)
   - **Website URL** : URL de votre application
   - **Use case description** : 
     ```
     We need to send transactional emails (OTP codes, email verification, password resets) 
     to our users for authentication purposes. This is a legitimate business application.
     ```
   - **Additional contact email addresses** : Votre email de contact
   - **Acknowledge AWS service terms** : Cochez la case
6. Cliquez sur **"Submit"**

**⏱️ Délai :** Généralement approuvé en 24-48 heures (parfois plus rapide)

**✅ Avantages :**
- Envoyer à n'importe quelle adresse email
- Pas besoin de vérifier chaque adresse de destination
- Limites plus élevées (62,000 emails/jour par défaut)

### Solution 3 : Vérifier le domaine entier (Alternative)

Si vous avez un domaine, vous pouvez le vérifier :

1. **Console AWS SES** → **Verified identities** → **Create identity**
2. Sélectionnez **"Domain"**
3. Entrez votre domaine (ex: `reccos.ae`)
4. Suivez les instructions pour ajouter les enregistrements DNS
5. Une fois vérifié, vous pourrez envoyer depuis n'importe quelle adresse @reccos.ae

**Note :** Cela ne résout pas le problème du mode Sandbox pour les adresses de destination.

## 📊 Comparaison Sandbox vs Production

| Fonctionnalité | Sandbox | Production |
|---------------|---------|------------|
| Adresses de destination | Uniquement vérifiées | N'importe quelle adresse |
| Limite d'envoi | 200 emails/jour | 62,000 emails/jour (par défaut) |
| Limite de débit | 1 email/seconde | 14 emails/seconde (par défaut) |
| Adresse expéditrice | Doit être vérifiée | Doit être vérifiée |

## 🔍 Vérifier le statut de votre compte

1. **Console AWS SES** → **Account dashboard**
2. Regardez la section **"Sending limits"**
3. Si vous voyez **"Sandbox"**, vous êtes en mode Sandbox
4. Si vous voyez **"Production"**, vous avez l'accès production

## ✅ Checklist

### Pour le développement immédiat :
- [ ] Vérifier l'adresse email de destination dans SES (région `eu-north-1`)
- [ ] Tester l'envoi d'OTP

### Pour la production :
- [ ] Demander l'accès production dans SES Console
- [ ] Attendre l'approbation (24-48h)
- [ ] Vérifier que l'adresse expéditrice `contact@reccos.ae` est vérifiée
- [ ] Tester l'envoi à différentes adresses

## 🚀 Après avoir obtenu l'accès production

Une fois l'accès production approuvé :

1. **Vérifiez le statut** dans SES Console → Account dashboard
2. **Testez l'envoi** à une adresse non vérifiée
3. **Vérifiez les logs** du backend :
   - ✅ Succès : `Email sent successfully to ...`
   - ❌ Erreur : Vérifiez les autres configurations

## 📚 Ressources

- [Documentation AWS SES - Sortir du Sandbox](https://docs.aws.amazon.com/ses/latest/dg/request-production-access.html)
- [Limites AWS SES](https://docs.aws.amazon.com/ses/latest/dg/manage-sending-quotas.html)






