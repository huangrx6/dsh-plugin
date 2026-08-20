#!/bin/bash
# Wait for the most recent MCP evaluate_script output to land in the spill directory,
# then extract its base64 PNG and save to the requested workspace path.
#
# Usage:
#   ./scripts/capture_dsh.sh <output_path>
#
# Side-channel: relies on the chrome-devtools MCP server writing each tool result to
# /var/folders/<tmp>/dsh-spill-<rand>/session-<id>/<call_id>-mcp__chrome-devtools__evaluate_script.txt.
# We pick the newest matching file mtime.

# Bash 3.2 (macOS default) treats `set -e` strictly — the
# `awk '{print \$2}'` in a subshell and any non-zero return from
# `find | xargs | sort | head` would silently kill the script.
# Just run defensively without it.


out_path="$1"
if [ -z "$out_path" ]; then
  echo "usage: $0 <output.png>" >&2
  exit 2
fi

# Newest mtime first; the sort + head gives us the most recent matching file.
spill="$(find /var/folders -type f -name '*mcp__chrome-devtools__evaluate_script.txt' \
        2>/dev/null \
        | xargs stat -f '%m %N' \
        | sort -nr \
        | head -n 1 \
        | awk '{print $2}')"
if [ -z "$spill" ]; then
  echo "no evaluate_script spill file found" >&2
  exit 3
fi
printf '[capture] using %s\n' "$spill" >&2

python3 - "$spill" "$out_path" << 'PY'
import re, base64, os, sys
spill, out = sys.argv[1], sys.argv[2]
with open(spill) as f:
    txt = f.read()
m = re.search(r'"data:image/png;base64,([A-Za-z0-9+/=]+)"', txt)
if not m:
    print("ERROR: data URL not found in spill", file=sys.stderr)
    print(txt[:200], file=sys.stderr)
    sys.exit(4)
data = base64.b64decode(m.group(1))
os.makedirs(os.path.dirname(out), exist_ok=True)
with open(out, 'wb') as f:
    f.write(data)
print(f'wrote {out}: {os.path.getsize(out)} bytes', file=sys.stderr)
PY
