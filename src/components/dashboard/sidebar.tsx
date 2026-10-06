"use client";

import { ChevronsUpDown, LogOut } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  ROLE_NAVIGATION,
  type UserRole,
} from "@/components/dashboard/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Logo } from "@/components/ui/logo";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

interface DashboardSidebarProps {
  userRole: UserRole;
  userName: string;
  userEmail?: string;
  permissions?: string[];
  designation?: string;
  departmentName?: string;
}

function getDefaultDesignation(role: UserRole): string {
  switch (role) {
    case "ADMIN":
      return "System Administrator";
    case "DEPARTMENT_HEAD":
      return "Department Head";
    case "STAFF":
      return "Grievance Staff";
    case "END_USER":
      return "Employee";
    default:
      return "Staff";
  }
}

function getDefaultDepartment(role: UserRole): string {
  switch (role) {
    case "ADMIN":
      return "Central Administration";
    case "DEPARTMENT_HEAD":
      return "Department Queue";
    case "STAFF":
      return "Operations";
    case "END_USER":
      return "General Public";
    default:
      return "General";
  }
}

export function DashboardSidebar({
  userRole,
  userName,
  userEmail,
  permissions = [],
  designation,
  departmentName,
}: DashboardSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);
  const [currentHash, setCurrentHash] = useState<string>("");
  const { isMobile, setOpenMobile } = useSidebar();

  const [profileEmail, setProfileEmail] = useState<string | undefined>(
    userEmail,
  );
  const [profileInfo, setProfileInfo] = useState<{
    designation: string;
    departmentName: string;
  }>({
    designation: designation || getDefaultDesignation(userRole),
    departmentName: departmentName || getDefaultDepartment(userRole),
  });

  useEffect(() => {
    if (userEmail) {
      setProfileEmail(userEmail);
    }
  }, [userEmail]);

  useEffect(() => {
    setProfileInfo({
      designation: designation || getDefaultDesignation(userRole),
      departmentName: departmentName || getDefaultDepartment(userRole),
    });

    if (!designation || !departmentName || !userEmail) {
      let isMounted = true;
      fetch("/api/auth/me")
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (isMounted && data?.success && data?.user) {
            setProfileInfo({
              designation:
                designation ||
                data.user.designation ||
                getDefaultDesignation(userRole),
              departmentName:
                departmentName ||
                data.user.departmentName ||
                data.user.department_name ||
                getDefaultDepartment(userRole),
            });
            if (!userEmail && data.user.email) {
              setProfileEmail(data.user.email);
            }
          }
        })
        .catch(() => {});
      return () => {
        isMounted = false;
      };
    }
  }, [designation, departmentName, userEmail, userRole]);

  useEffect(() => {
    const updateHash = () => {
      if (typeof window !== "undefined") {
        setCurrentHash(window.location.hash.toLowerCase());
      }
    };

    updateHash();
    window.addEventListener("hashchange", updateHash);
    window.addEventListener("popstate", updateHash);

    return () => {
      window.removeEventListener("hashchange", updateHash);
      window.removeEventListener("popstate", updateHash);
    };
  }, []);

  const handleItemClick = (
    e: React.MouseEvent<HTMLAnchorElement>,
    itemHref: string,
  ) => {
    if (isMobile) {
      setOpenMobile(false);
    }

    if (itemHref.includes("#")) {
      const [itemPath, itemHash] = itemHref.split("#");
      if (pathname === itemPath) {
        e.preventDefault();
        const cleanHash = itemHash.toLowerCase();
        setCurrentHash(`#${cleanHash}`);
        window.location.hash = itemHash;
        window.dispatchEvent(new Event("hashchange"));
      }
    } else if (itemHref === pathname) {
      if (currentHash) {
        e.preventDefault();
        setCurrentHash("");
        if (window.location.hash) {
          history.replaceState(null, "", itemHref);
        }
        window.dispatchEvent(new Event("hashchange"));
      }
    }
  };

  const isItemActive = (itemHref: string) => {
    if (itemHref.includes("#")) {
      const [itemPath, itemHash] = itemHref.split("#");
      return (
        pathname === itemPath && currentHash === `#${itemHash.toLowerCase()}`
      );
    }

    if (pathname === itemHref) {
      return (
        !currentHash ||
        currentHash === "" ||
        currentHash === "#" ||
        currentHash === "#overview"
      );
    }

    return (
      itemHref !== "/admin/dashboard" &&
      itemHref !== "/end-user/dashboard" &&
      pathname.startsWith(itemHref)
    );
  };

  async function handleLogout() {
    try {
      setLoggingOut(true);
      await fetch("/api/auth/logout", { method: "POST" });
      router.refresh();
      router.push("/login");
    } catch (err) {
      console.error("Logout failed:", err);
      setLoggingOut(false);
    }
  }

  const [unreadNotifications, setUnreadNotifications] = useState<number>(0);

  useEffect(() => {
    let isMounted = true;
    const fetchUnread = async () => {
      try {
        const res = await fetch("/api/notifications/unread-count");
        if (res.ok) {
          const data = await res.json();
          if (isMounted && data.success && typeof data.count === "number") {
            setUnreadNotifications(data.count);
          }
        }
      } catch {
        // silent fallback
      }
    };

    fetchUnread();
    const interval = setInterval(fetchUnread, 30000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const navGroups = ROLE_NAVIGATION[userRole] || [];

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" render={<Link href="/" />}>
              <Logo size={32} />
              <div className="flex flex-col gap-0.5 leading-none">
                <span className="font-semibold text-base">GRS</span>
                <span className="text-xs text-muted-foreground uppercase tracking-wider">
                  Resolution Portal
                </span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        {navGroups.map((group) => {
          const visibleItems = group.items.filter((item) => {
            if (!item.requiredPermission) return true;
            return permissions.includes(item.requiredPermission);
          });

          if (visibleItems.length === 0) return null;

          return (
            <SidebarGroup key={group.label}>
              <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {visibleItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = isItemActive(item.href);
                    const isNotification =
                      item.title === "Notifications" ||
                      item.href.includes("/notifications");
                    const badgeContent =
                      isNotification && unreadNotifications > 0
                        ? unreadNotifications.toString()
                        : item.badge;

                    return (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton
                          isActive={isActive}
                          tooltip={item.title}
                          render={
                            <Link
                              href={item.href}
                              onClick={(e) => handleItemClick(e, item.href)}
                            />
                          }
                        >
                          <Icon />
                          <span>{item.title}</span>
                        </SidebarMenuButton>
                        {badgeContent && (
                          <SidebarMenuBadge
                            className={
                              isNotification
                                ? "bg-rose-500 text-white font-bold text-[10px] px-1.5 py-0.5 rounded-full"
                                : ""
                            }
                          >
                            {badgeContent}
                          </SidebarMenuBadge>
                        )}
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          );
        })}
      </SidebarContent>

      <SidebarFooter style={{ borderTop: "1px solid var(--sidebar-border)" }}>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <SidebarMenuButton
                    size="lg"
                    className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground w-full justify-between hover:bg-sidebar-accent cursor-pointer h-auto min-h-[3.25rem] py-2 px-2.5 group-data-[collapsible=icon]:p-0! group-data-[collapsible=icon]:size-8!"
                  />
                }
              >
                <div className="flex items-center gap-3 overflow-hidden min-w-0">
                  <div className="flex aspect-square size-9 items-center justify-center rounded-lg bg-teal-50 text-teal-700 border border-teal-200/80 font-bold shrink-0">
                    {userName.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex flex-col gap-0.5 leading-tight overflow-hidden min-w-0 text-left group-data-[collapsible=icon]:hidden">
                    <span className="font-semibold text-sm truncate text-sidebar-foreground">
                      {userName}
                    </span>
                    {profileInfo.designation && (
                      <span className="text-[11px] font-medium text-muted-foreground truncate">
                        {profileInfo.designation}
                      </span>
                    )}
                    {profileInfo.departmentName && (
                      <span className="text-[10px] text-teal-600 dark:text-teal-400 font-medium truncate">
                        {profileInfo.departmentName}
                      </span>
                    )}
                  </div>
                </div>
                <ChevronsUpDown className="h-4 w-4 shrink-0 text-sidebar-foreground ml-auto group-data-[collapsible=icon]:hidden" />
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                side={isMobile ? "bottom" : "right"}
                align="end"
                sideOffset={4}
              >
                <div className="flex items-center justify-start gap-2.5 p-2.5">
                  <div className="flex aspect-square size-9 items-center justify-center rounded-lg bg-teal-50 text-teal-700 border border-teal-200/80 font-bold shrink-0">
                    {userName.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex flex-col space-y-0.5 leading-tight overflow-hidden min-w-0">
                    {userName && (
                      <p className="font-semibold text-sm truncate text-sidebar-foreground">
                        {userName}
                      </p>
                    )}
                    {(userEmail || profileEmail) && (
                      <p className="truncate text-xs text-muted-foreground">
                        {userEmail || profileEmail}
                      </p>
                    )}
                  </div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-rose-600 focus:bg-rose-50 focus:text-rose-600 cursor-pointer"
                  onClick={handleLogout}
                  disabled={loggingOut}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
