export const permissions = {
  dashboardRead: "dashboard.read",
  projectsRead: "projects.read",
  projectsCreate: "projects.create",
  projectsUpdate: "projects.update",
  projectsPublish: "projects.publish",
  rolesRead: "roles.read",
  rolesManage: "roles.manage",
  usersRead: "users.read",
  membersManage: "members.manage",
  siteManage: "site.manage",
  usersManage: "users.manage",
} as const;

export type Permission = (typeof permissions)[keyof typeof permissions];

export function can(userPermissions: string[], permission: Permission) {
  return userPermissions.includes(permission);
}
