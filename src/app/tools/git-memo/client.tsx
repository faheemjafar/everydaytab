"use client";

import { useMemo, useState } from "react";
import { ToolLayout } from "@/components/tool-layout";
import { Input } from "@/components/ui/input";
import { CopyButton, Field, StatusBadge, ToolPanel } from "@/components/tool";
import { cn } from "@/lib/utils";

type Cmd = { cmd: string; desc: string; danger?: boolean };
const SECTIONS: { title: string; items: Cmd[] }[] = [
  { title: "Setup", items: [
    { cmd: 'git config --global user.name "<name>"', desc: "Set the name recorded on your commits" },
    { cmd: 'git config --global user.email "<email>"', desc: "Set the email recorded on your commits" },
    { cmd: "git config --global init.defaultBranch main", desc: "Use main for new repositories" },
    { cmd: "git config --global pull.rebase true", desc: "Rebase instead of merge when pulling" },
    { cmd: "git config --list --show-origin", desc: "Show all settings and where they come from" },
  ] },
  { title: "Start a repository", items: [
    { cmd: "git init", desc: "Create a repository in the current folder" },
    { cmd: "git clone <url>", desc: "Download a repository and its history" },
    { cmd: "git clone --depth 1 <url>", desc: "Shallow clone — latest snapshot only, much faster" },
    { cmd: "git remote add origin <url>", desc: "Connect a local repo to a remote" },
    { cmd: "git remote -v", desc: "List remotes and their URLs" },
  ] },
  { title: "Everyday work", items: [
    { cmd: "git status -sb", desc: "Short status with branch info" },
    { cmd: "git add <file>", desc: "Stage a file" },
    { cmd: "git add -p", desc: "Stage changes interactively, hunk by hunk" },
    { cmd: 'git commit -m "<message>"', desc: "Commit staged changes" },
    { cmd: "git commit -am \"<message>\"", desc: "Stage all tracked files and commit" },
    { cmd: "git diff", desc: "Unstaged changes" },
    { cmd: "git diff --staged", desc: "Staged changes (what will be committed)" },
    { cmd: "git pull", desc: "Fetch and integrate remote changes" },
    { cmd: "git push -u origin <branch>", desc: "Push a new branch and set its upstream" },
  ] },
  { title: "Branches", items: [
    { cmd: "git switch -c <branch>", desc: "Create and switch to a new branch" },
    { cmd: "git switch <branch>", desc: "Switch to an existing branch" },
    { cmd: "git switch -", desc: "Go back to the previous branch" },
    { cmd: "git branch -a", desc: "List local and remote branches" },
    { cmd: "git branch -d <branch>", desc: "Delete a merged branch" },
    { cmd: "git branch -D <branch>", desc: "Force-delete a branch (even if unmerged)", danger: true },
    { cmd: "git push origin --delete <branch>", desc: "Delete a remote branch", danger: true },
    { cmd: "git branch -m <new-name>", desc: "Rename the current branch" },
  ] },
  { title: "Merge & rebase", items: [
    { cmd: "git merge <branch>", desc: "Merge a branch into the current one" },
    { cmd: "git merge --no-ff <branch>", desc: "Always create a merge commit" },
    { cmd: "git rebase main", desc: "Replay your commits on top of main" },
    { cmd: "git rebase -i HEAD~<n>", desc: "Edit, squash, reorder or drop the last n commits" },
    { cmd: "git rebase --continue", desc: "Continue after resolving conflicts (or --abort)" },
    { cmd: "git cherry-pick <commit>", desc: "Apply one commit from another branch" },
    { cmd: "git merge --abort", desc: "Give up a merge that has conflicts" },
  ] },
  { title: "Undo & fix mistakes", items: [
    { cmd: "git restore <file>", desc: "Discard unstaged changes to a file", danger: true },
    { cmd: "git restore --staged <file>", desc: "Unstage a file (keep the changes)" },
    { cmd: "git commit --amend", desc: "Edit the last commit (message or content)" },
    { cmd: "git commit --amend --no-edit", desc: "Add staged changes to the last commit" },
    { cmd: "git reset --soft HEAD~1", desc: "Undo the last commit, keep changes staged" },
    { cmd: "git reset --hard HEAD~1", desc: "Delete the last commit and its changes", danger: true },
    { cmd: "git revert <commit>", desc: "Create a new commit that undoes a commit — safe on shared branches" },
    { cmd: "git reflog", desc: "Every position HEAD has been — recover “lost” commits" },
    { cmd: "git clean -fd", desc: "Delete untracked files and folders", danger: true },
    { cmd: "git push --force-with-lease", desc: "Force-push only if nobody else pushed meanwhile", danger: true },
  ] },
  { title: "Stash", items: [
    { cmd: 'git stash push -m "<message>"', desc: "Shelve uncommitted changes" },
    { cmd: "git stash -u", desc: "Stash including untracked files" },
    { cmd: "git stash list", desc: "List stashes" },
    { cmd: "git stash pop", desc: "Re-apply the latest stash and remove it" },
    { cmd: "git stash apply stash@{<n>}", desc: "Re-apply a stash but keep it" },
  ] },
  { title: "History & search", items: [
    { cmd: "git log --oneline --graph --decorate --all", desc: "Compact visual history of all branches" },
    { cmd: "git log -p <file>", desc: "Every change to a file" },
    { cmd: 'git log -S "<text>"', desc: "Find commits that added or removed text" },
    { cmd: "git blame <file>", desc: "Who last changed each line" },
    { cmd: "git show <commit>", desc: "Show a commit's changes" },
    { cmd: "git bisect start", desc: "Binary-search for the commit that introduced a bug" },
    { cmd: "git grep \"<text>\"", desc: "Search tracked files" },
  ] },
  { title: "Tags & releases", items: [
    { cmd: 'git tag -a v<version> -m "<message>"', desc: "Create an annotated tag" },
    { cmd: "git push origin --tags", desc: "Push all tags" },
    { cmd: "git describe --tags", desc: "Nearest tag + commits since" },
  ] },
  { title: "Advanced", items: [
    { cmd: "git worktree add ../<folder> <branch>", desc: "Check out another branch in a second folder" },
    { cmd: "git submodule update --init --recursive", desc: "Fetch submodules after cloning" },
    { cmd: "git sparse-checkout set <folder>", desc: "Only check out part of a large repo" },
    { cmd: "git gc --prune=now", desc: "Clean up and compress the repository" },
  ] },
];

