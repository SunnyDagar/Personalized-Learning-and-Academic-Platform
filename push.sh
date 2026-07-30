#!/usr/bin/env bash
#
# Daily helper — pull, show what you changed, commit, push.
#
#   ./push.sh "added tests for the flashcard deck"
#   ./push.sh                 # will prompt you for the message
#
# Run it from the repository root after you have done your work.
set -euo pipefail
cd "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

BOLD=$'\033[1m'; DIM=$'\033[2m'; GREEN=$'\033[32m'; RED=$'\033[31m'; YEL=$'\033[33m'; OFF=$'\033[0m'

# --- who are you? -----------------------------------------------------------
NAME=$(git config user.name || true)
if [ -z "$NAME" ]; then
  echo "${RED}Your git identity is not set.${OFF} Run these once:"
  echo '  git config --global user.name  "Your Name"'
  echo '  git config --global user.email "your@email.com"'
  exit 1
fi

echo "${BOLD}Working as:${OFF} $NAME <$(git config user.email)>"

# --- get the latest first ---------------------------------------------------
echo "${BOLD}1/4 Pulling the latest…${OFF}"
if ! git pull --rebase --autostash; then
  echo "${RED}Pull failed.${OFF} Someone else's work conflicts with yours."
  echo "Fix the conflicting files, then run:  git rebase --continue"
  exit 1
fi

# --- what changed? ----------------------------------------------------------
if [ -z "$(git status --porcelain)" ]; then
  echo "${YEL}Nothing to commit — you have not changed any files yet.${OFF}"
  echo "Do your work first (see your module's WORK_PLAN.md), then run this again."
  exit 0
fi

echo "${BOLD}2/4 Your changes:${OFF}"
git status --short | sed 's/^/    /'
echo "${DIM}    $(git diff --shortstat HEAD | sed 's/^ *//')${OFF}"

# --- safety: never publish a secret ----------------------------------------
if git diff --cached --name-only HEAD 2>/dev/null | grep -q 'config\.php$' \
   || git status --porcelain | grep -q 'server-edge/config\.php'; then
  echo "${RED}Refusing to continue: server-edge/config.php contains your tenant key.${OFF}"
  echo "It should be git-ignored. Tell Sunny before doing anything else."
  exit 1
fi

# --- message ----------------------------------------------------------------
MSG="${1:-}"
if [ -z "$MSG" ]; then
  read -r -p "$(printf "%s3/4 What did you change?%s " "$BOLD" "$OFF")" MSG
fi
[ -z "$MSG" ] && { echo "${RED}A commit message is required.${OFF}"; exit 1; }

FIRST=$(echo "$NAME" | awk '{print $1}')
case "$MSG" in "$FIRST"*) FULL="$MSG" ;; *) FULL="$FIRST: $MSG" ;; esac

# --- commit and push --------------------------------------------------------
git add -A
git commit -q -m "$FULL"
echo "${BOLD}4/4 Pushing…${OFF}"
git push -q origin HEAD

echo "${GREEN}Pushed.${OFF}  $(git log -1 --format='%h  %an  —  %s')"
echo "${DIM}https://github.com/SunnyDagar/Personalized-Learning-and-Academic-Platform/commits/main${OFF}"
