# Windows Environment & Kaggle CLI Troubleshooting Guide

## Why a New Terminal Window May Prompt for Kaggle Authentication

On Windows, when an environment variable is set inside Command Prompt (`cmd.exe`) using:

```cmd
set KAGGLE_API_TOKEN=xxxxxxxxxxxxxx
```

that variable exists **only inside the memory of that specific `cmd.exe` process** and processes launched directly as children of that `cmd.exe` window. Any new PowerShell (`pwsh.exe`) or Command Prompt window spawned separately by an IDE or terminal manager will not inherit process-scoped `set` variables.

Furthermore, **Kaggle CLI v2.2.5** supports three persistent authentication mechanisms that work across all terminals without exposing secrets in source code:

1. **Recommended OAuth Login (Caches credentials in `~/.kaggle/credentials.json`)**:
   ```powershell
   kaggle auth login
   ```
2. **Access Token File (`C:\Users\<Username>\.kaggle\access_token`)**:
   Save your Kaggle API token string into `~/.kaggle/access_token` (no `.env` file in the repository needed).
3. **Run Acquisition from Your Authenticated Command Prompt**:
   Switch to the Command Prompt window where `kaggle competitions files -c nfl-big-data-bowl-2027` succeeded, navigate to `E:\projects\NFL`, and run:
   ```cmd
   cd /d E:\projects\NFL
   python scripts\acquire_data.py --tier tier1
   python scripts\profile_datasets.py
   python scripts\validate_metadata.py
   ```

## Handling `RequestsDependencyWarning` on Python 3.11

You may observe:
```text
RequestsDependencyWarning: urllib3 (2.7.0) or chardet (7.6.0)/charset_normalizer (3.2.0) doesn't match a supported version!
```
This is a benign warning from `requests.__init__` checking upper version bounds on `urllib3` / `chardet`. It does **not** prevent `kaggle` CLI or `pandas` from functioning, and `scripts/refresh_inventory.py` automatically filters out warning lines when parsing CSV output from the CLI. Do not downgrade global Python packages unless an actual runtime exception occurs.
