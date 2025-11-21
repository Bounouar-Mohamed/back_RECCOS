/**
 * Enum des rôles utilisateur disponibles dans l'application
 * 
 * Hiérarchie des permissions (du plus restrictif au plus permissif) :
 * - CLIENT : Utilisateur standard, accès limité aux fonctionnalités de base
 * - DEVELOPER : Développeur, accès aux APIs et outils de développement
 * - ADMIN : Administrateur, accès complet à toutes les fonctionnalités
 */
export enum UserRole {
  /**
   * Rôle CLIENT
   * - Utilisateur standard de l'application
   * - Peut créer un compte, se connecter, gérer son profil
   * - Accès aux fonctionnalités publiques et à ses propres données
   * - Peut effectuer des achats (après vérification KYC)
   */
  CLIENT = 'client',

  /**
   * Rôle DEVELOPER
   * - Développeur ou partenaire technique
   * - Accès aux APIs de développement
   * - Peut tester les fonctionnalités
   * - Accès aux logs et métriques (selon configuration)
   */
  DEVELOPER = 'developer',

  /**
   * Rôle ADMIN
   * - Administrateur système
   * - Accès complet à toutes les fonctionnalités
   * - Gestion des utilisateurs
   * - Configuration de l'application
   * - Accès aux données sensibles
   */
  ADMIN = 'admin',
}

/**
 * Rôle par défaut lors de l'inscription
 */
export const DEFAULT_USER_ROLE = UserRole.CLIENT;

/**
 * Liste de tous les rôles disponibles
 */
export const ALL_ROLES = Object.values(UserRole);

/**
 * Vérifie si un rôle est valide
 */
export function isValidRole(role: string): role is UserRole {
  return Object.values(UserRole).includes(role as UserRole);
}

/**
 * Hiérarchie des rôles (pour vérification des permissions)
 * Plus le niveau est élevé, plus les permissions sont importantes
 */
export const ROLE_HIERARCHY: Record<UserRole, number> = {
  [UserRole.CLIENT]: 1,
  [UserRole.DEVELOPER]: 2,
  [UserRole.ADMIN]: 3,
};

/**
 * Vérifie si un rôle a au moins le niveau de permissions d'un autre rôle
 */
export function hasRolePermission(userRole: UserRole, requiredRole: UserRole): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
}
















