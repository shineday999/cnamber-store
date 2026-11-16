#!/usr/bin/env bash
# push 目前分支，並觸發部署 workflow（workflow_dispatch），等部署結果
# 指定 workflow：DEPLOY_WORKFLOW=deploy.yml bash scripts/ship.sh
set -euo pipefail
BRANCH="$(git branch --show-current)"
echo ">> push $BRANCH"
git push -u origin "$BRANCH"

command -v gh >/dev/null 2>&1 || { echo "!! 沒有 gh CLI，已 push 但無法自動部署（安裝後執行 gh auth login）"; exit 0; }

WF="${DEPLOY_WORKFLOW:-}"
if [ -z "$WF" ]; then
  for f in .github/workflows/*.yml .github/workflows/*.yaml; do
    [ -f "$f" ] || continue
    if grep -q "workflow_dispatch" "$f" && grep -qiE "deploy|wrangler|pages" "$f"; then WF="$(basename "$f")"; break; fi
  done
fi
[ -n "$WF" ] || { echo "!! 找不到含 workflow_dispatch 的部署 workflow，已 push 但未部署（可用 DEPLOY_WORKFLOW=檔名 指定）"; exit 0; }

echo ">> 觸發部署：$WF（ref=$BRANCH）"
gh workflow run "$WF" --ref "$BRANCH"
sleep 6
RUN_ID="$(gh run list --workflow "$WF" --branch "$BRANCH" --limit 1 --json databaseId -q '.[0].databaseId')"
[ -n "$RUN_ID" ] || { echo "!! 找不到剛觸發的 run，請到 GitHub Actions 查看"; exit 0; }
gh run watch "$RUN_ID" --exit-status
echo ">> 部署完成"
