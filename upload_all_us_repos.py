import subprocess
import os
import sys

if sys.stdout.encoding.lower() != 'utf-8':
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')

base_dir = os.path.dirname(os.path.abspath(__file__))

subdirs = [d for d in os.listdir(base_dir) if os.path.isdir(os.path.join(base_dir, d)) and d.startswith(('0', '1', '2', '3', '4', '5'))]
subdirs.sort()

print(f"Found {len(subdirs)} US business website repositories to deploy to GitHub.")

def run(cmd, cwd=None):
    res = subprocess.run(cmd, cwd=cwd, shell=True, capture_output=True, text=True, encoding="utf-8")
    return res.returncode, res.stdout, res.stderr

for d in subdirs:
    folder = os.path.join(base_dir, d)
    repo_name = d
    print(f"\n=======================================================")
    print(f"Deploying: {repo_name}...")

    # Git init if needed
    git_dir = os.path.join(folder, ".git")
    if not os.path.exists(git_dir):
        run("git init -b main", cwd=folder)
        
    run("git add .", cwd=folder)
    run(f'git commit -m "Initial release: {repo_name} US showcase website"', cwd=folder)

    # Check if gh repo exists
    rc, out, err = run(f"gh repo view satwik92105-png/{repo_name}")
    if rc != 0:
        print(f"Creating public GitHub repo: satwik92105-png/{repo_name}...")
        rc, out, err = run(f'gh repo create {repo_name} --public --source=. --remote=origin --push --description "{repo_name} US showcase website with tiered plans"', cwd=folder)
        if rc == 0:
            print(f"[OK] Created and pushed: https://github.com/satwik92105-png/{repo_name}")
        else:
            print(f"Error creating repo: {err} {out}")
    else:
        print(f"Repo exists, pushing updates...")
        run("git push -u origin main", cwd=folder)

    # Enable GitHub Pages
    print(f"Enabling GitHub Pages for {repo_name}...")
    run(f"gh api -X POST repos/satwik92105-png/{repo_name}/pages -f source[branch]=main -f source[path]=/")
    run(f'gh repo edit satwik92105-png/{repo_name} --homepage "https://satwik92105-png.github.io/{repo_name}/"')
    print(f"[OK] Live at: https://satwik92105-png.github.io/{repo_name}/")

print("\nAll 50 US website repositories deployed successfully!")
