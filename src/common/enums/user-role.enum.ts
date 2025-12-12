/**
 * Enum des rôles utilisateur disponibles dans l'application
 * 
 * Hiérarchie des permissions (du plus restrictif au plus permissif) :
 * - CLIENT : Utilisateur standard, accès limité aux fonctionnalités de base
 * - ADMIN : Administrateur, gestion avancée (espace admin)
 * - SUPERADMIN : Super administrateur, accès complet + gestion des comptes et rôles
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
   * Rôle ADMIN
   * - Administrateur système
   * - Accès aux fonctionnalités d'administration (propriétés, promoteurs, performances, etc.)
   * - Accès aux données sensibles nécessaires à l'administration
   */
  ADMIN = 'admin',

  /**
   * Rôle SUPERADMIN
   * - Super administrateur de la plateforme
   * - Accès complet à toutes les fonctionnalités
   * - Gestion des utilisateurs et de leurs rôles
   * - Gestion des statuts et de la configuration globale
   */
  SUPERADMIN = 'superadmin',
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
  [UserRole.ADMIN]: 2,
  [UserRole.SUPERADMIN]: 3,
};

/**
 * Vérifie si un rôle a au moins le niveau de permissions d'un autre rôle
 */
export function hasRolePermission(userRole: UserRole, requiredRole: UserRole): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
}
















