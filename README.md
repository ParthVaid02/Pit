# TIT - A Simple Version Control System

TIT is a minimal version control system inspired by Git, written in Node.js. It allows you to initialize a repository, add files, commit changes, view commit logs, and see diffs between commits.

## Features

- Initialize a TIT repository
- Add files to the staging area
- Commit changes with messages
- View commit history
- Show diffs between commits

## Requirements

- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- npm (comes with Node.js)

## Installation

1. **Clone the repository:**

   ```sh
   git clone https://github.com/ParthVaid02/Pit.git
   cd TIT
   ```

2. **Install dependencies:**

   ```sh
   npm install
   ```

3. **Link the CLI tool globally:**
   ```sh
   sudo npm link
   ```
   This will make the `tit` command available anywhere on your system.

## Usage

Navigate to any project directory and use the following commands:

### Initialize a TIT repository

```sh
tit init
```

### Add a file to the staging area

```sh
tit add <filename>
```

### Commit staged changes

```sh
tit commit "your commit message"
```

### View commit history

```sh
tit log
```

### Show diff for a specific commit

```sh
tit diff <commitHash>
```

## Uninstall

To remove the global `tit` command:

```sh
sudo npm unlink -g tit
```

## Notes

- All TIT data is stored in a `.tit` directory in your project root.
- Make sure to run `tit` commands from the root of your project.

---

**Happy versioning!**
