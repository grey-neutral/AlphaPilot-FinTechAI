import { Plus, FolderOpen } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { useSidebar } from "@/components/ui/sidebar";

export type Project = {
  id: string;
  name: string;
  createdAt: string;
};

interface AppSidebarProps {
  projects: Project[];
  selectedId?: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
}

export function AppSidebar({ projects, selectedId, onSelect, onNew }: AppSidebarProps) {
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";

  return (
    <Sidebar collapsible="icon" className={isCollapsed ? "w-14" : "w-64"}>
      <SidebarHeader>
        <div className="flex items-center justify-between px-2 py-1">
          {!isCollapsed && (
            <div className="text-sm font-semibold">Projects</div>
          )}
          <Button size="sm" variant="secondary" onClick={onNew} aria-label="New Project">
            <Plus />
            {!isCollapsed && <span>New Project</span>}
          </Button>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Recent</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {projects.length === 0 ? (
                <div className="text-sm text-muted-foreground px-2 py-1">No projects yet</div>
              ) : (
                projects.map((p) => (
                  <SidebarMenuItem key={p.id}>
                    <SidebarMenuButton
                      isActive={selectedId === p.id}
                      onClick={() => onSelect(p.id)}
                    >
                      <FolderOpen className="mr-2" />
                      {!isCollapsed && <span>{p.name}</span>}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
