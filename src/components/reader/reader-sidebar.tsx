"use client";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useReaderStore } from "./reader-store";
import { PageNavigator } from "./page-navigator";
import { HighlightsPanel } from "./highlights-panel";
import { BookmarksPanel } from "./bookmarks-panel";
import { NotesList } from "./notes-list";

export function ReaderSidebar() {
    const tab = useReaderStore((s) => s.sidebarTab);
    const setTab = useReaderStore((s) => s.setSidebarTab);

    return (
        <aside className="thin-scrollbar flex h-full w-72 shrink-0 flex-col overflow-hidden border-r border-neutral-200 bg-white/80 backdrop-blur dark:border-neutral-800 dark:bg-neutral-950/80">
            <div className="p-2">
                <Tabs
                    value={tab}
                    onValueChange={(v) => setTab(v as typeof tab)}
                >
                    <TabsList className="w-full">
                        <TabsTrigger value="pages">Pages</TabsTrigger>
                        <TabsTrigger value="notes">Notes</TabsTrigger>
                        <TabsTrigger value="highlights">Marks</TabsTrigger>
                        <TabsTrigger value="bookmarks">Saved</TabsTrigger>
                    </TabsList>
                    <TabsContent value="pages" className="px-1 pt-2">
                        <PageNavigator />
                    </TabsContent>
                    <TabsContent value="notes" className="px-1 pt-2">
                        <NotesList compact />
                    </TabsContent>
                    <TabsContent value="highlights" className="px-1 pt-2">
                        <HighlightsPanel />
                    </TabsContent>
                    <TabsContent value="bookmarks" className="px-1 pt-2">
                        <BookmarksPanel />
                    </TabsContent>
                </Tabs>
            </div>
        </aside>
    );
}
