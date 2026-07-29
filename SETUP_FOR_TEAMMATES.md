# Setup — how to push your part

Send this to each team member. **Run these on YOUR OWN computer, logged in as YOUR OWN GitHub account.**

> ⚠️ Paste **one line at a time**. Pasting the whole block at once can get mangled by the shell
> (lines starting with `#` will show `command not found`).

---

## Step 1 — Accept the repo invitation
Sign in to GitHub as yourself, then open:

**https://github.com/SunnyDagar/Personalized-Learning-and-Academic-Platform/invitations**

Click **Accept invitation**. (You'll also get an email and a 🔔 notification.)
You cannot push until you've accepted.

## Step 2 — Sign in to the GitHub CLI (as yourself)
```
gh auth login
```
Choose: **GitHub.com** → **HTTPS** → **Login with a web browser**. It opens your browser; no password is
typed into the terminal.

*Alternative:* create your own Personal Access Token at github.com/settings/tokens (scope `repo`) and
git will ask for it as the password on your first push.

## Step 3 — Set your commit identity
Use **your own** name and email so your commits are credited to you.
```
git config --global user.name "Your Name"
```
```
git config --global user.email "your.email@example.com"
```

## Step 4 — Get the code
```
git clone https://github.com/SunnyDagar/Personalized-Learning-and-Academic-Platform.git
```
```
cd Personalized-Learning-and-Academic-Platform
```

## Step 5 — Work in YOUR module only
| Member | Folder |
|---|---|
| Sanchit Chhabra | `modules/sanchit_core_overview/` |
| Surender (Sunny) Dagar | `modules/sunny_data_pipeline/` |
| Arnold Babu | `modules/arnold_portals/` |
| Félicité Gamgne Domgue | `modules/felicity_architecture/` |
| Hafsa Shabbeer | `modules/hafsa_business_engine/` |

## Step 6 — Commit and push
```
git add .
```
```
git commit -m "Your Name: what you changed"
```
```
git push
```

## Step 7 — Check it worked
Open the repo on GitHub and look at **Commits** — your name should appear as the author.
Or run:
```
git log --oneline -3
```

---

## Troubleshooting

| Problem | Fix |
|---|---|
| `Permission denied` / `403` on push | You haven't accepted the invitation (Step 1), or you're signed in as the wrong account — check with `gh api user --jq .login` |
| `Repository not found` | Same as above — wrong account, or the invite isn't accepted |
| Push asks for a password | Passwords were disabled in 2021. Use `gh auth login`, or a Personal Access Token as the password |
| `command not found: #` | You pasted comment lines. Paste one command at a time |
| Commits show the wrong name | Your `git config --global user.name/email` is set to someone else. Re-run Step 3 with your own details |
| `rejected — non-fast-forward` | Someone else pushed first. Run `git pull --rebase` then `git push` |

## Ground rules
- Commit **your own real work**, on **real dates**, under **your own account**.
- **No shared logins, no backdated commits, no placeholder/empty files** — the instructor may execute this code.
- **Never commit secrets** (API keys, passwords, `.env`). This repository is **public**.
