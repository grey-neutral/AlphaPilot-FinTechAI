import { useState } from "react";
import { Plus, FolderOpen, Pencil } from "lucide-react";
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
import { Input } from "@/components/ui/input";

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
  onRename: (id: string, name: string) => void;
}

export function AppSidebar({ projects, selectedId, onSelect, onNew, onRename }: AppSidebarProps) {
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";
  const [editingId, setEditingId] = useState<string | null>(null);
  const [tempName, setTempName] = useState("");

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
                      onClick={editingId === p.id ? undefined : () => onSelect(p.id)}
                    >
                      <FolderOpen className="mr-2" />
                      {!isCollapsed && (
                        editingId === p.id ? (
                          <Input
                            autoFocus
                            value={tempName}
                            onChange={(e) => setTempName(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                const name = tempName.trim() || "Untitled";
                                onRename(p.id, name);
                                setEditingId(null);
                              } else if (e.key === "Escape") {
                                setEditingId(null);
                              }
                            }}
                            onBlur={() => {
                              if (editingId === p.id) {
                                const name = tempName.trim() || "Untitled";
                                onRename(p.id, name);
                                setEditingId(null);
                              }
                            }}
                            className="h-8"
                          />
                        ) : (
                          <span className="flex-1 truncate">{p.name}</span>
                        )
                      )}
                      {!isCollapsed && editingId !== p.id && (
                        <button
                          type="button"
                          className="ml-auto text-muted-foreground hover:text-foreground"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingId(p.id);
                            setTempName(p.name);
                          }}
                          aria-label={`Rename ${p.name}`}
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                      )}
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
