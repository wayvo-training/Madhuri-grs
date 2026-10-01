"use client";

import { ChevronsUpDown, LogOut } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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

      <SidebarFooter style={{ borderTop: "1px solid var(--sidebar-border)" }}>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <SidebarMenuButton
                    size="lg"
                    className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground w-full justify-between hover:bg-sidebar-accent cursor-pointer"
                  />
                }
              >
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-teal-50 text-teal-700 border border-teal-200/80 font-bold shrink-0">
                      {userName.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex flex-col gap-0.5 leading-none overflow-hidden">
                      <span className="font-semibold text-sm truncate text-sidebar-foreground">
                        {userName}
                      </span>
                    </div>
                  </div>
                  <ChevronsUpDown className="h-4 w-4 shrink-0 text-sidebar-foreground ml-auto" />
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                side={isMobile ? "bottom" : "right"}
                align="end"
                sideOffset={4}
              >
                <div className="flex items-center justify-start gap-2 p-2">
                  <div className="flex flex-col space-y-1 leading-none overflow-hidden">
                    {userName && (
                      <p className="font-medium text-sm truncate">{userName}</p>
                    )}
                    {userEmail && (
                      <p className="truncate text-xs text-muted-foreground">
                        {userEmail}
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