export default function GitCheatSheet() {
  const [q, setQ] = useState("");
  const [vals, setVals] = useState<Record<string, string>>({ branch: "", url: "", file: "", message: "" });

  const fill = (cmd: string) => cmd.replace(/<([\w-]+)>/g, (m, k) => vals[k] || m);
  const t = q.trim().toLowerCase();
  const sections = useMemo(() => SECTIONS.map((s) => ({ ...s, items: s.items.filter((i) => !t || i.cmd.toLowerCase().includes(t) || i.desc.toLowerCase().includes(t) || s.title.toLowerCase().includes(t)) })).filter((s) => s.items.length), [t]);
  const total = sections.reduce((n, s) => n + s.items.length, 0);

  return (
    <ToolLayout toolId="git-memo">
      <div className="space-y-3">
        <ToolPanel bodyClassName="p-3 space-y-3">
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search — e.g. undo, rename branch, stash, force" className="h-11" autoFocus />
          <div className="flex flex-wrap gap-3">
            {(["branch", "url", "file", "message"] as const).map((k) => (
              <Field key={k} label={`<${k}>`} htmlFor={`v-${k}`}>
                <Input id={`v-${k}`} value={vals[k]} onChange={(e) => setVals((v) => ({ ...v, [k]: e.target.value }))} placeholder={k === "url" ? "git@github.com:me/repo.git" : k} className="w-44 font-mono" />
              </Field>
            ))}
          </div>
          <p className="text-[11px] text-muted-foreground">Fill placeholders once and every command below uses them. {total} commands.</p>
        </ToolPanel>

        <div className="grid gap-3 lg:grid-cols-2">
          {sections.map((s) => (
            <ToolPanel key={s.title} title={s.title}>
              <ul className="divide-y divide-border">
                {s.items.map((i) => {
                  const c = fill(i.cmd);
                  return (
                    <li key={i.cmd} className="group flex items-start gap-2 px-3.5 py-2">
                      <div className="flex-1 min-w-0">
                        <code className={cn("block font-mono text-[12.5px] break-all", i.danger && "text-red-700 dark:text-red-400")}>{c}</code>
                        <p className="text-xs text-muted-foreground">
                          {i.desc}
                          {i.danger && <StatusBadge tone="error" className="ml-1.5">destructive</StatusBadge>}
                        </p>
                      </div>
                      <CopyButton text={c} iconOnly className="opacity-60 group-hover:opacity-100" />
                    </li>
                  );
                })}
              </ul>
            </ToolPanel>
          ))}
        </div>
        {!sections.length && <p className="text-center text-xs text-muted-foreground py-8">No commands match “{q}”.</p>}
      </div>
    </ToolLayout>
  );
}
