"use client";

import { LogOut } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  ROLE_NAVIGATION,
  type UserRole,
} from "@/components/dashboard/navigation";
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
}

const roleDisplayLabels: Record<UserRole, string> = {
  ADMIN: "System Admin",
  DEPARTMENT_HEAD: "Department Head",
  STAFF: "Staff Member",
  END_USER: "End User",
};

export function DashboardSidebar({
  userRole,
  userName,
  userEmail,
  permissions = [],
}: DashboardSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);
  const [currentHash, setCurrentHash] = useState<string>("");
  const { isMobile, setOpenMobile } = useSidebar();

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
      itemHref !== "/dashboard" &&
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

  const navGroups = ROLE_NAVIGATION[userRole] || [];

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" render={<Link href="/" />}>
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-teal-700 text-sidebar-primary-foreground shadow-sm">
                <span className="text-lg font-bold text-white">G</span>
              </div>
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
                        {item.badge && (
                          <SidebarMenuBadge>{item.badge}</SidebarMenuBadge>
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

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              render={<div />}
              className="w-full justify-between hover:bg-transparent cursor-default"
            >
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-teal-50 text-teal-700 border border-teal-200/80 font-bold">
                  {userName.charAt(0).toUpperCase()}
                </div>
                <div className="flex flex-col gap-0.5 leading-none overflow-hidden">
                  <span className="font-semibold text-sm truncate">
                    {userName}
                  </span>
                  <div className="flex flex-col">
                    {userEmail && (
                      <span className="text-xs text-muted-foreground truncate">
                        {userEmail}
                      </span>
                    )}
                    <span className="text-xs text-muted-foreground truncate">
                      {roleDisplayLabels[userRole]}
                    </span>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                disabled={loggingOut}
                title="Sign out"
                aria-label="Sign out"
                className="rounded-md p-1.5 text-muted-foreground hover:bg-rose-50 hover:text-rose-600 transition-colors disabled:opacity-50 cursor-pointer flex-shrink-0"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
